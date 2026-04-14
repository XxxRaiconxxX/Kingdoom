import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Coins,
  Shield,
  Sparkles,
  Swords,
  TimerReset,
  UserRound,
} from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import { NARRATIVE_ENCOUNTERS } from "../data/pve";
import type { NarrativeEncounter } from "../data/pve";

type ExpeditionPhase = "select" | "battle" | "resolved";
type BattleAction = "attack" | "guard" | "ability" | "retreat";
type BattleOutcome = "victory" | "defeat" | "retreat" | null;

type BattleLogEntry = {
  id: string;
  tone: "neutral" | "good" | "bad" | "lore";
  text: string;
};

type BattleState = {
  encounterId: string;
  playerHp: number;
  enemyHp: number;
  turn: number;
  guardActive: boolean;
  abilityCooldown: number;
  result: BattleOutcome;
  reward: number;
  entryFee: number;
  logs: BattleLogEntry[];
};

const INITIAL_PLAYER_HP = 100;

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function threatLabel(level: NarrativeEncounter["enemyThreat"]) {
  switch (level) {
    case "high":
      return "Alta amenaza";
    case "medium":
      return "Amenaza media";
    default:
      return "Riesgo controlado";
  }
}

function toneClasses(tone: BattleLogEntry["tone"]) {
  switch (tone) {
    case "good":
      return "border-emerald-500/20 bg-emerald-500/8 text-emerald-200";
    case "bad":
      return "border-rose-500/20 bg-rose-500/8 text-rose-200";
    case "lore":
      return "border-sky-500/20 bg-sky-500/8 text-sky-100";
    default:
      return "border-stone-800 bg-stone-950/55 text-stone-300";
  }
}

