import { describe, it, expect } from "vitest";
import { ADMIN_WEEKLY_TEMPLATES } from "./adminTemplates";

describe("ADMIN_WEEKLY_TEMPLATES", () => {
  it("should be defined and be an array", () => {
    expect(ADMIN_WEEKLY_TEMPLATES).toBeDefined();
    expect(Array.isArray(ADMIN_WEEKLY_TEMPLATES)).toBe(true);
    expect(ADMIN_WEEKLY_TEMPLATES.length).toBeGreaterThan(0);
  });

  it("each template should have the required properties", () => {
    ADMIN_WEEKLY_TEMPLATES.forEach((template) => {
      expect(template).toHaveProperty("id");
      expect(typeof template.id).toBe("string");

      expect(template).toHaveProperty("title");
      expect(typeof template.title).toBe("string");

      expect(template).toHaveProperty("description");
      expect(typeof template.description).toBe("string");

      expect(template).toHaveProperty("scoring");
      expect(Array.isArray(template.scoring)).toBe(true);
    });
  });

  it("each scoring item should have a valid label and points", () => {
    ADMIN_WEEKLY_TEMPLATES.forEach((template) => {
      template.scoring.forEach((score) => {
        expect(score).toHaveProperty("label");
        expect(typeof score.label).toBe("string");

        expect(score).toHaveProperty("points");
        expect(typeof score.points).toBe("number");
        expect(score.points).toBeGreaterThan(0);
      });
    });
  });

  it("should contain specific known templates", () => {
    const ids = ADMIN_WEEKLY_TEMPLATES.map(t => t.id);
    expect(ids).toContain("standard-week");
    expect(ids).toContain("war-week");
  });

  it("should have unique IDs for all templates", () => {
    const ids = ADMIN_WEEKLY_TEMPLATES.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
