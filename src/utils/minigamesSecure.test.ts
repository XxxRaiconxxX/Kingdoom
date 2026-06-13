import { describe, it, expect } from 'vitest';
import { getCrashGrowthMultiplier } from './minigamesSecure';

describe('getCrashGrowthMultiplier', () => {
  it('should return 1.00 for 0 elapsed seconds', () => {
    expect(getCrashGrowthMultiplier(0)).toBe(1.00);
  });

  it('should return 1.00 for negative elapsed seconds (cap at 0)', () => {
    expect(getCrashGrowthMultiplier(-1)).toBe(1.00);
    expect(getCrashGrowthMultiplier(-100)).toBe(1.00);
  });

  it('should correctly calculate the multiplier for positive elapsed seconds', () => {
    // Math.exp(1 * 0.17).toFixed(2) === "1.19"
    expect(getCrashGrowthMultiplier(1)).toBe(1.19);

    // Math.exp(5 * 0.17).toFixed(2) === "2.34"
    expect(getCrashGrowthMultiplier(5)).toBe(2.34);

    // Math.exp(10 * 0.17).toFixed(2) === "5.47"
    expect(getCrashGrowthMultiplier(10)).toBe(5.47);
  });
});
