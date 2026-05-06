import { supabase } from "../../utils/supabaseClient";
import {
  REALM_EXCHANGE_ASSETS,
  REALM_EXCHANGE_MAX_STAKE,
  REALM_EXCHANGE_MIN_STAKE,
  REALM_EXCHANGE_TRADE_LOT,
} from "./realmExchange.data";
import {
  buildPredictionId,
  getAssetBankruptcyState,
  getAssetPriceAt,
  getLatestBankruptcySince,
  getPredictionPayout,
  getPredictionSettleAt,
} from "./realmExchange.simulation";
import type {
  RealmExchangeAsset,
  RealmExchangeDirection,
  RealmExchangePlayerState,
  RealmExchangePosition,
  RealmExchangePrediction,
} from "./realmExchange.types";

const STATE_VERSION = 2;
const EXCHANGE_TABLE = "player_realm_exchange_states";

type RealmExchangeStateRow = {
  player_id: string;
  positions: unknown;
  predictions: unknown;
};

function getStorageKey(playerId: string) {
  return `kingdoom.realm-exchange.v${STATE_VERSION}.${playerId}`;
}

function getLegacyStorageKeys(playerId: string) {
  return [
    `kingdoom.realm-exchange.v1.${playerId}`,
    `kingdoom.realm-exchange.v${STATE_VERSION}.${playerId}`,
  ];
}

export function createEmptyExchangeState(): RealmExchangePlayerState {
  return {
    positions: [],
    predictions: [],
  };
}

function normalizeState(raw: Partial<RealmExchangePlayerState> | null | undefined) {
  return {
    positions: Array.isArray(raw?.positions) ? raw.positions : [],
    predictions: Array.isArray(raw?.predictions) ? raw.predictions : [],
  } satisfies RealmExchangePlayerState;
}

function loadLegacyLocalState(playerId: string): RealmExchangePlayerState {
  for (const key of getLegacyStorageKeys(playerId)) {
    const stored = window.localStorage.getItem(key);

    if (!stored) {
      continue;
    }

    try {
      return normalizeState(JSON.parse(stored) as Partial<RealmExchangePlayerState>);
    } catch {
      return createEmptyExchangeState();
    }
  }

  return createEmptyExchangeState();
}

function saveLegacyLocalState(playerId: string, state: RealmExchangePlayerState) {
  window.localStorage.setItem(getStorageKey(playerId), JSON.stringify(state));
}

function clearLegacyLocalState(playerId: string) {
  for (const key of getLegacyStorageKeys(playerId)) {
    window.localStorage.removeItem(key);
  }
}

function isStateEmpty(state: RealmExchangePlayerState) {
  return state.positions.length === 0 && state.predictions.length === 0;
}

function getAssetById(assetId: string): RealmExchangeAsset | null {
  return REALM_EXCHANGE_ASSETS.find((asset) => asset.id === assetId) ?? null;
}

export function applyExchangeBankruptcies(
  state: RealmExchangePlayerState,
  at = Date.now()
): {
  state: RealmExchangePlayerState;
  lostPositions: RealmExchangePosition[];
} {
  const lostPositions: RealmExchangePosition[] = [];
  const positions = state.positions.filter((position) => {
    const asset = getAssetById(position.assetId);

    if (!asset) {
      return true;
    }

    const bankruptcy = getLatestBankruptcySince(asset, position.updatedAt, at);

    if (!bankruptcy.isBankrupt) {
      return true;
    }

    lostPositions.push(position);
    return false;
  });

  return {
    state: lostPositions.length > 0 ? { ...state, positions } : state,
    lostPositions,
  };
}

function buildPredictionMergeKey(prediction: RealmExchangePrediction) {
  return [
    prediction.assetId,
    prediction.openedAt,
    prediction.direction,
    prediction.stakeGold,
    prediction.entryPrice,
  ].join(":");
}

