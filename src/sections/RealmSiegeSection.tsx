import { useEffect, useMemo, useState, startTransition, type CSSProperties } from "react";
import {
  ArrowLeft,
  Banknote,
  Castle,
  Crown,
  Gem,
  Loader2,
  Shield,
  Sword,
  TrendingUp,
} from "lucide-react";
import arcaniaCastle from "../assets/asedio/kingdom_arcania.png";
import kaelumCastle from "../assets/asedio/kingdom_kaelum.png";
import neutralCastle from "../assets/asedio/kingdom_neutral.png";
import oakhavenCastle from "../assets/asedio/kingdom_oakhaven.png";
import paramosCastle from "../assets/asedio/kingdom_paramos.png";
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
  settleRealmSiegePrize,
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
const MAP_WIDTH = 900;
const MAP_HEIGHT = 620;
const CAPITAL_TERRITORIES = new Set(["kaelum", "oakhaven", "arcania", "paramos"]);
const FACTION_ORDER: RealmSiegeFactionId[] = ["kaelum", "oakhaven", "arcania", "paramos"];

const castleImageByOwner: Record<RealmSiegeFactionId | "neutral", string> = {
  kaelum: kaelumCastle,
  oakhaven: oakhavenCastle,
  arcania: arcaniaCastle,
  paramos: paramosCastle,
  neutral: neutralCastle,
};

const factionFlavor: Record<RealmSiegeFactionId, string> = {
  kaelum: "Murallas altas, defensa estable y avance seguro.",
  oakhaven: "Control de rutas, vigilancia y presion constante.",
  arcania: "Magia, recursos refinados y asedios calculados.",
  paramos: "Juego agresivo, castigo frontal y fortaleza dura.",
};

type PrizePreview = {
  winnerFactionId: RealmSiegeFactionId | null;
  territoriesControlled: number;
  isReady: boolean;
  reason: "full_conquest" | "territory_lead" | "pending";
  closesAt: Date | null;
};

