import { useEffect, useMemo, useState, startTransition } from "react";
import {
  ArrowLeft,
  Banknote,
  Bot,
  Castle,
  Crown,
  Gem,
  Loader2,
  Lock,
  Shield,
  Sparkles,
  Sword,
  TrendingUp,
} from "lucide-react";
import { SectionHeader } from "../components/SectionHeader";
import { usePlayerSession } from "../context/PlayerSessionContext";
import {
  claimRealmSiegeIncome,
  depositRealmSiegeGold,
  fetchRealmSiegeState,
  formatRealmSiegeGold,
  investRealmSiegeIncome,
  joinRealmSiegeFaction,
  REALM_SIEGE_CATALOG_ENTRY,
  type RealmSiegeAction,
  type RealmSiegeFaction,
  type RealmSiegeFactionId,
  type RealmSiegeMutationResult,
  type RealmSiegeState,
  type RealmSiegeTerritory,
} from "../utils/realmSiege";

type RealmSiegeSectionProps = {
  standalone?: boolean;
};

const DEFAULT_FACTION: RealmSiegeFactionId = "kaelum";

const factionFlavor: Record<RealmSiegeFactionId, string> = {
  kaelum: "Murallas altas, defensa estable y avance seguro.",
  oakhaven: "Control de rutas, vigilancia y presion constante.",
  arcania: "Magia, recursos refinados y asedios calculados.",
  paramos: "Juego agresivo, castigo frontal y fortaleza dura.",
};

