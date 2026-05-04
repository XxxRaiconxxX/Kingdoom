import {
  REALM_EXCHANGE_PAYOUTS,
  REALM_EXCHANGE_PREDICTION_HOURS,
} from "./realmExchange.data";
import type {
  RealmExchangeAsset,
  RealmExchangePoint,
  RealmExchangePrediction,
} from "./realmExchange.types";

const VOLATILITY_AMPLITUDE = {
  low: 0.075,
  medium: 0.13,
  high: 0.2,
  extreme: 0.28,
};

function hashSeed(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededUnit(seed: string): number {
  const value = hashSeed(seed);
  return (value % 100000) / 100000;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getAssetTick(asset: RealmExchangeAsset, at = Date.now()): number {
  return Math.floor(at / (asset.tickIntervalMinutes * 60 * 1000));
}

export function getAssetPriceAt(asset: RealmExchangeAsset, at = Date.now()): number {
  const tick = getAssetTick(asset, at);
  const amplitude = VOLATILITY_AMPLITUDE[asset.volatility];
  const phase = (hashSeed(asset.id) % 628) / 100;
  const noise = seededUnit(`${asset.id}:${tick}`) - 0.5;
  const longWave = Math.sin(tick / 5.2 + phase) * amplitude * 0.48;
  const shortWave = Math.sin(tick / 1.8 + phase * 0.7) * amplitude * 0.22;
  const bias = asset.bias * amplitude * 0.12 * Math.sin(tick / 13 + phase);
  const randomPush = noise * amplitude * 0.62;
  const price = asset.basePrice * (1 + longWave + shortWave + bias + randomPush);

  return Math.round(clamp(price, asset.priceFloor, asset.priceCeiling));
}

export function getNextTickAt(asset: RealmExchangeAsset, at = Date.now()): number {
  const tickMs = asset.tickIntervalMinutes * 60 * 1000;
  return (Math.floor(at / tickMs) + 1) * tickMs;
}

export function buildAssetHistory(
  asset: RealmExchangeAsset,
  at = Date.now(),
  points = 18
): RealmExchangePoint[] {
  const tickMs = asset.tickIntervalMinutes * 60 * 1000;
  const currentTickAt = Math.floor(at / tickMs) * tickMs;

  return Array.from({ length: points }, (_, index) => {
    const pointAt = currentTickAt - (points - index - 1) * tickMs;
    return {
      at: pointAt,
      price: getAssetPriceAt(asset, pointAt),
    };
  });
}

export function getAssetDelta(asset: RealmExchangeAsset, at = Date.now()): number {
  const tickMs = asset.tickIntervalMinutes * 60 * 1000;
  return getAssetPriceAt(asset, at) - getAssetPriceAt(asset, at - tickMs);
}

export function getPredictionPayout(asset: RealmExchangeAsset): number {
  return REALM_EXCHANGE_PAYOUTS[asset.volatility];
}

export function buildPredictionId(assetId: string): string {
  return `${assetId}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function getPredictionSettleAt(openedAt = Date.now()): number {
  return openedAt + REALM_EXCHANGE_PREDICTION_HOURS * 60 * 60 * 1000;
}

export function resolvePrediction(
  prediction: RealmExchangePrediction,
  asset: RealmExchangeAsset,
  at = Date.now()
): RealmExchangePrediction {
  if (prediction.status !== "active" || at < prediction.settlesAt) {
    return prediction;
  }

  const resultPrice = getAssetPriceAt(asset, prediction.settlesAt);
  const won =
    (prediction.direction === "up" && resultPrice > prediction.entryPrice) ||
    (prediction.direction === "down" && resultPrice < prediction.entryPrice);
  const refunded = resultPrice === prediction.entryPrice;
  const payoutGold = refunded
    ? prediction.stakeGold
    : won
      ? Math.floor(prediction.stakeGold * prediction.lockedPayoutMultiplier)
      : 0;

  return {
    ...prediction,
    status: refunded ? "refunded" : won ? "won" : "lost",
    resultPrice,
    payoutGold,
    resolvedAt: at,
  };
}

