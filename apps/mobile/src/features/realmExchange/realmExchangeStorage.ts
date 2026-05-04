import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  REALM_EXCHANGE_MAX_STAKE,
  REALM_EXCHANGE_MIN_STAKE,
  REALM_EXCHANGE_TRADE_LOT,
} from "./realmExchangeData";
import {
  buildPredictionId,
  getAssetPriceAt,
  getPredictionPayout,
  getPredictionSettleAt,
} from "./realmExchangeSimulation";
import type {
  RealmExchangeAsset,
  RealmExchangeDirection,
  RealmExchangePlayerState,
  RealmExchangePosition,
  RealmExchangePrediction,
} from "./realmExchangeTypes";

const STATE_VERSION = 1;

function getStorageKey(playerId: string) {
  return `kingdoom.native.realm-exchange.v${STATE_VERSION}.${playerId}`;
}

export function createEmptyExchangeState(): RealmExchangePlayerState {
  return {
    positions: [],
    predictions: [],
  };
}

export async function loadExchangeState(playerId: string): Promise<RealmExchangePlayerState> {
  const stored = await AsyncStorage.getItem(getStorageKey(playerId));

  if (!stored) {
    return createEmptyExchangeState();
  }

  try {
    const parsed = JSON.parse(stored) as Partial<RealmExchangePlayerState>;

    return {
      positions: Array.isArray(parsed.positions) ? parsed.positions : [],
      predictions: Array.isArray(parsed.predictions) ? parsed.predictions : [],
    };
  } catch {
    return createEmptyExchangeState();
  }
}

export async function saveExchangeState(playerId: string, state: RealmExchangePlayerState) {
  await AsyncStorage.setItem(getStorageKey(playerId), JSON.stringify(state));
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

  return {
    status: "success" as const,
    message: `Compraste ${shares} acciones.`,
    state: {
      ...input.state,
      positions: [
        ...positions,
        {
          assetId: input.asset.id,
          sharesOwned: totalShares,
          totalInvested,
          averagePrice: Math.round(totalInvested / totalShares),
          updatedAt: input.at ?? Date.now(),
        },
      ],
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
  const lots = Math.max(1, Math.floor(input.lots));
  const shares = lots * REALM_EXCHANGE_TRADE_LOT;
  const current = findPosition(input.state, input.asset.id);

  if (!current || current.sharesOwned < shares) {
    return {
      status: "error" as const,
      message: "No tienes suficientes acciones.",
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

  return {
    status: "success" as const,
    message: `Vendiste ${shares} acciones.`,
    state: {
      ...input.state,
      positions:
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
          : positions,
    },
    nextGold: input.gold + revenue,
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
  const stakeGold = Math.floor(input.stakeGold);
  const now = input.at ?? Date.now();

  if (findActivePrediction(input.state, input.asset.id)) {
    return {
      status: "error" as const,
      message: "Ya tienes prediccion activa en este reino.",
      state: input.state,
      nextGold: input.gold,
    };
  }

  if (stakeGold < REALM_EXCHANGE_MIN_STAKE || stakeGold > REALM_EXCHANGE_MAX_STAKE) {
    return {
      status: "error" as const,
      message: `Prediccion entre ${REALM_EXCHANGE_MIN_STAKE} y ${REALM_EXCHANGE_MAX_STAKE}.`,
      state: input.state,
      nextGold: input.gold,
    };
  }

  if (stakeGold > input.gold) {
    return {
      status: "error" as const,
      message: "Oro insuficiente para abrir prediccion.",
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