export function RealmSiegeSection({ standalone = false }: RealmSiegeSectionProps) {
  const {
    player,
    refreshPlayer,
    isSecureSessionReady,
    isPlayerSecureLinked,
    secureSessionError,
    linkCurrentPlayerToSecureSession,
  } = usePlayerSession();
  const canUseSecureActions = Boolean(player && isSecureSessionReady && isPlayerSecureLinked);
  const [siegeState, setSiegeState] = useState<RealmSiegeState | null>(null);
  const [selectedFactionId, setSelectedFactionId] =
    useState<RealmSiegeFactionId>(DEFAULT_FACTION);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState("kaelum");
  const [depositAmount, setDepositAmount] = useState("25000");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadSiegeState() {
      setIsLoading(true);
      setError("");

      try {
        const nextState = await fetchRealmSiegeState(
          canUseSecureActions ? player?.id : null
        );

        if (!cancelled) {
          startTransition(() => {
            setSiegeState(nextState);
            setSelectedTerritoryId((current) =>
              nextState.territories.some((territory) => territory.id === current)
                ? current
                : nextState.territories[0]?.id ?? "kaelum"
            );
          });
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "No se pudo cargar el Asedio."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSiegeState();

    return () => {
      cancelled = true;
    };
  }, [canUseSecureActions, player?.id, refreshToken]);

  const factionById = useMemo(() => {
    const map = new Map<RealmSiegeFactionId, RealmSiegeFaction>();
    siegeState?.factions.forEach((faction) => {
      map.set(faction.id, faction);
    });
    return map;
  }, [siegeState]);

  const selectedTerritory = useMemo(
    () =>
      siegeState?.territories.find((territory) => territory.id === selectedTerritoryId) ??
      siegeState?.territories[0] ??
      null,
    [selectedTerritoryId, siegeState?.territories]
  );

  const playerFaction = siegeState?.playerState
    ? factionById.get(siegeState.playerState.factionId) ?? null
    : null;

  const controlledTerritories = useMemo(() => {
    if (!siegeState?.playerState) {
      return [];
    }

    return siegeState.territories.filter(
      (territory) => territory.ownerFactionId === siegeState.playerState?.factionId
    );
  }, [siegeState]);

  const playerIncome = useMemo(() => {
    if (!siegeState) {
      return 0;
    }

    return controlledTerritories.reduce(
      (total, territory) =>
        total + siegeState.season.baseTerritoryIncome + territory.incomeBonus,
      0
    );
  }, [controlledTerritories, siegeState]);

  const selectedTerritoryInvestCost =
    selectedTerritory && siegeState
      ? siegeState.season.incomeInvestBaseCost +
        selectedTerritory.investLevel * siegeState.season.incomeInvestCostStep
      : 0;

  const returnTo = useMemo(() => {
    if (typeof window === "undefined") {
      return "/";
    }

    const params = new URLSearchParams(window.location.search);
    return params.get("returnTo") || "/";
  }, []);

  async function runMutation(
    actionId: string,
    runner: () => Promise<RealmSiegeMutationResult>
  ) {
    setBusyAction(actionId);
    setError("");
    setFeedback("");

    try {
      const result = await runner();

      if (result.state) {
        setSiegeState(result.state);
      } else {
        setRefreshToken((current) => current + 1);
      }

      if (result.remainingGold !== undefined || result.newGold !== undefined) {
        await refreshPlayer();
      }

      setFeedback(result.message);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo completar la accion del Asedio."
      );
    } finally {
      setBusyAction("");
    }
  }

  async function handleSecureLink() {
    setBusyAction("secure-link");
    setError("");
    setFeedback("");

    try {
      const result = await linkCurrentPlayerToSecureSession();
      setFeedback(result.message);
      setRefreshToken((current) => current + 1);
    } catch {
      setError("No se pudo vincular la cuenta segura ahora mismo.");
    } finally {
      setBusyAction("");
    }
  }

  function handleReturnToMainPage() {
    window.location.href = returnTo;
  }

  const canJoinFaction = Boolean(player && canUseSecureActions && !siegeState?.playerState);
  const canUseEconomy = Boolean(player && canUseSecureActions && siegeState?.playerState);
  const depositValue = Math.max(0, Math.floor(Number(depositAmount) || 0));
  const cappedDeposit = siegeState?.playerState
    ? Math.min(depositValue, siegeState.playerState.availableDeposit, player?.gold ?? 0)
    : 0;
  const selectedIsOwnTerritory =
    Boolean(
      selectedTerritory &&
        siegeState?.playerState &&
        selectedTerritory.ownerFactionId === siegeState.playerState.factionId
    );
  const canInvestSelectedTerritory = Boolean(
    selectedIsOwnTerritory &&
      siegeState &&
      selectedTerritory &&
      selectedTerritory.investLevel < siegeState.season.maxIncomeInvestLevel
  );

  return (
    <section
      className="space-y-5"
      data-market-entry={REALM_SIEGE_CATALOG_ENTRY.id}
      data-launch-mode="separate-window"
    >
      <div className="kd-glass overflow-hidden rounded-[2rem] border border-amber-500/20 bg-stone-950/80">
        <div className="relative isolate p-6 md:p-8">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.20),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.18),transparent_30%),linear-gradient(135deg,rgba(28,25,23,0.98),rgba(12,10,9,0.88))]" />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader
              eyebrow={REALM_SIEGE_CATALOG_ENTRY.eyebrow}
              title={REALM_SIEGE_CATALOG_ENTRY.title}
              description="Entrada especial del mercado: elige una faccion una sola vez, aporta al tesoro, cobra produccion por territorio y prepara el avance de una campana minima de una semana."
            />
            <div className="flex flex-wrap gap-2">
              {standalone ? (
                <button
                  type="button"
                  onClick={handleReturnToMainPage}
                  className="kd-touch inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-950/70 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-stone-200 transition hover:border-amber-400/40 hover:text-amber-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a la pagina principal
                </button>
              ) : null}
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-amber-200">
                <Lock className="h-4 w-4" />
                Faccion bloqueada
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
                <Bot className="h-4 w-4" />
                IA para reinos vacios
              </span>
            </div>
          </div>
        </div>
      </div>

      {error ? <StatusNotice tone="error" message={error} /> : null}
      {feedback ? <StatusNotice tone="success" message={feedback} /> : null}

      {!player ? (
        <StatusNotice
          tone="warning"
          message="Conecta tu jugador para elegir faccion, depositar oro y cobrar produccion."
        />
      ) : null}

      {player && !canUseSecureActions ? (
        <div className="kd-glass rounded-[1.6rem] border border-cyan-500/20 bg-cyan-500/10 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                Cuenta segura requerida
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                Para proteger el oro real del jugador, las acciones del Asedio requieren
                una cuenta segura vinculada al perfil.
              </p>
              {secureSessionError ? (
                <p className="mt-2 text-xs text-rose-200">{secureSessionError}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void handleSecureLink()}
              disabled={busyAction === "secure-link" || !isSecureSessionReady}
              className="kd-touch inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 transition hover:border-cyan-300/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyAction === "secure-link" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Vincular cuenta
            </button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="kd-glass rounded-[2rem] border border-stone-800 bg-stone-900/75 p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-300" />
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-stone-300">
            Cargando el frente...
          </p>
        </div>
      ) : null}

      {siegeState ? (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <SiegeStatCard
              icon={Crown}
              label="Duracion minima"
              value={`${siegeState.season.minDurationDays} dias`}
              detail="No es una ronda rapida."
            />
            <SiegeStatCard
              icon={Banknote}
              label="Deposito diario"
              value={formatRealmSiegeGold(siegeState.season.dailyDepositLimit)}
              detail="Maximo por jugador."
            />
            <SiegeStatCard
              icon={TrendingUp}
              label="Ciclo de oro"
              value={`${siegeState.season.incomeCycleHours} h`}
              detail="Produccion por territorio."
            />
            <SiegeStatCard
              icon={Shield}
              label="Cupo por reino"
              value={`${siegeState.season.kingdomMemberCap} jugadores`}
              detail="Si queda vacio, entra IA."
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
            <div className="space-y-5">
              <FactionPanel
                factions={siegeState.factions}
                selectedFactionId={selectedFactionId}
                playerFaction={playerFaction}
                memberCap={siegeState.season.kingdomMemberCap}
                canJoinFaction={canJoinFaction}
                busyAction={busyAction}
                onSelectFaction={setSelectedFactionId}
                onJoinFaction={() =>
                  player
                    ? void runMutation("join-faction", () =>
                        joinRealmSiegeFaction(player.id, selectedFactionId)
                      )
                    : undefined
                }
              />

              <TerritoryMap
                territories={siegeState.territories}
                factions={siegeState.factions}
                selectedTerritoryId={selectedTerritoryId}
                playerFactionId={siegeState.playerState?.factionId ?? null}
                onSelectTerritory={setSelectedTerritoryId}
              />
            </div>

            <aside className="space-y-5">
              <EconomyPanel
                canUseEconomy={canUseEconomy}
                playerGold={player?.gold ?? 0}
                playerFaction={playerFaction}
                playerState={siegeState.playerState}
                controlledTerritoriesCount={controlledTerritories.length}
                playerIncome={playerIncome}
                depositAmount={depositAmount}
                cappedDeposit={cappedDeposit}
                busyAction={busyAction}
                onDepositAmountChange={setDepositAmount}
                onDeposit={() =>
                  player
                    ? void runMutation("deposit-gold", () =>
                        depositRealmSiegeGold(player.id, depositValue)
                      )
                    : undefined
                }
                onClaimIncome={() =>
                  player
                    ? void runMutation("claim-income", () =>
                        claimRealmSiegeIncome(player.id)
                      )
                    : undefined
                }
              />

              <TerritoryDetailPanel
                territory={selectedTerritory}
                owner={selectedTerritory?.ownerFactionId ? factionById.get(selectedTerritory.ownerFactionId) ?? null : null}
                baseIncome={siegeState.season.baseTerritoryIncome}
                investCost={selectedTerritoryInvestCost}
                investGain={siegeState.season.incomeInvestGain}
                maxInvestLevel={siegeState.season.maxIncomeInvestLevel}
                canInvest={canInvestSelectedTerritory && canUseEconomy}
                busyAction={busyAction}
                onInvest={() =>
                  player && selectedTerritory
                    ? void runMutation("invest-income", () =>
                        investRealmSiegeIncome(player.id, selectedTerritory.id)
                      )
                    : undefined
                }
              />

              <ActionLog actions={siegeState.recentActions} factions={siegeState.factions} />
            </aside>
          </div>
        </>
      ) : null}
    </section>
  );
}

