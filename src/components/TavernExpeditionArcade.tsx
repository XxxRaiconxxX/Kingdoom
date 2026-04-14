import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeAlert,
  Bolt,
  Coins,
  Shield,
  Sparkles,
  Swords,
  UserRound,
} from "lucide-react";
import { usePlayerSession } from "../context/PlayerSessionContext";
import { ARCADE_ENCOUNTERS } from "../data/pve";

type CombatAction = "attack" | "ability" | "defend";
type CombatResult = "idle" | "active" | "victory" | "defeat";
type CombatLogTone = "neutral" | "good" | "bad" | "warn";

type CombatLog = {
  id: string;
  tone: CombatLogTone;
  text: string;
};

type ArcadeBattleState = {
  encounterId: string;
  playerHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  turn: number;
  abilityCooldown: number;
  phaseTwoTriggered: boolean;
  result: CombatResult;
  reward: number;
  entryFee: number;
  logs: CombatLog[];
};

const PLAYER_MAX_HP = 100;
const ATTACK_CRIT_CHANCE = 0.2;
const ABILITY_CRIT_CHANCE = 0.32;
const DEFENSE_DODGE_CHANCE = 0.28;
const DEFENSE_REDUCE_CHANCE = 0.5;

function rollChance(chance: number) {
  return Math.random() < chance;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function difficultyLabel(difficulty: "controlled" | "medium" | "hard") {
  switch (difficulty) {
    case "hard":
      return "Dificil";
    case "medium":
      return "Medio";
    default:
      return "Controlado";
  }
}

function difficultyTone(difficulty: "controlled" | "medium" | "hard") {
  switch (difficulty) {
    case "hard":
      return "border-rose-500/25 bg-rose-500/10 text-rose-200";
    case "medium":
      return "border-amber-500/25 bg-amber-500/10 text-amber-200";
    default:
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
  }
}

function logToneClasses(tone: CombatLogTone) {
  switch (tone) {
    case "good":
      return "border-emerald-500/20 bg-emerald-500/8 text-emerald-100";
    case "bad":
      return "border-rose-500/20 bg-rose-500/8 text-rose-100";
    case "warn":
      return "border-amber-500/20 bg-amber-500/8 text-amber-100";
    default:
      return "border-stone-800 bg-stone-950/55 text-stone-300";
  }
}

function createLog(text: string, tone: CombatLogTone): CombatLog {
  return {
    id: crypto.randomUUID(),
    tone,
    text,
  };
}

export function TavernExpeditionArcade() {
  const { player, isHydrating, setPlayerGold, refreshPlayer } = usePlayerSession();
  const [selectedEncounterId, setSelectedEncounterId] = useState(
    ARCADE_ENCOUNTERS[0]?.id ?? ""
  );
  const [battle, setBattle] = useState<ArcadeBattleState | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const selectedEncounter = useMemo(
    () =>
      ARCADE_ENCOUNTERS.find((encounter) => encounter.id === selectedEncounterId) ??
      ARCADE_ENCOUNTERS[0],
    [selectedEncounterId]
  );

  async function startRun() {
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
      playerHp: PLAYER_MAX_HP,
      enemyHp: selectedEncounter.enemyHp,
      enemyMaxHp: selectedEncounter.enemyHp,
      turn: 1,
      abilityCooldown: 0,
      phaseTwoTriggered: false,
      result: "active",
      reward: 0,
      entryFee: selectedEncounter.entryFee,
      logs: [
        createLog(
          `Contrato abierto contra ${selectedEncounter.enemyName}. Entrada pagada: ${selectedEncounter.entryFee} de oro.`,
          "warn"
        ),
      ],
    });
  }

  async function resolveAction(action: CombatAction) {
    if (!battle || !selectedEncounter || !player || battle.result !== "active" || isUpdating) {
      return;
    }

    let nextPlayerHp = battle.playerHp;
    let nextEnemyHp = battle.enemyHp;
    let nextCooldown = Math.max(0, battle.abilityCooldown - 1);
    let nextPhaseTwo = battle.phaseTwoTriggered;
    let result: CombatResult = "active";
    let reward = 0;
    const logs: CombatLog[] = [];

    if (action === "attack" || action === "ability") {
      const rawDamage =
        action === "attack" ? randomBetween(17, 29) : randomBetween(28, 44);
      const critChance = action === "attack" ? ATTACK_CRIT_CHANCE : ABILITY_CRIT_CHANCE;
      const wasCrit = rollChance(critChance);
      let inflictedDamage = wasCrit ? Math.floor(rawDamage * 1.75) : rawDamage;

      if (action === "ability") {
        nextCooldown = 2;
      }

      if (rollChance(selectedEncounter.enemyEvasionChance)) {
        inflictedDamage = 0;
        logs.push(
          createLog(
            `${selectedEncounter.enemyName} se desplaza a tiempo y esquiva por completo tu ${action === "attack" ? "ataque" : "habilidad"}.`,
            "bad"
          )
        );
      } else if (rollChance(selectedEncounter.enemyGuardChance)) {
        inflictedDamage = Math.max(6, Math.floor(inflictedDamage * 0.45));
        logs.push(
          createLog(
            `${selectedEncounter.enemyName} levanta defensa y reduce el impacto. Solo entran ${inflictedDamage} puntos.`,
            "warn"
          )
        );
      } else {
        logs.push(
          createLog(
            `${
              action === "attack" ? "Golpe directo" : "Tecnica cargada"
            } por ${inflictedDamage}${wasCrit ? " con critico" : ""}.`,
            wasCrit ? "good" : "neutral"
          )
        );
      }

      nextEnemyHp = Math.max(0, nextEnemyHp - inflictedDamage);

      const canTriggerPhaseTwo =
        !nextPhaseTwo &&
        nextEnemyHp > 0 &&
        nextEnemyHp <= Math.floor(battle.enemyMaxHp * 0.35) &&
        rollChance(selectedEncounter.phaseTwoChance);

      if (canTriggerPhaseTwo) {
        nextPhaseTwo = true;
        const healAmount = Math.floor(battle.enemyMaxHp * 0.5);
        nextEnemyHp = Math.min(battle.enemyMaxHp, nextEnemyHp + healAmount);
        logs.push(
          createLog(
            `${selectedEncounter.enemyName} entra en segunda fase y recupera ${healAmount} de vida.`,
            "bad"
          )
        );
      }

      if (nextEnemyHp <= 0) {
        reward = randomBetween(selectedEncounter.rewardMin, selectedEncounter.rewardMax);
        result = "victory";
        logs.push(
          createLog(
            `Objetivo abatido. El gremio liquida ${reward} de oro por este contrato.`,
            "good"
          )
        );
      }
    }

    if (action === "defend") {
      logs.push(
        createLog(
          "Adoptas postura defensiva y preparas un paso corto para cortar el ritmo rival.",
          "neutral"
        )
      );
    }

    if (result === "active") {
      let enemyDamage = randomBetween(
        selectedEncounter.enemyAttackMin,
        selectedEncounter.enemyAttackMax
      );

      if (rollChance(selectedEncounter.difficulty === "hard" ? 0.2 : selectedEncounter.difficulty === "medium" ? 0.15 : 0.1)) {
        enemyDamage = Math.floor(enemyDamage * 1.6);
        logs.push(
          createLog(`${selectedEncounter.enemyName} conecta un golpe critico.`, "bad")
        );
      }

      if (action === "defend") {
        if (rollChance(DEFENSE_DODGE_CHANCE)) {
          enemyDamage = 0;
          logs.push(createLog("Lees la embestida y esquivas todo el dano.", "good"));
        } else if (rollChance(DEFENSE_REDUCE_CHANCE)) {
          enemyDamage = Math.max(4, Math.floor(enemyDamage * 0.4));
          logs.push(
            createLog(`Tu defensa absorbe la mayor parte del impacto. Solo recibes ${enemyDamage}.`, "good")
          );
        } else {
          logs.push(
            createLog(`La defensa no cierra a tiempo y aun asi recibes ${enemyDamage}.`, "warn")
          );
        }
      } else {
        logs.push(
          createLog(`${selectedEncounter.enemyName} responde y te hiere por ${enemyDamage}.`, "bad")
        );
      }

      nextPlayerHp = Math.max(0, nextPlayerHp - enemyDamage);

      if (nextPlayerHp <= 0) {
        result = "defeat";
        logs.push(createLog("Tu resistencia colapsa. La caceria termina en derrota.", "bad"));
      }
    }

    const nextBattle: ArcadeBattleState = {
      ...battle,
      playerHp: nextPlayerHp,
      enemyHp: nextEnemyHp,
      turn: battle.turn + 1,
      abilityCooldown: nextCooldown,
      phaseTwoTriggered: nextPhaseTwo,
      result,
      reward,
      logs: [...logs, ...battle.logs].slice(0, 8),
    };

    setBattle(nextBattle);

    if (result === "victory" && reward > 0) {
      setIsUpdating(true);
      const refreshedPlayer = await refreshPlayer();
      const goldBase = refreshedPlayer?.gold ?? player.gold;
      await setPlayerGold(goldBase + reward);
      setIsUpdating(false);
    }
  }

  function resetBattle() {
    setBattle(null);
  }

  if (isHydrating) {
    return <ArcadePlaceholder message="Preparando contratos de expedicion..." />;
  }

  if (!player) {
    return <ArcadePlaceholder message="Conecta tu perfil para iniciar cacerias arcade." />;
  }

  return (
    <div className="rounded-[2rem] border border-stone-800 bg-stone-900/80 p-4 shadow-[inset_0_4px_30px_rgba(0,0,0,0.45)] md:p-6">
      <div className="space-y-4">
        <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/55 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Cazador activo
                </p>
                <p className="text-lg font-black text-stone-100">{player.username}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                Oro
              </p>
              <p className="text-2xl font-black text-amber-400">{player.gold}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {ARCADE_ENCOUNTERS.map((encounter) => {
            const active = encounter.id === selectedEncounterId;

            return (
              <button
                key={encounter.id}
                type="button"
                onClick={() => setSelectedEncounterId(encounter.id)}
                className={`rounded-[1.5rem] border p-4 text-left transition ${
                  active
                    ? "border-amber-400/30 bg-amber-500/10 shadow-[0_0_16px_rgba(245,158,11,0.08)]"
                    : "border-stone-800 bg-stone-950/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
                      {difficultyLabel(encounter.difficulty)}
                    </p>
                    <h3 className="mt-2 text-base font-black text-stone-100">
                      {encounter.title}
                    </h3>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${difficultyTone(encounter.difficulty)}`}>
                    {encounter.rewardMax}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-stone-400">{encounter.summary}</p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-stone-300">
                  <div className="rounded-xl border border-stone-800 bg-stone-900/80 px-3 py-2">
                    Entrada {encounter.entryFee}
                  </div>
                  <div className="rounded-xl border border-stone-800 bg-stone-900/80 px-3 py-2">
                    Premio {encounter.rewardMax}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selectedEncounter ? (
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[1.6rem] border border-stone-800 bg-stone-950/55 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400/80">
                    Objetivo
                  </p>
                  <h4 className="mt-2 text-xl font-black text-stone-100">
                    {selectedEncounter.enemyName}
                  </h4>
                </div>
                <span className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] ${difficultyTone(selectedEncounter.difficulty)}`}>
                  {difficultyLabel(selectedEncounter.difficulty)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat icon={Coins} label="Entrada" value={selectedEncounter.entryFee} />
                <MiniStat icon={Sparkles} label="Min" value={selectedEncounter.rewardMin} />
                <MiniStat icon={BadgeAlert} label="Max" value={selectedEncounter.rewardMax} />
                <MiniStat icon={Bolt} label="Ritmo" value={selectedEncounter.speed} />
              </div>

              <button
                type="button"
                onClick={() => void startRun()}
                disabled={isUpdating || player.gold < selectedEncounter.entryFee || battle?.result === "active"}
                className="mt-4 w-full rounded-2xl bg-amber-500 px-4 py-4 text-sm font-black text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {player.gold < selectedEncounter.entryFee
                  ? "Oro insuficiente"
                  : battle?.result === "active"
                    ? "Combate en curso"
                    : "Iniciar caceria"}
              </button>
            </div>

            <div className="rounded-[1.6rem] border border-stone-800 bg-stone-950/55 p-4">
              {battle && battle.encounterId === selectedEncounter.id ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <BarCard label="Tu vida" value={battle.playerHp} max={PLAYER_MAX_HP} tone="player" />
                    <BarCard label="Vida enemiga" value={battle.enemyHp} max={battle.enemyMaxHp} tone="enemy" />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <ActionButton
                      label="Ataque"
                      icon={Swords}
                      disabled={battle.result !== "active" || isUpdating}
                      onClick={() => void resolveAction("attack")}
                    />
                    <ActionButton
                      label="Habilidad"
                      icon={Sparkles}
                      disabled={battle.result !== "active" || isUpdating || battle.abilityCooldown > 0}
                      onClick={() => void resolveAction("ability")}
                      badge={battle.abilityCooldown > 0 ? `${battle.abilityCooldown}` : "OK"}
                    />
                    <ActionButton
                      label="Defensa"
                      icon={Shield}
                      disabled={battle.result !== "active" || isUpdating}
                      onClick={() => void resolveAction("defend")}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-stone-500">
                    <span>Turno {battle.turn}</span>
                    <span>{battle.phaseTwoTriggered ? "Fase 2 activa" : "Fase 1"}</span>
                  </div>

                  <div className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
                    <AnimatePresence initial={false}>
                      {battle.logs.map((log) => (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`rounded-[1.1rem] border px-3 py-3 text-sm leading-5 ${logToneClasses(log.tone)}`}
                        >
                          {log.text}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {battle.result !== "active" ? (
                    <div className="mt-4 rounded-[1.3rem] border border-stone-800 bg-stone-900/80 p-4">
                      <p className="text-sm font-bold text-stone-100">
                        {battle.result === "victory"
                          ? `Victoria: +${battle.reward} de oro`
                          : "Derrota: sin recompensa"}
                      </p>
                      <button
                        type="button"
                        onClick={resetBattle}
                        className="mt-3 w-full rounded-2xl bg-stone-100 px-4 py-3 text-sm font-black text-stone-950"
                      >
                        Reiniciar combate
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex min-h-64 items-center justify-center rounded-[1.4rem] border border-dashed border-stone-800 bg-stone-900/60 px-5 text-center text-sm leading-6 text-stone-400">
                  Elige un contrato y entra directo al combate arcade. Esta version prioriza ritmo, claridad y lectura limpia en movil.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Coins;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[1.1rem] border border-stone-800 bg-stone-900/80 p-3">
      <div className="flex items-center gap-2 text-stone-500">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-2 text-lg font-black text-stone-100">{value}</p>
    </div>
  );
}

function BarCard({
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
  const barTone =
    tone === "player" ? "from-emerald-400 to-emerald-600" : "from-rose-400 to-rose-600";

  return (
    <div className="rounded-[1.3rem] border border-stone-800 bg-stone-900/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-stone-300">{label}</p>
        <p className="text-sm font-black text-stone-100">{value}/{max}</p>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-800">
        <div className={`h-full rounded-full bg-gradient-to-r ${barTone}`} style={{ width }} />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  disabled,
  onClick,
  badge,
}: {
  label: string;
  icon: typeof Swords;
  disabled: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-[1.2rem] border border-stone-800 bg-stone-900/80 px-3 py-4 transition hover:border-amber-400/30 hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-45"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-stone-100">
          {label}
        </p>
        {badge ? (
          <span className="rounded-full border border-stone-700 bg-stone-950/80 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            {badge}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function ArcadePlaceholder({ message }: { message: string }) {
  return (
    <div className="rounded-[2rem] border border-stone-800 bg-stone-900/80 p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
        <Swords className="h-8 w-8" />
      </div>
      <p className="mt-4 text-sm leading-6 text-stone-400">{message}</p>
    </div>
  );
}
