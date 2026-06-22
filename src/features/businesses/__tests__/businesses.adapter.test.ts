import { describe, it, expect } from "vitest";
import {
  mapBusinessProposalRow,
  mapBusinessRow,
  mapBusinessCollectionLogRow,
  buildBusinessProposalPayload,
  projectBusinessStorage,
  formatBusinessPaybackHours
} from "../businesses.adapter";
import type {
  BusinessProposalRow,
  BusinessRow,
  BusinessCollectionLogRow,
  BusinessProposalInput
} from "../businesses.types";

describe("businesses.adapter", () => {
  describe("mapBusinessProposalRow", () => {
    it("maps a full valid row to a PlayerBusinessProposal object correctly", () => {
      const mockRow: BusinessProposalRow = {
        id: "proposal-1",
        player_id: "player-1",
        proposed_by_id: "proposer-1",
        proposed_by_name: "Proposer Name",
        name: "Tavern",
        description: "A lovely tavern",
        business_type: "entertainment",
        icon: "🍺",
        production_label: "Produce oro",
        gold_per_hour: 100,
        max_storage: 1000,
        hourly_range_min: 50,
        hourly_range_max: 150,
        base_cost: 500,
        staff_fee: 50,
        opening_cost: 550,
        notes: "Some notes",
        status: "pending",
        created_at: "2023-10-01T00:00:00.000Z",
        responded_at: "2023-10-02T00:00:00.000Z",
      };

      const result = mapBusinessProposalRow(mockRow);

      expect(result).toEqual({
        id: "proposal-1",
        playerId: "player-1",
        proposedById: "proposer-1",
        proposedByName: "Proposer Name",
        name: "Tavern",
        description: "A lovely tavern",
        businessType: "entertainment",
        icon: "🍺",
        productionLabel: "Produce oro",
        goldPerHour: 100,
        maxStorage: 1000,
        hourlyRangeMin: 50,
        hourlyRangeMax: 150,
        baseCost: 500,
        staffFee: 50,
        openingCost: 550,
        notes: "Some notes",
        status: "pending",
        createdAt: "2023-10-01T00:00:00.000Z",
        respondedAt: "2023-10-02T00:00:00.000Z",
      });
    });

    it("handles null/undefined optional values and falls back correctly", () => {
      const mockRow: BusinessProposalRow = {
        id: "proposal-2",
        player_id: "player-2",
        proposed_by_id: null,
        proposed_by_name: null,
        name: "Empty Tavern",
        description: "No description",
        business_type: "store",
        icon: null,
        production_label: null,
        gold_per_hour: null as any,
        max_storage: null as any,
        hourly_range_min: null,
        hourly_range_max: null,
        base_cost: null,
        staff_fee: null,
        opening_cost: null as any,
        notes: null,
        status: "pending",
        created_at: "2023-10-01T00:00:00.000Z",
        responded_at: null,
      };

      const result = mapBusinessProposalRow(mockRow);

      expect(result).toEqual({
        id: "proposal-2",
        playerId: "player-2",
        proposedById: null,
        proposedByName: null,
        name: "Empty Tavern",
        description: "No description",
        businessType: "store",
        icon: "🏪", // DEFAULT_BUSINESS_ICON
        productionLabel: "Produce oro pasivo", // Fallback label
        goldPerHour: 0,
        maxStorage: 0,
        hourlyRangeMin: 0,
        hourlyRangeMax: 0,
        baseCost: 0,
        staffFee: 0,
        openingCost: 0,
        notes: null,
        status: "pending",
        createdAt: "2023-10-01T00:00:00.000Z",
        respondedAt: null,
      });
    });

    it("handles string values with whitespace and negative numbers", () => {
      const mockRow: BusinessProposalRow = {
        id: "proposal-3",
        player_id: "player-3",
        proposed_by_id: "proposer-3",
        proposed_by_name: "Proposer",
        name: "Tavern",
        description: "Description",
        business_type: "store",
        icon: " 💰 ",
        production_label: " Produce mucho oro ",
        gold_per_hour: -10, // Should become 0
        max_storage: 50.5, // Should become 50 (floor)
        hourly_range_min: -5, // Should become 0
        hourly_range_max: 99.9, // Should become 99 (floor)
        base_cost: undefined as any, // Should become 0
        staff_fee: null, // Should become 0
        opening_cost: NaN as any, // Should become 0
        notes: "notes",
        status: "accepted",
        created_at: "2023-10-01T00:00:00.000Z",
        responded_at: "2023-10-02T00:00:00.000Z",
      };

      const result = mapBusinessProposalRow(mockRow);

      expect(result.goldPerHour).toBe(0); // Math.max(0, ...)
      expect(result.maxStorage).toBe(50); // Math.floor(...)
      expect(result.hourlyRangeMin).toBe(0); // Math.max(0, ...)
      expect(result.hourlyRangeMax).toBe(99); // Math.floor(...)
      expect(result.baseCost).toBe(0); // Default to 0
      expect(result.staffFee).toBe(0); // Default to 0
      expect(result.openingCost).toBe(0); // NaN becomes 0

      expect(result.icon).toBe("💰"); // Trimmed
      expect(result.productionLabel).toBe("Produce mucho oro"); // Trimmed
    });
  });

  describe("mapBusinessRow", () => {
    it("maps a full valid row to a PlayerBusiness object correctly", () => {
      const mockRow: BusinessRow = {
        id: "biz-1",
        player_id: "player-1",
        proposal_id: "proposal-1",
        name: "Tavern",
        description: "A lovely tavern",
        business_type: "entertainment",
        icon: "🍺",
        production_label: "Produce oro",
        gold_per_hour: 100,
        max_storage: 1000,
        hourly_range_min: 50,
        hourly_range_max: 150,
        base_cost: 500,
        staff_fee: 50,
        opening_cost: 550,
        status: "active",
        opened_at: "2023-10-01T00:00:00.000Z",
        last_collected_at: "2023-10-01T00:00:00.000Z",
        created_at: "2023-10-01T00:00:00.000Z",
        updated_at: "2023-10-02T00:00:00.000Z",
      };

      const result = mapBusinessRow(mockRow);

      expect(result.id).toBe("biz-1");
      expect(result.proposalId).toBe("proposal-1");
      expect(result.goldPerHour).toBe(100);
    });
  });

  describe("mapBusinessCollectionLogRow", () => {
    it("maps a full valid row to a BusinessCollectionLogEntry correctly", () => {
      const mockRow: BusinessCollectionLogRow = {
        id: "log-1",
        business_id: "biz-1",
        player_id: "player-1",
        collected_gold: 50,
        collected_at: "2023-10-01T00:00:00.000Z",
      };

      const result = mapBusinessCollectionLogRow(mockRow);

      expect(result.id).toBe("log-1");
      expect(result.collectedGold).toBe(50);
    });
  });

  describe("buildBusinessProposalPayload", () => {
    it("builds the correct payload from input", () => {
      const input: BusinessProposalInput = {
        id: " proposal-1 ",
        playerId: " player-1 ",
        name: " Tavern ",
        description: " Desc ",
        businessType: " entertainment ",
        icon: " 🍺 ",
        productionLabel: " Label ",
        goldPerHour: 100,
        maxStorage: 1000,
        hourlyRangeMin: 50,
        hourlyRangeMax: 150,
        baseCost: 500,
        staffFee: 50,
        openingCost: 0, // Should be calculated as baseCost + staffFee
        notes: " Notes ",
        status: "pending",
      };

      const result = buildBusinessProposalPayload(input);

      expect(result.id).toBe("proposal-1");
      expect(result.name).toBe("Tavern");
      expect(result.opening_cost).toBe(550);
    });
  });

  describe("projectBusinessStorage", () => {
    it("calculates storage correctly for an active business", () => {
      const business = {
        goldPerHour: 3600, // 1 gold per second
        maxStorage: 100,
        lastCollectedAt: "2023-10-01T00:00:00.000Z",
      };

      // 50 seconds later
      const now = new Date("2023-10-01T00:00:50.000Z").getTime();

      const result = projectBusinessStorage(business, now);

      expect(result.storedGold).toBe(50);
      expect(result.fillRatio).toBe(0.5);
      expect(result.capped).toBe(false);
      // Next full should be 50 seconds from 'now'
      expect(result.nextFullAt).toBe(now + 50 * 1000);
    });

    it("handles invalid lastCollectedAt", () => {
      const business = {
        goldPerHour: 3600,
        maxStorage: 100,
        lastCollectedAt: "invalid date",
      };

      const result = projectBusinessStorage(business);

      expect(result.storedGold).toBe(0);
      expect(result.fillRatio).toBe(0);
      expect(result.capped).toBe(false);
      expect(result.nextFullAt).toBeNull();
    });
  });

  describe("formatBusinessPaybackHours", () => {
    it("calculates payback hours correctly", () => {
      expect(formatBusinessPaybackHours(10, 100)).toBe(10);
      expect(formatBusinessPaybackHours(3, 10)).toBe(3.3);
    });

    it("returns null for invalid inputs", () => {
      expect(formatBusinessPaybackHours(0, 100)).toBeNull();
      expect(formatBusinessPaybackHours(-10, 100)).toBeNull();
      expect(formatBusinessPaybackHours(10, 0)).toBeNull();
      expect(formatBusinessPaybackHours(10, -100)).toBeNull();
    });
  });
});
