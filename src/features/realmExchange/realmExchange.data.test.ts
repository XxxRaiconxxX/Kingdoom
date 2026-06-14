import { describe, it, expect } from "vitest";
import {
  REALM_EXCHANGE_TRADE_LOT,
  REALM_EXCHANGE_PREDICTION_HOURS,
  REALM_EXCHANGE_MIN_STAKE,
  REALM_EXCHANGE_MAX_STAKE,
  REALM_EXCHANGE_PRICE_CEILING,
  REALM_EXCHANGE_BANKRUPTCY_CHANCE,
  REALM_EXCHANGE_BANKRUPTCY_LOCK_MINUTES,
  REALM_EXCHANGE_PAYOUTS,
  REALM_EXCHANGE_ASSETS
} from "./realmExchange.data";

describe("Realm Exchange Data Constants", () => {
  it("should have correct REALM_EXCHANGE_TRADE_LOT value", () => {
    expect(REALM_EXCHANGE_TRADE_LOT).toBe(10);
  });

  it("should have correct REALM_EXCHANGE_PREDICTION_HOURS value", () => {
    expect(REALM_EXCHANGE_PREDICTION_HOURS).toBe(2);
  });

  it("should have correct stake limits", () => {
    expect(REALM_EXCHANGE_MIN_STAKE).toBe(100);
    expect(REALM_EXCHANGE_MAX_STAKE).toBe(500000);
    expect(REALM_EXCHANGE_MIN_STAKE).toBeLessThan(REALM_EXCHANGE_MAX_STAKE);
  });

  it("should have correct price and bankruptcy limits", () => {
    expect(REALM_EXCHANGE_PRICE_CEILING).toBe(200);
    expect(REALM_EXCHANGE_BANKRUPTCY_CHANCE).toBe(0.01);
    expect(REALM_EXCHANGE_BANKRUPTCY_LOCK_MINUTES).toBe(90);
  });

  it("should have expected payout multipliers mapped by volatility", () => {
    expect(REALM_EXCHANGE_PAYOUTS).toEqual({
      low: 1.4,
      medium: 1.65,
      high: 1.95,
      extreme: 2.25,
    });
  });
});

describe("REALM_EXCHANGE_ASSETS", () => {
  it("should contain a predefined list of assets", () => {
    expect(Array.isArray(REALM_EXCHANGE_ASSETS)).toBe(true);
    expect(REALM_EXCHANGE_ASSETS.length).toBeGreaterThan(0);
  });

  it("should have assets with valid structures and constraints", () => {
    REALM_EXCHANGE_ASSETS.forEach(asset => {
      // Basic structure
      expect(asset).toHaveProperty("id");
      expect(asset).toHaveProperty("kingdomId");
      expect(asset).toHaveProperty("kingdomName");
      expect(asset).toHaveProperty("assetName");
      expect(asset).toHaveProperty("description");
      expect(asset).toHaveProperty("basePrice");
      expect(asset).toHaveProperty("priceFloor");
      expect(asset).toHaveProperty("priceCeiling");
      expect(asset).toHaveProperty("volatility");
      expect(asset).toHaveProperty("bias");
      expect(asset).toHaveProperty("tickIntervalMinutes");
      expect(asset).toHaveProperty("accent");

      // Valid types
      expect(typeof asset.id).toBe("string");
      expect(typeof asset.kingdomId).toBe("string");
      expect(typeof asset.kingdomName).toBe("string");
      expect(typeof asset.assetName).toBe("string");
      expect(typeof asset.basePrice).toBe("number");

      // Constraints
      expect(asset.priceFloor).toBeLessThan(asset.basePrice);
      expect(asset.basePrice).toBeLessThanOrEqual(asset.priceCeiling);
      expect(asset.priceCeiling).toBe(REALM_EXCHANGE_PRICE_CEILING); // Matches constant

      // Bias check
      expect([-1, 0, 1]).toContain(asset.bias);

      // Volatility check based on known types
      expect(["low", "medium", "high", "extreme"]).toContain(asset.volatility);
    });
  });

  it("should have unique asset IDs", () => {
    const ids = REALM_EXCHANGE_ASSETS.map(asset => asset.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
