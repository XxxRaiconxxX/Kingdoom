import { describe, it, expect } from 'vitest';
import { GRIMOIRE_DATA } from './grimorio';
import { GrimoireCategory, MagicStyle, AbilityLevel } from '../types';

describe('GRIMOIRE_DATA', () => {
  it('should be an array of GrimoireCategory', () => {
    expect(Array.isArray(GRIMOIRE_DATA)).toBe(true);
    expect(GRIMOIRE_DATA.length).toBeGreaterThan(0);
  });

  it('each category should have the correct structure', () => {
    GRIMOIRE_DATA.forEach((category) => {
      expect(category).toHaveProperty('id');
      expect(typeof category.id).toBe('string');
      expect(category.id.length).toBeGreaterThan(0);

      expect(category).toHaveProperty('title');
      expect(typeof category.title).toBe('string');
      expect(category.title.length).toBeGreaterThan(0);

      expect(category).toHaveProperty('styles');
      expect(Array.isArray(category.styles)).toBe(true);
      expect(category.styles.length).toBeGreaterThan(0);
    });
  });

  it('each style should have the correct structure', () => {
    GRIMOIRE_DATA.forEach((category) => {
      category.styles.forEach((style) => {
        expect(style).toHaveProperty('id');
        expect(typeof style.id).toBe('string');
        expect(style.id.length).toBeGreaterThan(0);

        expect(style).toHaveProperty('title');
        expect(typeof style.title).toBe('string');
        expect(style.title.length).toBeGreaterThan(0);

        expect(style).toHaveProperty('description');
        expect(typeof style.description).toBe('string');

        expect(style).toHaveProperty('levels');
        expect(typeof style.levels).toBe('object');
        expect(style.levels).not.toBeNull();
      });
    });
  });

  it('each ability level should have the correct structure', () => {
    GRIMOIRE_DATA.forEach((category) => {
      category.styles.forEach((style) => {
        Object.keys(style.levels).forEach((levelKey) => {
          const levelNum = parseInt(levelKey, 10);
          expect(isNaN(levelNum)).toBe(false);
          expect(levelNum).toBeGreaterThan(0);

          const abilities = style.levels[levelNum];
          expect(Array.isArray(abilities)).toBe(true);

          abilities.forEach((ability) => {
            expect(ability).toHaveProperty('level');
            expect(typeof ability.level).toBe('number');
            expect(ability.level).toBe(levelNum);

            expect(ability).toHaveProperty('name');
            expect(typeof ability.name).toBe('string');
            expect(ability.name.length).toBeGreaterThan(0);

            expect(ability).toHaveProperty('effect');
            expect(typeof ability.effect).toBe('string');

            expect(ability).toHaveProperty('cd');
            expect(typeof ability.cd).toBe('string');

            expect(ability).toHaveProperty('limit');
            expect(typeof ability.limit).toBe('string');

            expect(ability).toHaveProperty('antiManoNegra');
            expect(typeof ability.antiManoNegra).toBe('string');
          });
        });
      });
    });
  });

  it('should have unique ids for categories', () => {
    const ids = new Set<string>();
    GRIMOIRE_DATA.forEach((category) => {
      expect(ids.has(category.id)).toBe(false);
      ids.add(category.id);
    });
  });

  it('should have unique ids for styles within a category', () => {
    GRIMOIRE_DATA.forEach((category) => {
      const ids = new Set<string>();
      category.styles.forEach((style) => {
        expect(ids.has(style.id)).toBe(false);
        ids.add(style.id);
      });
    });
  });
});
