import { describe, it, expect } from "vitest";
import { WORLD_STATUS, DEMOGRAPHIC_BLOCS, DIPLOMATIC_TENSIONS, COMMON_THREATS } from "../world";

describe("world data", () => {
  describe("WORLD_STATUS", () => {
    it("should have a valid title and description", () => {
      expect(WORLD_STATUS).toBeDefined();
      expect(typeof WORLD_STATUS.title).toBe("string");
      expect(WORLD_STATUS.title.length).toBeGreaterThan(0);
      expect(typeof WORLD_STATUS.description).toBe("string");
      expect(WORLD_STATUS.description.length).toBeGreaterThan(0);
    });
  });

  describe("DEMOGRAPHIC_BLOCS", () => {
    it("should be an array of demographic blocs", () => {
      expect(Array.isArray(DEMOGRAPHIC_BLOCS)).toBe(true);
      expect(DEMOGRAPHIC_BLOCS.length).toBeGreaterThan(0);
    });

    it("should contain correctly structured demographic blocs", () => {
      DEMOGRAPHIC_BLOCS.forEach(bloc => {
        expect(typeof bloc.realm).toBe("string");
        expect(typeof bloc.epithet).toBe("string");
        expect(Array.isArray(bloc.groups)).toBe(true);
        expect(bloc.groups.length).toBeGreaterThan(0);

        bloc.groups.forEach(group => {
          expect(typeof group.title).toBe("string");
          expect(Array.isArray(group.races)).toBe(true);
          expect(group.races.length).toBeGreaterThan(0);

          group.races.forEach(race => {
            expect(typeof race).toBe("string");
            expect(race.length).toBeGreaterThan(0);
          });
        });
      });
    });
  });

  describe("DIPLOMATIC_TENSIONS", () => {
    it("should be an array of geopolitical notes", () => {
      expect(Array.isArray(DIPLOMATIC_TENSIONS)).toBe(true);
      expect(DIPLOMATIC_TENSIONS.length).toBeGreaterThan(0);
    });

    it("should contain correctly structured diplomatic tensions", () => {
      DIPLOMATIC_TENSIONS.forEach(note => {
        expect(typeof note.title).toBe("string");
        expect(typeof note.description).toBe("string");
      });
    });
  });

  describe("COMMON_THREATS", () => {
    it("should be an array of geopolitical notes", () => {
      expect(Array.isArray(COMMON_THREATS)).toBe(true);
      expect(COMMON_THREATS.length).toBeGreaterThan(0);
    });

    it("should contain correctly structured common threats", () => {
      COMMON_THREATS.forEach(note => {
        expect(typeof note.title).toBe("string");
        expect(typeof note.description).toBe("string");
      });
    });
  });
});