function mergePositions(
  remotePositions: RealmExchangePosition[],
  localPositions: RealmExchangePosition[]
) {
  const byAsset = new Map<string, RealmExchangePosition>();

  for (const position of [...remotePositions, ...localPositions]) {
    const current = byAsset.get(position.assetId);

    if (!current) {
      byAsset.set(position.assetId, { ...position });
      continue;
    }

    const sharesOwned = current.sharesOwned + position.sharesOwned;
    const totalInvested = current.totalInvested + position.totalInvested;

    byAsset.set(position.assetId, {
      assetId: position.assetId,
      sharesOwned,
      totalInvested,
      averagePrice:
        sharesOwned > 0 ? Math.round(totalInvested / sharesOwned) : 0,
      updatedAt: Math.max(current.updatedAt, position.updatedAt),
    });
  }

  return Array.from(byAsset.values()).filter((entry) => entry.sharesOwned > 0);
}

function mergePredictions(
  remotePredictions: RealmExchangePrediction[],
  localPredictions: RealmExchangePrediction[]
) {
  const byPrediction = new Map<string, RealmExchangePrediction>();

  for (const prediction of [...remotePredictions, ...localPredictions]) {
    const key = buildPredictionMergeKey(prediction);
    const current = byPrediction.get(key);

    if (!current) {
      byPrediction.set(key, prediction);
      continue;
    }

    const next =
      current.status === "active" && prediction.status !== "active"
        ? prediction
        : current.resolvedAt && prediction.resolvedAt
          ? current.resolvedAt >= prediction.resolvedAt
            ? current
            : prediction
          : current;

    byPrediction.set(key, next);
  }

  return Array.from(byPrediction.values()).sort(
    (left, right) => left.openedAt - right.openedAt
  );
}

function mergeExchangeStates(
  remoteState: RealmExchangePlayerState,
  localState: RealmExchangePlayerState
) {
  if (isStateEmpty(remoteState)) {
    return localState;
  }

  if (isStateEmpty(localState)) {
    return remoteState;
  }

  if (JSON.stringify(remoteState) === JSON.stringify(localState)) {
    return remoteState;
  }

  return {
    positions: mergePositions(remoteState.positions, localState.positions),
    predictions: mergePredictions(
      remoteState.predictions,
      localState.predictions
    ),
  } satisfies RealmExchangePlayerState;
}

