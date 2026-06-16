import { describe, it, expect } from "vitest";
import { getMarketRotationState } from "./market.rotation";
import type { MarketItem } from "../../types";

describe("market.rotation spawnChance filtering", () => {
  const mockItems: MarketItem[] = [
    {
      id: "item-always",
      name: "Always Spawn",
      description: "Always spawns",
      price: 100,
      rarity: "common",
      imageUrl: "https://example.com/always.png",
      category: "swords",
      stockStatus: "available",
      spawnChance: 1.0,
    },
    {
      id: "item-never",
      name: "Never Spawn",
      description: "Never spawns",
      price: 100,
      rarity: "common",
      imageUrl: "https://example.com/never.png",
      category: "swords",
      stockStatus: "available",
      spawnChance: 0.0,
    },
    {
      id: "item-half",
      name: "Half Spawn",
      description: "Spawns half the time",
      price: 100,
      rarity: "common",
      imageUrl: "https://example.com/half.png",
      category: "swords",
      stockStatus: "available",
      spawnChance: 0.5,
    },
  ];

  it("should always include items with spawnChance = 1.0 and exclude spawnChance = 0.0", () => {
    // Run across 20 different rotation windows
    for (let i = 0; i < 20; i++) {
      const now = i * 2 * 60 * 60 * 1000 + 1000; // windowId = i
      const state = getMarketRotationState(mockItems, now);
      
      const hasAlways = state.items.some(item => item.id === "item-always");
      const hasNever = state.items.some(item => item.id === "item-never");

      expect(hasAlways).toBe(true);
      expect(hasNever).toBe(false);
    }
  });

  it("should select spawnChance = 0.5 items deterministically based on seed", () => {
    let spawnCount = 0;
    const runs = 100;
    
    for (let i = 0; i < runs; i++) {
      const now = i * 2 * 60 * 60 * 1000 + 1000;
      const state = getMarketRotationState(mockItems, now);
      if (state.items.some(item => item.id === "item-half")) {
        spawnCount++;
      }
    }

    // With 100 runs and spawnChance 0.5, the spawn count should be around 50.
    // Given deterministic PRNG, let's verify it falls within a reasonable statistical range [30, 70].
    expect(spawnCount).toBeGreaterThanOrEqual(30);
    expect(spawnCount).toBeLessThanOrEqual(70);
  });
});