function StatusNotice({ tone, message }: { tone: "success" | "warning" | "error"; message: string }) {
  const toneClass =
    tone === "success"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
      : tone === "warning"
        ? "border-amber-400/20 bg-amber-500/10 text-amber-100"
        : "border-rose-400/20 bg-rose-500/10 text-rose-100";

  return (
    <div className={`rounded-[1.3rem] border px-4 py-3 text-sm leading-6 ${toneClass}`}>
      {message}
    </div>
  );
}

function SiegeStatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Crown;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="kd-glass rounded-[1.5rem] border border-stone-800 bg-stone-900/75 p-4">
      <div className="flex items-center gap-3">
        <span className="rounded-2xl bg-amber-500/10 p-2 text-amber-300">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
            {label}
          </p>
          <p className="mt-1 text-lg font-black text-stone-100">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-stone-500">{detail}</p>
    </div>
  );
}

function FactionPanel({
  factions,
  selectedFactionId,
  playerFaction,
  memberCap,
  canJoinFaction,
  busyAction,
  onSelectFaction,
  onJoinFaction,
}: {
  factions: RealmSiegeFaction[];
  selectedFactionId: RealmSiegeFactionId;
  playerFaction: RealmSiegeFaction | null;
  memberCap: number;
  canJoinFaction: boolean;
  busyAction: string;
  onSelectFaction: (factionId: RealmSiegeFactionId) => void;
  onJoinFaction: () => void;
}) {
  return (
    <div className="kd-glass rounded-[2rem] border border-stone-800 bg-stone-900/75 p-5">
      <SectionHeader
        eyebrow="Paso 1"
        title={playerFaction ? `Faccion fijada: ${playerFaction.displayName}` : "Elige tu reino"}
        description={
          playerFaction
            ? "La eleccion queda bloqueada hasta que termine la temporada del Asedio."
            : "Cada reino acepta hasta 3 jugadores. Si un reino queda vacio, Supabase lo marca para control por IA."
        }
      />

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {factions.map((faction) => {
          const isSelected = selectedFactionId === faction.id;
          const isLocked = faction.membersCount >= memberCap && !playerFaction;

          return (
            <button
              key={faction.id}
              type="button"
              onClick={() => onSelectFaction(faction.id)}
              disabled={Boolean(playerFaction) || isLocked}
              className={`kd-touch rounded-[1.35rem] border p-4 text-left transition ${
                isSelected
                  ? "border-amber-400/45 bg-amber-500/10 shadow-[0_0_28px_rgba(245,158,11,0.12)]"
                  : "border-stone-800 bg-stone-950/45 hover:border-stone-600"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-stone-100">{faction.displayName}</p>
                  <p className="mt-2 text-xs leading-5 text-stone-400">
                    {factionFlavor[faction.id]}
                  </p>
                </div>
                <span
                  className="rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
                  style={{
                    borderColor: `${faction.accent}66`,
                    backgroundColor: `${faction.accent}1f`,
                    color: faction.accent,
                  }}
                >
                  {faction.membersCount}/{memberCap}
                </span>
              </div>
              {faction.isAiManaged ? (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-200">
                  <Bot className="h-3.5 w-3.5" />
                  IA activa si nadie entra
                </p>
              ) : null}
            </button>
          );
        })}
      </div>

      {!playerFaction ? (
        <button
          type="button"
          disabled={!canJoinFaction || busyAction === "join-faction"}
          onClick={onJoinFaction}
          className="kd-touch mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-stone-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:border-stone-700 disabled:bg-stone-800 disabled:text-stone-500"
        >
          {busyAction === "join-faction" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Fijar faccion
        </button>
      ) : null}
    </div>
  );
}

function TerritoryMap({
  territories,
  factions,
  selectedTerritoryId,
  playerFactionId,
  onSelectTerritory,
}: {
  territories: RealmSiegeTerritory[];
  factions: RealmSiegeFaction[];
  selectedTerritoryId: string;
  playerFactionId: RealmSiegeFactionId | null;
  onSelectTerritory: (territoryId: string) => void;
}) {
  const factionById = new Map(factions.map((faction) => [faction.id, faction]));

  return (
    <div className="kd-glass rounded-[2rem] border border-stone-800 bg-stone-950/80 p-5">
      <SectionHeader
        eyebrow="Mapa vivo"
        title="Frente del Asedio"
        description="Selecciona un territorio para ver defensa, produccion e inversion disponible."
      />

      <div className="mt-5 overflow-x-auto pb-2">
        <div className="relative h-[34rem] min-w-[44rem] overflow-hidden rounded-[1.6rem] border border-amber-500/15 bg-[radial-gradient(circle_at_50%_45%,rgba(120,113,108,0.16),transparent_34%),linear-gradient(145deg,rgba(28,25,23,0.96),rgba(15,23,16,0.92))]">
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(245,158,11,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
          {territories.map((territory) => {
            const owner = territory.ownerFactionId
              ? factionById.get(territory.ownerFactionId)
              : null;
            const isSelected = selectedTerritoryId === territory.id;
            const isOwn = Boolean(playerFactionId && territory.ownerFactionId === playerFactionId);

            return (
              <button
                key={territory.id}
                type="button"
                onClick={() => onSelectTerritory(territory.id)}
                className={`kd-touch absolute -translate-x-1/2 -translate-y-1/2 rounded-[1.15rem] border px-3 py-2 text-center transition ${
                  isSelected
                    ? "z-20 scale-105 border-amber-300 bg-amber-400/15 shadow-[0_0_34px_rgba(245,158,11,0.28)]"
                    : "z-10 border-stone-700 bg-stone-950/80 hover:border-amber-500/35"
                }`}
                style={{
                  left: `${territory.positionX}%`,
                  top: `${territory.positionY}%`,
                  boxShadow: isOwn
                    ? `0 0 0 1px ${owner?.accent ?? "#f4c95d"}66, 0 0 30px ${owner?.accent ?? "#f4c95d"}24`
                    : undefined,
                }}
              >
                <Castle
                  className="mx-auto h-8 w-8"
                  style={{ color: owner?.accent ?? "#a8a29e" }}
                />
                <span className="mt-1 block text-[11px] font-black uppercase tracking-[0.12em] text-stone-100">
                  {territory.shortName}
                </span>
                <span className="block text-[9px] uppercase tracking-[0.1em] text-stone-500">
                  {owner?.displayName ?? "Neutral"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EconomyPanel({
  canUseEconomy,
  playerGold,
  playerFaction,
  playerState,
  controlledTerritoriesCount,
  playerIncome,
  depositAmount,
  cappedDeposit,
  busyAction,
  onDepositAmountChange,
  onDeposit,
  onClaimIncome,
}: {
  canUseEconomy: boolean;
  playerGold: number;
  playerFaction: RealmSiegeFaction | null;
  playerState: RealmSiegeState["playerState"];
  controlledTerritoriesCount: number;
  playerIncome: number;
  depositAmount: string;
  cappedDeposit: number;
  busyAction: string;
  onDepositAmountChange: (value: string) => void;
  onDeposit: () => void;
  onClaimIncome: () => void;
}) {
  const nextIncomeLabel = playerState?.nextIncomeAt
    ? new Date(playerState.nextIncomeAt).toLocaleString("es-PY", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Disponible";

  return (
    <div className="kd-glass rounded-[2rem] border border-stone-800 bg-stone-900/75 p-5">
      <SectionHeader
        eyebrow="Tesoro"
        title={playerFaction ? `Tesoro de ${playerFaction.displayName}` : "Economia del frente"}
        description="Deposita oro real al tesoro del reino y cobra la produccion de tus territorios cuando el ciclo este listo."
      />

      <div className="mt-5 grid gap-3">
        <EconomyMetric label="Tu oro" value={formatRealmSiegeGold(playerGold)} icon={Gem} />
        <EconomyMetric
          label="Tesoro del reino"
          value={formatRealmSiegeGold(playerFaction?.treasuryGold ?? 0)}
          icon={Banknote}
        />
        <EconomyMetric
          label="Produccion por ciclo"
          value={formatRealmSiegeGold(playerIncome)}
          icon={TrendingUp}
        />
      </div>

      <div className="mt-5 rounded-[1.35rem] border border-stone-800 bg-stone-950/45 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-400">
            Deposito diario
          </p>
          <span className="text-xs font-bold text-amber-200">
            {formatRealmSiegeGold(playerState?.availableDeposit ?? 0)} disponible
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            min={0}
            max={playerState?.availableDeposit ?? 0}
            value={depositAmount}
            onChange={(event) => onDepositAmountChange(event.target.value)}
            className="min-w-0 flex-1 rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm font-bold text-stone-100 outline-none transition focus:border-amber-400/60"
          />
          <button
            type="button"
            disabled={!canUseEconomy || cappedDeposit <= 0 || busyAction === "deposit-gold"}
            onClick={onDeposit}
            className="kd-touch inline-flex items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-400 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-stone-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:border-stone-700 disabled:bg-stone-800 disabled:text-stone-500"
          >
            {busyAction === "deposit-gold" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Depositar"}
          </button>
        </div>
      </div>

      <button
        type="button"
        disabled={!canUseEconomy || playerIncome <= 0 || busyAction === "claim-income"}
        onClick={onClaimIncome}
        className="kd-touch mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-emerald-100 transition hover:border-emerald-300/50 disabled:cursor-not-allowed disabled:border-stone-700 disabled:bg-stone-800/50 disabled:text-stone-500"
      >
        {busyAction === "claim-income" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Cobrar produccion
      </button>
      <p className="mt-3 text-xs leading-5 text-stone-500">
        Territorios controlados: {controlledTerritoriesCount}. Proximo ciclo: {nextIncomeLabel}.
      </p>
    </div>
  );
}

function EconomyMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Banknote;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1.1rem] border border-stone-800 bg-stone-950/45 px-4 py-3">
      <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-stone-500">
        <Icon className="h-4 w-4 text-amber-300" />
        {label}
      </span>
      <span className="text-sm font-black text-stone-100">{value}</span>
    </div>
  );
}

function TerritoryDetailPanel({
  territory,
  owner,
  baseIncome,
  investCost,
  investGain,
  maxInvestLevel,
  canInvest,
  busyAction,
  onInvest,
}: {
  territory: RealmSiegeTerritory | null;
  owner: RealmSiegeFaction | null;
  baseIncome: number;
  investCost: number;
  investGain: number;
  maxInvestLevel: number;
  canInvest: boolean;
  busyAction: string;
  onInvest: () => void;
}) {
  if (!territory) {
    return null;
  }

  return (
    <div className="kd-glass rounded-[2rem] border border-stone-800 bg-stone-900/75 p-5">
      <SectionHeader
        eyebrow={owner ? "Territorio controlado" : "Territorio neutral"}
        title={territory.displayName}
        description={`${territory.terrain}. Dueño: ${owner?.displayName ?? "Sin reclamar"}.`}
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <DetailMetric label="Defensa" value={territory.npcDefense.toLocaleString("es-PY")} icon={Shield} />
        <DetailMetric label="Guarnicion" value={territory.garrisonPower.toLocaleString("es-PY")} icon={Sword} />
        <DetailMetric label="Muralla" value={`Nivel ${territory.wallLevel}`} icon={Castle} />
        <DetailMetric
          label="Produccion"
          value={formatRealmSiegeGold(baseIncome + territory.incomeBonus)}
          icon={TrendingUp}
        />
      </div>

      <div className="mt-5 rounded-[1.35rem] border border-stone-800 bg-stone-950/45 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-400">
              Aumentar produccion
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-400">
              Nivel {territory.investLevel}/{maxInvestLevel}. Cada mejora suma {formatRealmSiegeGold(investGain)} por ciclo.
            </p>
          </div>
          <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs font-black text-amber-200">
            {formatRealmSiegeGold(investCost)}
          </span>
        </div>
        <button
          type="button"
          disabled={!canInvest || busyAction === "invest-income"}
          onClick={onInvest}
          className="kd-touch mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-amber-100 transition hover:border-amber-300/50 disabled:cursor-not-allowed disabled:border-stone-700 disabled:bg-stone-800/50 disabled:text-stone-500"
        >
          {busyAction === "invest-income" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Invertir en produccion
        </button>
      </div>
    </div>
  );
}

function DetailMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Shield;
}) {
  return (
    <div className="rounded-[1.1rem] border border-stone-800 bg-stone-950/45 p-3">
      <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
        <Icon className="h-4 w-4 text-amber-300" />
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-stone-100">{value}</p>
    </div>
  );
}

function ActionLog({
  actions,
  factions,
}: {
  actions: RealmSiegeAction[];
  factions: RealmSiegeFaction[];
}) {
  const factionById = new Map(factions.map((faction) => [faction.id, faction.displayName]));

  return (
    <div className="kd-glass rounded-[2rem] border border-stone-800 bg-stone-900/75 p-5">
      <SectionHeader eyebrow="Cronica" title="Ultimos movimientos" />
      <div className="mt-4 space-y-2">
        {actions.length > 0 ? (
          actions.slice(0, 6).map((action) => (
            <div
              key={action.id}
              className="rounded-[1.1rem] border border-stone-800 bg-stone-950/45 px-4 py-3"
            >
              <p className="text-sm font-bold text-stone-200">
                {describeAction(action, factionById)}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-stone-500">
                {new Date(action.createdAt).toLocaleString("es-PY")}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-[1.1rem] border border-stone-800 bg-stone-950/45 px-4 py-3 text-sm text-stone-400">
            Aun no hay movimientos registrados.
          </p>
        )}
      </div>
    </div>
  );
}

function describeAction(
  action: RealmSiegeAction,
  factionById: Map<RealmSiegeFactionId, string>
) {
  const faction = action.actorFactionId
    ? factionById.get(action.actorFactionId) ?? "Un reino"
    : "El frente";

  switch (action.actionType) {
    case "join_faction":
      return `${faction} recibio un nuevo integrante.`;
    case "deposit_gold":
      return `${faction} recibio ${formatRealmSiegeGold(action.amount ?? 0)} en el tesoro.`;
    case "claim_income":
      return `${faction} cobro ${formatRealmSiegeGold(action.amount ?? 0)} de produccion.`;
    case "invest_income":
      return `${faction} invirtio en la produccion de ${action.territoryId ?? "un territorio"}.`;
    case "ai_fortify":
      return `${faction} reforzo automaticamente ${action.territoryId ?? "su defensa"}.`;
    case "ai_strategy_tick":
      return `${faction} ejecuto un ciclo estrategico de IA.`;
    default:
      return `${faction} registro un movimiento del Asedio.`;
  }
}