async function fetchRemoteExchangeState(
  playerId: string
): Promise<RealmExchangePlayerState | null> {
  const { data, error } = await supabase
    .from(EXCHANGE_TABLE)
    .select("player_id, positions, predictions")
    .eq("player_id", playerId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as RealmExchangeStateRow;
  return normalizeState({
    positions: row.positions as RealmExchangePlayerState["positions"],
    predictions: row.predictions as RealmExchangePlayerState["predictions"],
  });
}

async function persistRemoteExchangeState(
  playerId: string,
  state: RealmExchangePlayerState
) {
  const { error } = await supabase.from(EXCHANGE_TABLE).upsert(
    {
      player_id: playerId,
      positions: state.positions,
      predictions: state.predictions,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "player_id" }
  );

  return !error;
}

export async function loadExchangeState(
  playerId: string
): Promise<RealmExchangePlayerState> {
  const localState = loadLegacyLocalState(playerId);

  const remoteState = await fetchRemoteExchangeState(playerId);
  if (!remoteState) {
    const bankruptcyApplied = applyExchangeBankruptcies(localState);
    return bankruptcyApplied.state;
  }

  const mergedState = mergeExchangeStates(remoteState, localState);
  const bankruptcyApplied = applyExchangeBankruptcies(mergedState);
  const safeState = bankruptcyApplied.state;

  if (JSON.stringify(safeState) !== JSON.stringify(remoteState)) {
    const synced = await persistRemoteExchangeState(playerId, safeState);

    if (!synced) {
      return safeState;
    }
  }

  clearLegacyLocalState(playerId);
  return safeState;
}

export async function saveExchangeState(
  playerId: string,
  state: RealmExchangePlayerState
) {
  const synced = await persistRemoteExchangeState(playerId, state);

  if (!synced) {
    saveLegacyLocalState(playerId, state);
    return false;
  }

  clearLegacyLocalState(playerId);
  return true;
}

export function findPosition(
  state: RealmExchangePlayerState,
  assetId: string
): RealmExchangePosition | null {
  return state.positions.find((position) => position.assetId === assetId) ?? null;
}

export function findActivePrediction(
  state: RealmExchangePlayerState,
  assetId: string
): RealmExchangePrediction | null {
  return (
    state.predictions.find(
      (prediction) => prediction.assetId === assetId && prediction.status === "active"
    ) ?? null
  );
}

export function buyAssetShares(input: {
  state: RealmExchangePlayerState;
  asset: RealmExchangeAsset;
  gold: number;
  lots: number;
  at?: number;
}) {
  const bankruptcy = getAssetBankruptcyState(input.asset, input.at);

  if (bankruptcy.isBankrupt) {
    return {
      status: "error" as const,
      message: "Banca rota activa. Espera a que el reino se estabilice.",
      state: input.state,
      nextGold: input.gold,
    };
  }

  const lots = Math.max(1, Math.floor(input.lots));
  const shares = lots * REALM_EXCHANGE_TRADE_LOT;
  const price = getAssetPriceAt(input.asset, input.at);
  const cost = shares * price;

  if (cost > input.gold) {
    return {
      status: "error" as const,
      message: "Oro insuficiente para comprar ese lote.",
      state: input.state,
      nextGold: input.gold,
    };
  }

  const current = findPosition(input.state, input.asset.id);
  const positions = input.state.positions.filter(
    (position) => position.assetId !== input.asset.id
  );
  const totalShares = (current?.sharesOwned ?? 0) + shares;
  const totalInvested = (current?.totalInvested ?? 0) + cost;
  const nextPosition: RealmExchangePosition = {
    assetId: input.asset.id,
    sharesOwned: totalShares,
    totalInvested,
    averagePrice: Math.round(totalInvested / totalShares),
    updatedAt: input.at ?? Date.now(),
  };

  return {
    status: "success" as const,
    message: `Compraste ${shares} acciones de ${input.asset.assetName}.`,
    state: {
      ...input.state,
      positions: [...positions, nextPosition],
    },
    nextGold: input.gold - cost,
  };
}

export function sellAssetShares(input: {
  state: RealmExchangePlayerState;
  asset: RealmExchangeAsset;
  gold: number;
  lots: number;
  at?: number;
}) {
  const bankruptcy = getAssetBankruptcyState(input.asset, input.at);

  if (bankruptcy.isBankrupt) {
    return {
      status: "error" as const,
      message: "Banca rota activa. Las acciones de este reino quedaron sin valor.",
      state: input.state,
      nextGold: input.gold,
    };
  }

  const lots = Math.max(1, Math.floor(input.lots));
  const shares = lots * REALM_EXCHANGE_TRADE_LOT;
  const current = findPosition(input.state, input.asset.id);

  if (!current || current.sharesOwned < shares) {
    return {
      status: "error" as const,
      message: "No tienes suficientes acciones para vender ese lote.",
      state: input.state,
      nextGold: input.gold,
    };
  }

  const price = getAssetPriceAt(input.asset, input.at);
  const revenue = shares * price;
  const remainingShares = current.sharesOwned - shares;
  const positions = input.state.positions.filter(
    (position) => position.assetId !== input.asset.id
  );
  const nextPositions =
    remainingShares > 0
      ? [
          ...positions,
          {
            ...current,
            sharesOwned: remainingShares,
            totalInvested: current.averagePrice * remainingShares,
            updatedAt: input.at ?? Date.now(),
          },
        ]
      : positions;

  return {
    status: "success" as const,
    message: `Vendiste ${shares} acciones de ${input.asset.assetName}.`,
    state: {
      ...input.state,
      positions: nextPositions,
    },
    nextGold: input.gold + revenue,
  };
}

export async function sellAssetSharesSecure(input: {
  playerId: string;
  state: RealmExchangePlayerState;
  asset: RealmExchangeAsset;
  gold: number;
  lots: number;
  at?: number;
}) {
  const result = sellAssetShares(input);

  if (result.status === "error") {
    return result;
  }

  const lots = Math.max(1, Math.floor(input.lots));
  const shares = lots * REALM_EXCHANGE_TRADE_LOT;
  const remainingPosition = findPosition(result.state, input.asset.id);

  const { data, error } = await supabase.rpc("sell_realm_exchange_shares", {
    p_player_id: input.playerId,
    p_asset_id: input.asset.id,
    p_shares: shares,
    p_revenue: Math.max(0, result.nextGold - input.gold),
    p_remaining_total_invested: remainingPosition?.totalInvested ?? 0,
    p_average_price: remainingPosition?.averagePrice ?? 0,
  });

  if (error) {
    return result;
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row?.success) {
    return {
      status: "error" as const,
      message: row?.message ?? "No se pudo confirmar la venta en Supabase.",
      state: input.state,
      nextGold: input.gold,
    };
  }

  return {
    status: "success" as const,
    message: row.message ?? result.message,
    state: normalizeState({
      positions: row.positions as RealmExchangePlayerState["positions"],
      predictions: row.predictions as RealmExchangePlayerState["predictions"],
    }),
    nextGold: Number(row.remaining_gold ?? result.nextGold),
    remoteApplied: true,
  };
}

type ResolvePredictionRow = {
  success: boolean;
  message: string | null;
  remaining_gold: number | null;
  payout_gold: number | null;
  positions: unknown;
  predictions: unknown;
};

type OpenPredictionRow = {
  success: boolean;
  message: string | null;
  remaining_gold: number | null;
  positions: unknown;
  predictions: unknown;
};

export async function openAssetPredictionSecure(input: {
  playerId: string;
  state: RealmExchangePlayerState;
  asset: RealmExchangeAsset;
  gold: number;
  direction: RealmExchangeDirection;
  stakeGold: number;
  at?: number;
}) {
  const result = openAssetPrediction(input);

  if (result.status === "error") {
    return result;
  }

  const prediction = result.state.predictions[result.state.predictions.length - 1];

  if (!prediction) {
    return {
      status: "error" as const,
      message: "No se pudo preparar la prediccion.",
      state: input.state,
      nextGold: input.gold,
    };
  }

  const { data, error } = await supabase.rpc("open_realm_exchange_prediction", {
    p_player_id: input.playerId,
    p_prediction: prediction,
    p_stake_gold: prediction.stakeGold,
  });

  if (error) {
    return {
      status: "error" as const,
      message: "No se pudo abrir la prediccion segura en Supabase. Ejecuta el SQL actualizado de la bolsa.",
      state: input.state,
      nextGold: input.gold,
    };
  }

  const row = (Array.isArray(data) ? data[0] : data) as OpenPredictionRow | null;

  if (!row?.success) {
    return {
      status: "error" as const,
      message: row?.message ?? "No se pudo abrir la prediccion.",
      state: input.state,
      nextGold: row?.remaining_gold ?? input.gold,
    };
  }

  return {
    status: "success" as const,
    message: row.message ?? result.message,
    state: normalizeState({
      positions: row.positions as RealmExchangePlayerState["positions"],
      predictions: row.predictions as RealmExchangePlayerState["predictions"],
    }),
    nextGold: Number(row.remaining_gold ?? result.nextGold),
    remoteApplied: true,
  };
}

export async function resolveRealmExchangePredictionsSecure(input: {
  playerId: string;
  state: RealmExchangePlayerState;
  resolvedPredictions: RealmExchangePrediction[];
}) {
  const resolvedById = new Map(input.resolvedPredictions.map((prediction) => [prediction.id, prediction]));
  const payablePredictions = input.state.predictions
    .filter((prediction) => prediction.status === "active")
    .map((prediction) => resolvedById.get(prediction.id))
    .filter(
      (prediction): prediction is RealmExchangePrediction =>
        prediction !== undefined && prediction.status !== "active"
    );

  if (payablePredictions.length === 0) {
    return {
      status: "success" as const,
      message: "No habia predicciones listas para resolver.",
      state: input.state,
      nextGold: null,
      payoutGold: 0,
      remoteApplied: false,
    };
  }

  const { data, error } = await supabase.rpc("resolve_realm_exchange_predictions", {
    p_player_id: input.playerId,
    p_resolved_predictions: payablePredictions,
  });

  if (error) {
    return {
      status: "error" as const,
      message: "No se pudo confirmar la prediccion en Supabase. Ejecuta el SQL actualizado de la bolsa.",
      state: input.state,
      nextGold: null,
      payoutGold: 0,
      remoteApplied: false,
    };
  }

  const row = (Array.isArray(data) ? data[0] : data) as ResolvePredictionRow | null;

  if (!row?.success) {
    return {
      status: "error" as const,
      message: row?.message ?? "No se pudo resolver la prediccion.",
      state: input.state,
      nextGold: row?.remaining_gold ?? null,
      payoutGold: 0,
      remoteApplied: false,
    };
  }

  return {
    status: "success" as const,
    message: row.message ?? "Prediccion resuelta.",
    state: normalizeState({
      positions: row.positions as RealmExchangePlayerState["positions"],
      predictions: row.predictions as RealmExchangePlayerState["predictions"],
    }),
    nextGold: row.remaining_gold ?? null,
    payoutGold: Number(row.payout_gold ?? 0),
    remoteApplied: true,
  };
}

export function openAssetPrediction(input: {
  state: RealmExchangePlayerState;
  asset: RealmExchangeAsset;
  gold: number;
  direction: RealmExchangeDirection;
  stakeGold: number;
  at?: number;
}) {
  const bankruptcy = getAssetBankruptcyState(input.asset, input.at);

  if (bankruptcy.isBankrupt) {
    return {
      status: "error" as const,
      message: "No se puede abrir prediccion durante una banca rota.",
      state: input.state,
      nextGold: input.gold,
    };
  }

  const stakeGold = Math.floor(input.stakeGold);
  const now = input.at ?? Date.now();

  if (findActivePrediction(input.state, input.asset.id)) {
    return {
      status: "error" as const,
      message: "Ya tienes una prediccion activa en este reino.",
      state: input.state,
      nextGold: input.gold,
    };
  }

  if (stakeGold < REALM_EXCHANGE_MIN_STAKE || stakeGold > REALM_EXCHANGE_MAX_STAKE) {
    return {
      status: "error" as const,
      message: `La prediccion debe estar entre ${REALM_EXCHANGE_MIN_STAKE} y ${REALM_EXCHANGE_MAX_STAKE} de oro.`,
      state: input.state,
      nextGold: input.gold,
    };
  }

  if (stakeGold > input.gold) {
    return {
      status: "error" as const,
      message: "Oro insuficiente para abrir esa prediccion.",
      state: input.state,
      nextGold: input.gold,
    };
  }

  const prediction: RealmExchangePrediction = {
    id: buildPredictionId(input.asset.id),
    assetId: input.asset.id,
    direction: input.direction,
    stakeGold,
    entryPrice: getAssetPriceAt(input.asset, now),
    openedAt: now,
    settlesAt: getPredictionSettleAt(now),
    lockedPayoutMultiplier: getPredictionPayout(input.asset),
    status: "active",
  };

  return {
    status: "success" as const,
    message: "Prediccion abierta por 2 horas.",
    state: {
      ...input.state,
      predictions: [...input.state.predictions, prediction],
    },
    nextGold: input.gold - stakeGold,
  };
}
