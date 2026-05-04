export type RealmExchangeVolatility = "low" | "medium" | "high" | "extreme";
export type RealmExchangeDirection = "up" | "down";
export type RealmExchangePredictionStatus = "active" | "won" | "lost" | "refunded";

export type RealmExchangeAsset = {
  id: string;
  kingdomName: string;
  assetName: string;
  description: string;
  basePrice: number;
  priceFloor: number;
  priceCeiling: number;
  volatility: RealmExchangeVolatility;
  bias: -1 | 0 | 1;
  tickIntervalMinutes: number;
  accent: string;
};

export type RealmExchangePoint = {
  at: number;
  price: number;
};

export type RealmExchangePosition = {
  assetId: string;
  sharesOwned: number;
  totalInvested: number;
  averagePrice: number;
  updatedAt: number;
};

export type RealmExchangePrediction = {
  id: string;
  assetId: string;
  direction: RealmExchangeDirection;
  stakeGold: number;
  entryPrice: number;
  openedAt: number;
  settlesAt: number;
  lockedPayoutMultiplier: number;
  status: RealmExchangePredictionStatus;
  resultPrice?: number;
  resolvedAt?: number;
  payoutGold?: number;
};

export type RealmExchangePlayerState = {
  positions: RealmExchangePosition[];
  predictions: RealmExchangePrediction[];
};