export function TavernExpedition() {
  const { player, isHydrating, setPlayerGold, refreshPlayer } = usePlayerSession();
  const [selectedEncounterId, setSelectedEncounterId] = useState<string>(
    NARRATIVE_ENCOUNTERS[0]?.id ?? ""
  );
  const [phase, setPhase] = useState<ExpeditionPhase>("select");
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const selectedEncounter = useMemo(
    () =>
      NARRATIVE_ENCOUNTERS.find((encounter) => encounter.id === selectedEncounterId) ??
      NARRATIVE_ENCOUNTERS[0],
    [selectedEncounterId]
  );

  async function startEncounter() {
    if (!player || !selectedEncounter || isUpdating) {
      return;
    }

    if (player.gold < selectedEncounter.entryFee) {
      return;
    }

    setIsUpdating(true);
    const updated = await setPlayerGold(player.gold - selectedEncounter.entryFee);
    setIsUpdating(false);

    if (!updated) {
      return;
    }

    setBattle({
      encounterId: selectedEncounter.id,
      playerHp: INITIAL_PLAYER_HP,
      enemyHp: selectedEncounter.enemyHp,
      turn: 1,
      guardActive: false,
      abilityCooldown: 0,
      result: null,
      reward: 0,
      entryFee: selectedEncounter.entryFee,
      logs: [
        {
          id: crypto.randomUUID(),
          tone: "lore",
          text: `${selectedEncounter.atmosphere} El contrato ya esta sellado y ${selectedEncounter.entryFee} de oro quedan comprometidos en la expedicion.`,
        },
      ],
    });
    setPhase("battle");
  }

  async function resolveBattle(action: BattleAction) {
    if (!player || !battle || !selectedEncounter || battle.result || isUpdating) {
      return;
    }

    let nextPlayerHp = battle.playerHp;
    let nextEnemyHp = battle.enemyHp;
    let nextGuardActive = false;
    let nextAbilityCooldown = Math.max(0, battle.abilityCooldown - 1);
    let outcome: BattleOutcome = null;
    let payout = 0;
    const logs: BattleLogEntry[] = [];

    if (action === "retreat") {
      payout = Math.floor(battle.entryFee * 0.35);
      outcome = "retreat";
      logs.push({
        id: crypto.randomUUID(),
        tone: "neutral",
        text: `Te retiras antes del golpe final. Recuperas ${payout} de oro en provisiones y rutas vendidas al mercado negro.`,
      });
    } else {
      if (action === "attack") {
        const dealt = randomBetween(14, 24);
        nextEnemyHp = Math.max(0, nextEnemyHp - dealt);
        logs.push({
          id: crypto.randomUUID(),
          tone: "good",
          text: `Tu acero encuentra una abertura y arrancas ${dealt} puntos de resistencia a ${selectedEncounter.enemyName}.`,
        });
      }

      if (action === "guard") {
        nextGuardActive = true;
        const brace = randomBetween(4, 8);
        nextPlayerHp = Math.min(INITIAL_PLAYER_HP, nextPlayerHp + brace);
        logs.push({
          id: crypto.randomUUID(),
          tone: "neutral",
          text: `Adoptas postura defensiva, estabilizas la respiracion y recuperas ${brace} de temple.`,
        });
      }

      if (action === "ability") {
        const dealt = randomBetween(26, 42);
        nextEnemyHp = Math.max(0, nextEnemyHp - dealt);
        nextAbilityCooldown = 2;
        logs.push({
          id: crypto.randomUUID(),
          tone: "good",
          text: `Canalizas tu recurso arcano y descargas una tecnica mayor por ${dealt} de dano narrativo.`,
        });
      }

      if (nextEnemyHp <= 0) {
        payout = randomBetween(selectedEncounter.rewardMin, selectedEncounter.rewardMax);
        outcome = "victory";
        logs.push({
          id: crypto.randomUUID(),
          tone: "lore",
          text: `${selectedEncounter.enemyName} cae entre ecos y ruinas. El botin asciende a ${payout} de oro.`,
        });
      } else {
        const baseEnemyDamage = randomBetween(
          selectedEncounter.enemyAttackMin,
          selectedEncounter.enemyAttackMax
        );
        const enemyDamage = nextGuardActive
          ? Math.max(4, Math.floor(baseEnemyDamage * 0.45))
          : baseEnemyDamage;

        nextPlayerHp = Math.max(0, nextPlayerHp - enemyDamage);
        logs.push({
          id: crypto.randomUUID(),
          tone: "bad",
          text: `${selectedEncounter.enemyName} responde con violencia y te hiere por ${enemyDamage}.`,
        });

        if (nextPlayerHp <= 0) {
          outcome = "defeat";
          logs.push({
            id: crypto.randomUUID(),
            tone: "bad",
            text: "Tu expedicion se rompe. El contrato queda perdido y debes volver al reino con las manos vacias.",
          });
        }
      }
    }

    const nextBattle: BattleState = {
      ...battle,
      playerHp: nextPlayerHp,
      enemyHp: nextEnemyHp,
      turn: battle.turn + 1,
      guardActive: nextGuardActive,
      abilityCooldown: nextAbilityCooldown,
      result: outcome,
      reward: payout,
      logs: [...logs, ...battle.logs].slice(0, 10),
    };

    setBattle(nextBattle);

    if (!outcome) {
      return;
    }

    if (payout > 0) {
      setIsUpdating(true);
      const freshPlayer = await refreshPlayer();
      const goldBase = freshPlayer?.gold ?? player.gold;
      await setPlayerGold(goldBase + payout);
      setIsUpdating(false);
    }

    setPhase("resolved");
  }

  function resetExpedition() {
    setBattle(null);
    setPhase("select");
  }

  if (isHydrating) {
    return <ExpeditionPlaceholder title="Expedicion narrativa" description="Preparando los contratos del reino..." />;
  }

  if (!player) {
    return (
      <ExpeditionPlaceholder
        title="Expedicion narrativa"
        description="Conecta tu perfil del reino para aceptar contratos, arriesgar oro y cobrar botin."
      />
    );
  }

  return (
    <div className="rounded-[2rem] border border-stone-800 bg-stone-900/80 p-5 shadow-[inset_0_4px_30px_rgba(0,0,0,0.45)] md:p-7">
      <div className="flex flex-col gap-5">
        <div className="rounded-[1.6rem] border border-stone-800 bg-stone-950/50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Contratista activo
                </p>
                <p className="text-xl font-black text-stone-100">{player.username}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                Oro disponible
              </p>
              <p className="text-2xl font-black text-amber-400">{player.gold}</p>
            </div>
          </div>
        </div>

        {phase === "select" && selectedEncounter ? (
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              {NARRATIVE_ENCOUNTERS.map((encounter) => {
                const active = encounter.id === selectedEncounter.id;
                return (
                  <button
                    key={encounter.id}
                    type="button"
                    onClick={() => setSelectedEncounterId(encounter.id)}
                    className={`w-full rounded-[1.6rem] border p-4 text-left transition ${
                      active
                        ? "border-amber-400/30 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                        : "border-stone-800 bg-stone-950/45"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/85">
                          {encounter.realm}
                        </p>
                        <h3 className="mt-2 text-lg font-black text-stone-100">
                          {encounter.title}
                        </h3>
                      </div>
                      <span className="rounded-full border border-stone-700 bg-stone-900/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-300">
                        {threatLabel(encounter.enemyThreat)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-stone-400">
                      {encounter.summary}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-stone-300">
                      <div className="rounded-xl border border-stone-800 bg-stone-900/80 px-3 py-2">
                        Entrada: {encounter.entryFee}
                      </div>
                      <div className="rounded-xl border border-stone-800 bg-stone-900/80 px-3 py-2">
                        Botin: {encounter.rewardMin}-{encounter.rewardMax}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-[1.8rem] border border-stone-800 bg-gradient-to-br from-stone-900 to-stone-950 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400/80">
                Expedicion activa
              </p>
              <h3 className="mt-3 text-2xl font-black text-stone-100">
                {selectedEncounter.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                Enemigo objetivo: <span className="font-semibold text-stone-200">{selectedEncounter.enemyName}</span>
              </p>

              <div className="mt-5 space-y-3">
                <InfoBlock icon={BookOpen} label="Cronica" value={selectedEncounter.atmosphere} />
                <InfoBlock icon={Sparkles} label="Patron enemigo" value={selectedEncounter.enemyTrait} />
                <InfoBlock
                  icon={Coins}
                  label="Economia del contrato"
                  value={`Entrada ${selectedEncounter.entryFee} de oro. Recompensa estimada entre ${selectedEncounter.rewardMin} y ${selectedEncounter.rewardMax}.`}
                />
              </div>

              <button
                type="button"
                onClick={() => void startEncounter()}
                disabled={isUpdating || player.gold < selectedEncounter.entryFee}
                className="mt-6 w-full rounded-2xl bg-amber-500 px-4 py-4 text-sm font-black text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {player.gold < selectedEncounter.entryFee
                  ? "Oro insuficiente para este contrato"
                  : "Aceptar contrato"}
              </button>
            </div>
          </div>
        ) : null}

        {(phase === "battle" || phase === "resolved") && battle && selectedEncounter ? (
          <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-4">
              <div className="rounded-[1.6rem] border border-stone-800 bg-stone-950/55 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400/80">
                      Enfrentamiento
                    </p>
                    <h3 className="mt-2 text-xl font-black text-stone-100">
                      {selectedEncounter.enemyName}
                    </h3>
                  </div>
                  <span className="rounded-full border border-stone-700 bg-stone-900/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-300">
                    Turno {battle.turn}
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  <HpBar label="Tu resistencia" value={battle.playerHp} max={INITIAL_PLAYER_HP} tone="player" />
                  <HpBar label="Resistencia enemiga" value={battle.enemyHp} max={selectedEncounter.enemyHp} tone="enemy" />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <InfoTile icon={Shield} title="Guardia" value={battle.guardActive ? "Preparada" : "Libre"} />
                  <InfoTile
                    icon={TimerReset}
                    title="Habilidad"
                    value={battle.abilityCooldown > 0 ? `${battle.abilityCooldown} turnos` : "Lista"}
                  />
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-stone-800 bg-stone-950/55 p-5">
                <h4 className="text-sm font-black uppercase tracking-[0.18em] text-stone-200">
                  Acciones
                </h4>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <ActionButton
                    label="Atacar"
                    hint="Dano estable"
                    icon={Swords}
                    disabled={phase !== "battle" || isUpdating}
                    onClick={() => void resolveBattle("attack")}
                  />
                  <ActionButton
                    label="Defender"
                    hint="Reduce golpe"
                    icon={Shield}
                    disabled={phase !== "battle" || isUpdating}
                    onClick={() => void resolveBattle("guard")}
                  />
                  <ActionButton
                    label="Habilidad"
                    hint="Golpe mayor"
                    icon={Sparkles}
                    disabled={phase !== "battle" || isUpdating || battle.abilityCooldown > 0}
                    onClick={() => void resolveBattle("ability")}
                  />
                  <ActionButton
                    label="Retirarse"
                    hint="Recupera algo"
                    icon={BookOpen}
                    disabled={phase !== "battle" || isUpdating}
                    onClick={() => void resolveBattle("retreat")}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-stone-800 bg-stone-950/55 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400/80">
                    Relato del combate
                  </p>
                  <h4 className="mt-2 text-xl font-black text-stone-100">
                    Bitacora de la expedicion
                  </h4>
                </div>
                {battle.result ? (
                  <span
                    className={`rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] ${
                      battle.result === "victory"
                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                        : battle.result === "retreat"
                          ? "border border-amber-500/30 bg-amber-500/10 text-amber-200"
                          : "border border-rose-500/30 bg-rose-500/10 text-rose-200"
                    }`}
                  >
                    {battle.result === "victory"
                      ? "Victoria"
                      : battle.result === "retreat"
                        ? "Retirada"
                        : "Derrota"}
                  </span>
                ) : null}
              </div>

              <div className="mt-5 space-y-3">
                {battle.logs.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-[1.3rem] border px-4 py-3 text-sm leading-6 ${toneClasses(entry.tone)}`}
                  >
                    {entry.text}
                  </motion.div>
                ))}
              </div>

              {phase === "resolved" ? (
                <div className="mt-5 rounded-[1.4rem] border border-stone-800 bg-stone-900/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Cierre del contrato
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    {battle.result === "victory"
                      ? `Cobras ${battle.reward} de oro y vuelves al reino con la historia intacta.`
                      : battle.result === "retreat"
                        ? `Recuperas ${battle.reward} de oro y conservas solo fragmentos del contrato.`
                        : "La expedicion se pierde. Esta vez el reino se queda sin botin."}
                  </p>
                  <button
                    type="button"
                    onClick={resetExpedition}
                    className="mt-4 w-full rounded-2xl bg-stone-100 px-4 py-3 text-sm font-black text-stone-950 transition hover:bg-white"
                  >
                    Tomar otro contrato
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function HpBar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "player" | "enemy";
}) {
  const width = `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
  const colorClass = tone === "player" ? "from-emerald-400 to-emerald-600" : "from-rose-400 to-rose-600";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-stone-300">{label}</p>
        <p className="text-sm font-black text-stone-100">{value}/{max}</p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-stone-800">
        <div className={`h-full rounded-full bg-gradient-to-r ${colorClass}`} style={{ width }} />
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof Shield;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-stone-800 bg-stone-900/80 p-3">
      <div className="flex items-center gap-2 text-stone-500">
        <Icon className="h-4 w-4" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">{title}</p>
      </div>
      <p className="mt-2 text-sm font-bold text-stone-100">{value}</p>
    </div>
  );
}

function ActionButton({
  label,
  hint,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string;
  hint: string;
  icon: typeof Swords;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-[1.3rem] border border-stone-800 bg-stone-900/80 px-4 py-4 text-left transition hover:border-amber-400/30 hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-45"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-black text-stone-100">{label}</p>
          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">{hint}</p>
        </div>
      </div>
    </button>
  );
}

function InfoBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.3rem] border border-stone-800 bg-stone-950/55 p-4">
      <div className="flex items-center gap-2 text-amber-400">
        <Icon className="h-4 w-4" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">{label}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-stone-300">{value}</p>
    </div>
  );
}

function ExpeditionPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[2rem] border border-stone-800 bg-stone-900/80 p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
        <BookOpen className="h-8 w-8" />
      </div>
      <h3 className="mt-4 text-2xl font-black text-stone-100">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-stone-400">{description}</p>
    </div>
  );
}
