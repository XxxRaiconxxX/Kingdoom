import { describe, it, expect } from "vitest";
import { LORE_RULES, REALM_FACTIONS, FACTION_DOSSIERS } from "./lore";

describe("lore.ts data exports", () => {
  describe("LORE_RULES", () => {
    it("should export an array of lore rules", () => {
      expect(Array.isArray(LORE_RULES)).toBe(true);
      expect(LORE_RULES.length).toBeGreaterThan(0);
    });

    it("each rule should have required properties", () => {
      LORE_RULES.forEach((rule) => {
        expect(rule).toHaveProperty("title");
        expect(typeof rule.title).toBe("string");
        expect(rule.title.length).toBeGreaterThan(0);

        expect(rule).toHaveProperty("description");
        expect(typeof rule.description).toBe("string");
        expect(rule.description.length).toBeGreaterThan(0);

        expect(rule).toHaveProperty("icon");
      });
    });
  });

  describe("REALM_FACTIONS", () => {
    it("should export an array of realm factions", () => {
      expect(Array.isArray(REALM_FACTIONS)).toBe(true);
      expect(REALM_FACTIONS.length).toBeGreaterThan(0);
    });

    it("each faction should have required properties", () => {
      REALM_FACTIONS.forEach((faction) => {
        expect(faction).toHaveProperty("name");
        expect(typeof faction.name).toBe("string");
        expect(faction.name.length).toBeGreaterThan(0);

        expect(faction).toHaveProperty("motto");
        expect(typeof faction.motto).toBe("string");

        expect(faction).toHaveProperty("description");
        expect(typeof faction.description).toBe("string");
      });
    });
  });

  describe("FACTION_DOSSIERS", () => {
    it("should export an array of faction dossiers", () => {
      expect(Array.isArray(FACTION_DOSSIERS)).toBe(true);
      expect(FACTION_DOSSIERS.length).toBeGreaterThan(0);
    });

    it("each dossier should have required properties", () => {
      FACTION_DOSSIERS.forEach((dossier) => {
        expect(dossier).toHaveProperty("id");
        expect(typeof dossier.id).toBe("string");
        expect(dossier.id.length).toBeGreaterThan(0);

        expect(dossier).toHaveProperty("name");
        expect(typeof dossier.name).toBe("string");

        expect(dossier).toHaveProperty("alignedRealm");
        expect(typeof dossier.alignedRealm).toBe("string");

        expect(dossier).toHaveProperty("history");
        expect(typeof dossier.history).toBe("string");

        expect(dossier).toHaveProperty("specialization");
        expect(typeof dossier.specialization).toBe("string");

        expect(dossier).toHaveProperty("tactics");
        expect(typeof dossier.tactics).toBe("string");

        expect(dossier).toHaveProperty("equipment");
        expect(typeof dossier.equipment).toBe("string");

        expect(dossier).toHaveProperty("headquarters");
        expect(typeof dossier.headquarters).toBe("string");

        expect(dossier).toHaveProperty("relations");
        expect(Array.isArray(dossier.relations)).toBe(true);
        dossier.relations.forEach((relation) => {
            expect(relation).toHaveProperty("realm");
            expect(typeof relation.realm).toBe("string");
            expect(relation).toHaveProperty("description");
            expect(typeof relation.description).toBe("string");
        });

        expect(dossier).toHaveProperty("playerDetails");
        expect(typeof dossier.playerDetails).toBe("string");

        expect(dossier).toHaveProperty("bonuses");
        expect(Array.isArray(dossier.bonuses)).toBe(true);
      });
    });

    it("each dossier id should be unique", () => {
        const ids = FACTION_DOSSIERS.map(d => d.id);
        const uniqueIds = new Set(ids);
        expect(ids.length).toBe(uniqueIds.size);
    });
  });
});
