import type { RealmExchangeAsset, RealmExchangeVolatility } from "./realmExchange.types";

export const REALM_EXCHANGE_TRADE_LOT = 10;
export const REALM_EXCHANGE_PREDICTION_HOURS = 2;
export const REALM_EXCHANGE_MIN_STAKE = 100;
export const REALM_EXCHANGE_MAX_STAKE = 150000;
export const REALM_EXCHANGE_PRICE_CEILING = 200;

export const REALM_EXCHANGE_PAYOUTS: Record<RealmExchangeVolatility, number> = {
  low: 1.4,
  medium: 1.65,
  high: 1.95,
  extreme: 2.25,
};

export const REALM_EXCHANGE_ASSETS: RealmExchangeAsset[] = [
  {
    id: "arcania-aether-crystals",
    kingdomId: "arcania",
    kingdomName: "Arcania",
    assetName: "Cristales de Aether",
    description: "Mineral arcano usado para rituales, runas y motores de mana.",
    basePrice: 124,
    priceFloor: 72,
    priceCeiling: REALM_EXCHANGE_PRICE_CEILING,
    volatility: "high",
    bias: 1,
    tickIntervalMinutes: 10,
    accent: "#38d5ff",
  },
  {
    id: "vyralis-black-sap",
    kingdomId: "vyralis",
    kingdomName: "Vyralis",
    assetName: "Sangre Negra",
    description: "Resina oscura de bosques profundos, codiciada por alquimistas y cazadores.",
    basePrice: 88,
    priceFloor: 48,
    priceCeiling: REALM_EXCHANGE_PRICE_CEILING,
    volatility: "high",
    bias: -1,
    tickIntervalMinutes: 10,
    accent: "#75f0a8",
  },
  {
    id: "kaelum-volcanic-steel",
    kingdomId: "kaelum-gard",
    kingdomName: "Kaelum-Gard",
    assetName: "Acero Volcanico",
    description: "Metal pesado de forja militar, estable pero sensible a guerras de frontera.",
    basePrice: 146,
    priceFloor: 104,
    priceCeiling: REALM_EXCHANGE_PRICE_CEILING,
    volatility: "low",
    bias: 0,
    tickIntervalMinutes: 10,
    accent: "#ffb347",
  },
  {
    id: "aurelia-solar-silk",
    kingdomId: "aurelia",
    kingdomName: "Aurelia",
    assetName: "Seda Solar",
    description: "Textil noble que sube con festivales, pactos comerciales y moda cortesana.",
    basePrice: 102,
    priceFloor: 64,
    priceCeiling: REALM_EXCHANGE_PRICE_CEILING,
    volatility: "medium",
    bias: 1,
    tickIntervalMinutes: 10,
    accent: "#ffd76a",
  },
];
