import { describe, it, expect } from "vitest";
import { NARRATIVE_ENCOUNTERS, NarrativeEncounter } from "../pve";

describe("NARRATIVE_ENCOUNTERS", () => {
  it("should be an array and have items", () => {
    expect(Array.isArray(NARRATIVE_ENCOUNTERS)).toBe(true);
    expect(NARRATIVE_ENCOUNTERS.length).toBeGreaterThan(0);
  });

  it("should have unique IDs", () => {
    const ids = NARRATIVE_ENCOUNTERS.map((encounter) => encounter.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have valid property types and value ranges for each encounter", () => {
    NARRATIVE_ENCOUNTERS.forEach((encounter: NarrativeEncounter) => {
      // String properties
      expect(typeof encounter.id).toBe("string");
      expect(encounter.id.length).toBeGreaterThan(0);

      expect(typeof encounter.title).toBe("string");
      expect(encounter.title.length).toBeGreaterThan(0);

      expect(typeof encounter.enemyName).toBe("string");
      expect(encounter.enemyName.length).toBeGreaterThan(0);

      expect(typeof encounter.realm).toBe("string");
      expect(encounter.realm.length).toBeGreaterThan(0);

      expect(typeof encounter.summary).toBe("string");
      expect(encounter.summary.length).toBeGreaterThan(0);

      expect(typeof encounter.atmosphere).toBe("string");
      expect(encounter.atmosphere.length).toBeGreaterThan(0);

      expect(typeof encounter.enemyTrait).toBe("string");
      expect(encounter.enemyTrait.length).toBeGreaterThan(0);

      // Enum properties
      expect(["low", "medium", "high"]).toContain(encounter.enemyThreat);

      // Number properties
      expect(typeof encounter.entryFee).toBe("number");
      expect(encounter.entryFee).toBeGreaterThanOrEqual(0);

      expect(typeof encounter.rewardMin).toBe("number");
      expect(encounter.rewardMin).toBeGreaterThanOrEqual(0);

      expect(typeof encounter.rewardMax).toBe("number");
      expect(encounter.rewardMax).toBeGreaterThanOrEqual(encounter.rewardMin);

      expect(typeof encounter.enemyHp).toBe("number");
      expect(encounter.enemyHp).toBeGreaterThan(0);

      expect(typeof encounter.enemyAttackMin).toBe("number");
      expect(encounter.enemyAttackMin).toBeGreaterThanOrEqual(0);

      expect(typeof encounter.enemyAttackMax).toBe("number");
      expect(encounter.enemyAttackMax).toBeGreaterThanOrEqual(encounter.enemyAttackMin);
    });
  });
});
