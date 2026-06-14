import { describe, it, expect } from 'vitest';
import { MARKET_CATEGORIES } from '../market';
import { Sparkles, Shield, Sword, Gem } from "lucide-react";

describe('MARKET_CATEGORIES', () => {
  it('should be an array of categories', () => {
    expect(Array.isArray(MARKET_CATEGORIES)).toBe(true);
    expect(MARKET_CATEGORIES.length).toBeGreaterThan(0);
  });

  it('should have required properties for each category', () => {
    MARKET_CATEGORIES.forEach(category => {
      expect(category).toHaveProperty('id');
      expect(typeof category.id).toBe('string');
      expect(category).toHaveProperty('title');
      expect(typeof category.title).toBe('string');
      expect(category).toHaveProperty('subtitle');
      expect(typeof category.subtitle).toBe('string');
      expect(category).toHaveProperty('icon');
    });
  });

  it('should have correct predefined category types', () => {
    const validIds = ["potions", "armors", "swords", "others"];
    MARKET_CATEGORIES.forEach(category => {
      expect(validIds).toContain(category.id);
    });
  });

  it('should have unique ids', () => {
    const ids = MARKET_CATEGORIES.map(category => category.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should use correct lucide-react icons', () => {
    // Map the expected icon type for each ID based on the original data
    const expectedIcons: Record<string, any> = {
      potions: Sparkles,
      armors: Shield,
      swords: Sword,
      others: Gem
    };

    MARKET_CATEGORIES.forEach(category => {
      expect(category.icon).toBe(expectedIcons[category.id]);
    });
  });
});
