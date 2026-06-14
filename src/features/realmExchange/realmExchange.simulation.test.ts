import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { getAssetTick } from './realmExchange.simulation';
import type { RealmExchangeAsset } from './realmExchange.types';

describe('realmExchange.simulation', () => {
  describe('getAssetTick', () => {
    // Helper to create a mock asset with a specific tick interval
    const createMockAsset = (tickIntervalMinutes: number): RealmExchangeAsset => ({
      id: "mock-asset",
      kingdomId: "mock-kingdom",
      kingdomName: "Mock Kingdom",
      assetName: "Mock Asset",
      description: "A mock asset for testing",
      basePrice: 100,
      priceFloor: 50,
      priceCeiling: 200,
      volatility: "medium",
      bias: 0,
      tickIntervalMinutes,
      accent: "#000",
    });

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return 0 when time is exactly 0', () => {
      const asset = createMockAsset(10); // 10 minutes interval
      expect(getAssetTick(asset, 0)).toBe(0);
    });

    it('should return 0 when time is less than one interval', () => {
      const asset = createMockAsset(10); // 10 minutes = 600,000 ms
      expect(getAssetTick(asset, 599_999)).toBe(0);
    });

    it('should return 1 when time is exactly one interval', () => {
      const asset = createMockAsset(10);
      expect(getAssetTick(asset, 600_000)).toBe(1);
    });

    it('should calculate correct tick for multiple intervals', () => {
      const asset = createMockAsset(10);
      // 25 minutes = 2.5 intervals = tick 2
      expect(getAssetTick(asset, 25 * 60 * 1000)).toBe(2);

      // 100 minutes = 10 intervals = tick 10
      expect(getAssetTick(asset, 100 * 60 * 1000)).toBe(10);
    });

    it('should handle different tick intervals correctly', () => {
      const asset5Min = createMockAsset(5); // 5 minutes = 300,000 ms
      expect(getAssetTick(asset5Min, 300_000)).toBe(1);
      expect(getAssetTick(asset5Min, 600_000)).toBe(2);

      const asset15Min = createMockAsset(15); // 15 minutes = 900,000 ms
      expect(getAssetTick(asset15Min, 600_000)).toBe(0);
      expect(getAssetTick(asset15Min, 900_000)).toBe(1);
    });

    it('should use Date.now() when "at" parameter is not provided', () => {
      const asset = createMockAsset(10);

      // Set system time to exactly 3 intervals (30 minutes)
      const mockTime = 30 * 60 * 1000;
      vi.setSystemTime(mockTime);

      expect(getAssetTick(asset)).toBe(3);

      // Advance time by 5 minutes (still tick 3)
      vi.setSystemTime(mockTime + 5 * 60 * 1000);
      expect(getAssetTick(asset)).toBe(3);

      // Advance time by another 5 minutes (now tick 4)
      vi.setSystemTime(mockTime + 10 * 60 * 1000);
      expect(getAssetTick(asset)).toBe(4);
    });
  });
});