function getPrizePreview(state: RealmSiegeState | null): PrizePreview {
  if (!state) {
    return {
      winnerFactionId: null,
      territoriesControlled: 0,
      isReady: false,
      reason: "pending",
      closesAt: null,
    };
  }

  if (state.season.winnerFactionId) {
    return {
      winnerFactionId: state.season.winnerFactionId,
      territoriesControlled: state.territories.filter(
        (territory) => territory.ownerFactionId === state.season.winnerFactionId
      ).length,
      isReady: false,
      reason: state.season.winnerReason === "full_conquest" ? "full_conquest" : "territory_lead",
      closesAt: state.season.endsAt ? new Date(state.season.endsAt) : null,
    };
  }

  const closesAt = state.season.endsAt
    ? new Date(state.season.endsAt)
    : new Date(
        new Date(state.season.startsAt).getTime() +
          state.season.minDurationDays * 24 * 60 * 60 * 1000
      );
  const counts = new Map<RealmSiegeFactionId, { territories: number; garrison: number }>();

  state.factions.forEach((faction) => {
    counts.set(faction.id, { territories: 0, garrison: 0 });
  });

  state.territories.forEach((territory) => {
    if (!territory.ownerFactionId) {
      return;
    }

    const current = counts.get(territory.ownerFactionId) ?? { territories: 0, garrison: 0 };
    counts.set(territory.ownerFactionId, {
      territories: current.territories + 1,
      garrison: current.garrison + territory.garrisonPower,
    });
  });

  const fullConquest = [...counts.entries()].find(
    ([, value]) => value.territories === state.territories.length && state.territories.length > 0
  );

  if (fullConquest) {
    return {
      winnerFactionId: fullConquest[0],
      territoriesControlled: fullConquest[1].territories,
      isReady: true,
      reason: "full_conquest",
      closesAt,
    };
  }

  const sorted = state.factions
    .map((faction) => {
      const count = counts.get(faction.id) ?? { territories: 0, garrison: 0 };
      return {
        faction,
        territories: count.territories,
        garrison: count.garrison,
      };
    })
    .sort((left, right) => {
      if (right.territories !== left.territories) {
        return right.territories - left.territories;
      }

      if (right.faction.treasuryGold !== left.faction.treasuryGold) {
        return right.faction.treasuryGold - left.faction.treasuryGold;
      }

      if (right.garrison !== left.garrison) {
        return right.garrison - left.garrison;
      }

      return FACTION_ORDER.indexOf(left.faction.id) - FACTION_ORDER.indexOf(right.faction.id);
    });

  const leader = sorted[0];

  return {
    winnerFactionId: leader?.faction.id ?? null,
    territoriesControlled: leader?.territories ?? 0,
    isReady: Date.now() >= closesAt.getTime() && Boolean(leader && leader.territories > 0),
    reason: Date.now() >= closesAt.getTime() ? "territory_lead" : "pending",
    closesAt,
  };
}

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
  const prizePreview = useMemo(() => getPrizePreview(siegeState), [siegeState]);

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
      className="space-y-4 md:space-y-5"
      data-market-entry={REALM_SIEGE_CATALOG_ENTRY.id}
      data-launch-mode="separate-window"
    >
      <div className="kd-glass overflow-hidden rounded-[1.6rem] border border-amber-500/20 bg-stone-950/80 md:rounded-[2rem]">
        <div className="relative isolate p-4 md:p-8">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.20),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.18),transparent_30%),linear-gradient(135deg,rgba(28,25,23,0.98),rgba(12,10,9,0.88))]" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <SectionHeader
              eyebrow={REALM_SIEGE_CATALOG_ENTRY.eyebrow}
              title={REALM_SIEGE_CATALOG_ENTRY.title}
              description="Entrada especial del mercado: elige una faccion una sola vez, domina territorios y pelea por un pozo creciente de hasta 1.000.000 de oro."
            />
            {standalone ? (
              <button
                type="button"
                onClick={handleReturnToMainPage}
                aria-label="Volver a la pagina principal"
                className="kd-touch inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-stone-700 bg-stone-950/70 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-stone-200 transition hover:border-amber-400/40 hover:text-amber-200 sm:mt-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Inicio
              </button>
            ) : null}
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
        <div className="kd-glass rounded-[1.6rem] border border-cyan-500/20 bg-cyan-500/10 p-4 md:p-5">
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
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5 md:gap-3">
            <SiegeStatCard
              icon={Crown}
              label="Duracion minima"
              value={`${siegeState.season.minDurationDays} dias`}
              detail="No es una ronda rapida."
            />
            <SiegeStatCard
              icon={Gem}
              label="Pozo"
              value={formatRealmSiegeGold(siegeState.season.currentPrizePoolGold)}
              detail={`Tope ${formatRealmSiegeGold(siegeState.season.prizePoolCapGold)}.`}
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
              detail="Maximo por faccion."
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
              <PrizePoolPanel
                season={siegeState.season}
                factions={siegeState.factions}
                preview={prizePreview}
                territoryTotal={siegeState.territories.length}
                canSettle={canUseEconomy && prizePreview.isReady}
                busyAction={busyAction}
                onSettlePrize={() =>
                  player
                    ? void runMutation("settle-prize", () =>
                        settleRealmSiegePrize(player.id)
                      )
                    : undefined
                }
              />

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
    <div className="kd-glass rounded-[1.2rem] border border-stone-800 bg-stone-900/75 p-3 md:rounded-[1.5rem] md:p-4">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-amber-500/10 p-2 text-amber-300 md:rounded-2xl">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-stone-500 md:text-[10px] md:tracking-[0.18em]">
            {label}
          </p>
          <p className="mt-1 text-base font-black text-stone-100 md:text-lg">{value}</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-4 text-stone-500 md:mt-3 md:text-xs md:leading-5">{detail}</p>
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
  const orderedFactions = useMemo(
    () =>
      factions
        .slice()
        .sort((left, right) => FACTION_ORDER.indexOf(left.id) - FACTION_ORDER.indexOf(right.id)),
    [factions]
  );

  return (
    <div className="kd-glass rounded-[1.6rem] border border-stone-800 bg-stone-900/75 p-4 md:rounded-[2rem] md:p-5">
      <SectionHeader
        eyebrow="Paso 1"
        title={playerFaction ? `Faccion fijada: ${playerFaction.displayName}` : "Elige tu reino"}
        description={
          playerFaction
            ? "La eleccion queda fija hasta que termine la temporada del Asedio."
            : "Cada reino acepta hasta 3 jugadores. Elige con cuidado: tu faccion se mantiene durante la temporada."
        }
      />

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {orderedFactions.map((faction) => {
          const isSelected = selectedFactionId === faction.id;
          const isLocked = faction.membersCount >= memberCap && !playerFaction;

          return (
            <button
              key={faction.id}
              type="button"
              onClick={() => onSelectFaction(faction.id)}
              disabled={Boolean(playerFaction) || isLocked}
              className={`kd-touch group relative overflow-hidden rounded-[1.35rem] border p-4 text-left transition ${
                isSelected
                  ? "border-amber-400/45 bg-amber-500/10 shadow-[0_0_28px_rgba(245,158,11,0.12)]"
                  : "border-stone-800 bg-stone-950/45 hover:border-stone-600"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span
                className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100"
                style={{
                  background: `radial-gradient(circle at 18% 18%, ${faction.accent}2e, transparent 38%)`,
                }}
              />
              <div className="relative flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-end justify-center rounded-[1.15rem] border border-stone-800 bg-stone-950/75 p-2 sm:h-24 sm:w-24">
                  <img
                    src={castleImageByOwner[faction.id]}
                    alt={`Castillo de ${faction.displayName}`}
                    className="max-h-full max-w-full object-contain drop-shadow-[0_12px_16px_rgba(0,0,0,0.62)] transition duration-300 group-hover:scale-105 group-hover:brightness-110"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-lg font-black text-stone-100">{faction.displayName}</p>
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
                  <p className="mt-2 text-xs leading-5 text-stone-400">
                    {factionFlavor[faction.id]}
                  </p>
                </div>
              </div>
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

function toMapX(territory: RealmSiegeTerritory) {
  return (territory.positionX / 100) * MAP_WIDTH;
}

function toMapY(territory: RealmSiegeTerritory) {
  return (territory.positionY / 100) * MAP_HEIGHT;
}

function getTerritorySprite(isCapital: boolean) {
  return isCapital
    ? {
        x: -62,
        y: -110,
        width: 124,
        height: 116,
        hitX: -78,
        hitY: -114,
        hitW: 156,
        hitH: 194,
        groundY: 38,
        groundRx: 66,
        groundRy: 20,
        bannerW: 108,
        bannerY: 48,
        nameY: 62,
        metaY: 76,
        wallX: 56,
        wallY: -84,
        alertX: -72,
        alertY: -104,
        alertW: 144,
        alertH: 164,
      }
    : {
        x: -45,
        y: -78,
        width: 90,
        height: 82,
        hitX: -60,
        hitY: -82,
        hitW: 120,
        hitH: 152,
        groundY: 34,
        groundRx: 51,
        groundRy: 16,
        bannerW: 90,
        bannerY: 40,
        nameY: 54,
        metaY: 68,
        wallX: 42,
        wallY: -60,
        alertX: -56,
        alertY: -74,
        alertW: 112,
        alertH: 128,
      };
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
  const factionById = useMemo(
    () => new Map(factions.map((faction) => [faction.id, faction])),
    [factions]
  );
  const territoryById = useMemo(
    () => new Map(territories.map((territory) => [territory.id, territory])),
    [territories]
  );
  const mapEdges = useMemo(() => {
    const seen = new Set<string>();

    return territories.flatMap((territory) =>
      territory.adjacentTerritoryIds.flatMap((adjacentId) => {
        const adjacent = territoryById.get(adjacentId);

        if (!adjacent) {
          return [];
        }

        const key = [territory.id, adjacent.id].sort().join("-");

        if (seen.has(key)) {
          return [];
        }

        seen.add(key);
        return [{ from: territory, to: adjacent }];
      })
    );
  }, [territories, territoryById]);

  return (
    <div className="kd-glass rounded-[1.6rem] border border-stone-800 bg-stone-950/80 p-4 md:rounded-[2rem] md:p-5">
      <SectionHeader
        eyebrow="Mapa vivo"
        title="Frente del Asedio"
        description="Selecciona un territorio para ver defensa, produccion e inversion disponible."
      />

      <div className="mt-5 overflow-x-auto pb-2">
        <div className="siege-map-shell relative min-w-[42rem] overflow-hidden rounded-[1.35rem] border border-amber-500/15 sm:min-w-[48rem] md:rounded-[1.6rem]">
          <svg
            className="block h-auto w-full"
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            role="img"
            aria-label="Mapa interactivo de territorios del Asedio"
          >
            <defs>
              <radialGradient id="siege-map-glow" cx="50%" cy="43%" r="68%">
                <stop offset="0%" stopColor="rgba(245, 158, 11, 0.18)" />
                <stop offset="52%" stopColor="rgba(15, 23, 16, 0.58)" />
                <stop offset="100%" stopColor="rgba(12, 10, 9, 0.96)" />
              </radialGradient>
              <pattern id="siege-map-grid" width="42" height="42" patternUnits="userSpaceOnUse">
                <path
                  d="M 42 0 L 0 0 0 42"
                  fill="none"
                  stroke="rgba(245, 158, 11, 0.07)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>

            <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#siege-map-glow)" />
            <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#siege-map-grid)" opacity="0.72" />
            <path
              d="M20 122 C190 74 312 108 454 94 C604 78 698 90 880 126 L880 602 L20 602 Z"
              fill="rgba(83, 78, 55, 0.12)"
            />
            <path
              d="M26 436 C160 406 284 462 440 436 C590 410 700 426 874 390"
              fill="none"
              stroke="rgba(245, 158, 11, 0.08)"
              strokeWidth="36"
              strokeLinecap="round"
            />

            {mapEdges.map(({ from, to }) => (
              <line
                key={`${from.id}-${to.id}`}
                className="siege-map-edge"
                x1={toMapX(from)}
                y1={toMapY(from)}
                x2={toMapX(to)}
                y2={toMapY(to)}
              />
            ))}

            {territories.map((territory, index) => {
              const ownerKey = territory.ownerFactionId ?? "neutral";
              const owner = territory.ownerFactionId
                ? factionById.get(territory.ownerFactionId)
                : null;
              const isSelected = selectedTerritoryId === territory.id;
              const isOwn = Boolean(playerFactionId && territory.ownerFactionId === playerFactionId);
              const isCapital = CAPITAL_TERRITORIES.has(territory.id);
              const sprite = getTerritorySprite(isCapital);
              const accent = owner?.accent ?? "#8b846e";
              const ownerLabel = owner?.displayName ?? "Neutral";
              const transformScale = isCapital ? 1 : 0.94;

              return (
                <g
                  key={territory.id}
                  className={`siege-territory ${isCapital ? "is-capital" : "is-outpost"} ${
                    territory.ownerFactionId ? "" : "is-neutral"
                  } ${isOwn ? "is-own" : ""} ${isSelected ? "is-selected" : ""}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${territory.displayName}, ${ownerLabel}`}
                  transform={`translate(${toMapX(territory)} ${toMapY(territory)}) scale(${transformScale})`}
                  style={
                    {
                      "--siege-accent": accent,
                      "--siege-delay": `${index * -0.24}s`,
                    } as CSSProperties
                  }
                  onClick={() => onSelectTerritory(territory.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectTerritory(territory.id);
                    }
                  }}
                >
                  <rect
                    className="siege-territory-hitbox"
                    x={sprite.hitX}
                    y={sprite.hitY}
                    width={sprite.hitW}
                    height={sprite.hitH}
                    rx={isCapital ? 24 : 18}
                  />
                  <rect
                    className="siege-territory-ring"
                    x={sprite.alertX}
                    y={sprite.alertY}
                    width={sprite.alertW}
                    height={sprite.alertH}
                    rx={isCapital ? 24 : 18}
                  />
                  <ellipse
                    className="siege-territory-ground"
                    cx="0"
                    cy={sprite.groundY}
                    rx={sprite.groundRx}
                    ry={sprite.groundRy}
                  />
                  <image
                    className="siege-territory-castle"
                    href={castleImageByOwner[ownerKey]}
                    x={sprite.x}
                    y={sprite.y}
                    width={sprite.width}
                    height={sprite.height}
                    preserveAspectRatio="xMidYMid meet"
                  />
                  {territory.wallLevel > 0 ? (
                    <g className="siege-territory-wall">
                      <rect x={sprite.wallX} y={sprite.wallY} width="32" height="24" rx="7" />
                      <text x={sprite.wallX + 16} y={sprite.wallY + 16}>
                        M{territory.wallLevel}
                      </text>
                    </g>
                  ) : null}
                  <rect
                    className="siege-territory-banner"
                    x={-sprite.bannerW / 2}
                    y={sprite.bannerY}
                    width={sprite.bannerW}
                    height="40"
                    rx="8"
                  />
                  <text className="siege-territory-name" y={sprite.nameY}>
                    {territory.shortName}
                  </text>
                  <text className="siege-territory-meta" y={sprite.metaY}>
                    {ownerLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-stone-500 md:hidden">
        Desliza el mapa y toca un castillo para ver su detalle.
      </p>
    </div>
  );
}

function PrizePoolPanel({
  season,
  factions,
  preview,
  territoryTotal,
  canSettle,
  busyAction,
  onSettlePrize,
}: {
  season: RealmSiegeState["season"];
  factions: RealmSiegeFaction[];
  preview: PrizePreview;
  territoryTotal: number;
  canSettle: boolean;
  busyAction: string;
  onSettlePrize: () => void;
}) {
  const winner = preview.winnerFactionId
    ? factions.find((faction) => faction.id === preview.winnerFactionId) ?? null
    : null;
  const awarded = Boolean(season.prizePoolAwardedAt);
  const visiblePrize = awarded ? season.prizePoolAwardedGold : season.currentPrizePoolGold;
  const progress = Math.min(100, Math.max(0, (visiblePrize / season.prizePoolCapGold) * 100));
  const closesAtLabel = preview.closesAt
    ? preview.closesAt.toLocaleString("es-PY", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Por definir";
  const statusLabel = awarded
    ? `Repartido a ${winner?.displayName ?? "el reino ganador"}.`
    : preview.reason === "full_conquest"
      ? "Conquista total lista para repartir."
      : preview.isReady
        ? "Semana cerrada: listo para repartir."
        : `Sube ${formatRealmSiegeGold(season.prizePoolGrowthPerCycle)} cada ${season.incomeCycleHours} h.`;
  const buttonLabel = awarded
    ? "Pozo repartido"
    : busyAction === "settle-prize"
      ? "Repartiendo..."
      : preview.isReady
        ? "Repartir pozo"
        : "Aun no listo";

  return (
    <div className="kd-glass rounded-[1.6rem] border border-amber-500/20 bg-stone-900/75 p-4 md:rounded-[2rem] md:p-5">
      <SectionHeader
        eyebrow="Premio"
        title="Pozo de victoria"
        description="El oro sube por ciclo y se reparte en partes iguales entre integrantes activos del reino ganador."
      />

      <div className="mt-5 rounded-[1.35rem] border border-amber-400/20 bg-amber-500/10 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
              Pozo actual
            </p>
            <p className="mt-1 text-2xl font-black text-stone-100">
              {formatRealmSiegeGold(visiblePrize)}
            </p>
          </div>
          <span className="rounded-full border border-amber-300/20 bg-stone-950/55 px-3 py-2 text-xs font-black text-amber-100">
            Max {formatRealmSiegeGold(season.prizePoolCapGold)}
          </span>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-950/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-300 to-emerald-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <DetailMetric
          label={awarded ? "Ganador" : "Candidato"}
          value={winner?.displayName ?? "Sin definir"}
          icon={Crown}
        />
        <DetailMetric
          label="Territorios"
          value={`${preview.territoriesControlled}/${Math.max(1, territoryTotal)}`}
          icon={Castle}
        />
      </div>

      <p className="mt-4 text-sm leading-6 text-stone-400">{statusLabel}</p>
      <p className="mt-2 text-xs leading-5 text-stone-500">
        Cierre previsto: {closesAtLabel}. Si nadie conquista todo antes, gana quien tenga mas territorio.
      </p>

      <button
        type="button"
        disabled={!canSettle || awarded || busyAction === "settle-prize"}
        onClick={onSettlePrize}
        className="kd-touch mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-amber-100 transition hover:border-amber-300/50 disabled:cursor-not-allowed disabled:border-stone-700 disabled:bg-stone-800/50 disabled:text-stone-500"
      >
        {busyAction === "settle-prize" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {buttonLabel}
      </button>
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
    <div className="kd-glass rounded-[1.6rem] border border-stone-800 bg-stone-900/75 p-4 md:rounded-[2rem] md:p-5">
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

  const castleOwner = territory.ownerFactionId ?? "neutral";

  return (
    <div className="kd-glass rounded-[1.6rem] border border-stone-800 bg-stone-900/75 p-4 md:rounded-[2rem] md:p-5">
      <SectionHeader
        eyebrow={owner ? "Territorio controlado" : "Territorio neutral"}
        title={territory.displayName}
        description={`${territory.terrain}. Dueño: ${owner?.displayName ?? "Sin reclamar"}.`}
      />

      <div className="mt-5 flex items-center gap-3 rounded-[1.35rem] border border-stone-800 bg-stone-950/45 p-3 sm:gap-4 sm:p-4">
        <div className="flex h-28 w-32 shrink-0 items-end justify-center rounded-[1.1rem] border border-amber-500/15 bg-[radial-gradient(circle_at_50%_20%,rgba(245,158,11,0.16),transparent_58%),rgba(12,10,9,0.72)] p-2">
          <img
            src={castleImageByOwner[castleOwner]}
            alt={`Modelo de ${territory.displayName}`}
            className="max-h-full max-w-full object-contain drop-shadow-[0_14px_18px_rgba(0,0,0,0.66)]"
            loading="lazy"
          />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
            Modelo del frente
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            {owner
              ? `El territorio usa la arquitectura de ${owner.displayName}.`
              : "Zona sin reclamar: fortificacion oscurecida hasta ser conquistada."}
          </p>
        </div>
      </div>

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
    <div className="kd-glass rounded-[1.6rem] border border-stone-800 bg-stone-900/75 p-4 md:rounded-[2rem] md:p-5">
      <div>
        <p className="kd-section-eyebrow text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-400/80">
          <span className="kd-section-sigil" aria-hidden="true" />
          Cronica
        </p>
        <h3 className="mt-2 max-w-full text-xl font-black leading-tight text-stone-100 sm:text-2xl xl:text-[1.45rem]">
          Ultimos movimientos
        </h3>
        <div className="kd-divider mt-3 h-px w-full max-w-48" />
      </div>
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
    case "prize_awarded":
      return `${faction} gano el pozo de ${formatRealmSiegeGold(action.amount ?? 0)}.`;
    case "ai_fortify":
      return `${faction} reforzo automaticamente ${action.territoryId ?? "su defensa"}.`;
    case "ai_strategy_tick":
      return `${faction} ejecuto un ciclo estrategico de IA.`;
    default:
      return `${faction} registro un movimiento del Asedio.`;
  }
}
