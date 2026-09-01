import { describe, it, expect } from 'vitest';
import { getScratchSeed } from './scratchUtils';

describe('getScratchSeed', () => {
  it('should return a valid number between 0 and 1', () => {
    const seed = getScratchSeed('test-string');
    expect(seed).toBeGreaterThan(0);
    expect(seed).toBeLessThan(1);
  });

  it('should be deterministic (return same value for same string)', () => {
    const seed1 = getScratchSeed('hello world');
    const seed2 = getScratchSeed('hello world');
    expect(seed1).toBe(seed2);
  });

  it('should return different values for different strings', () => {
    const seed1 = getScratchSeed('hello world 1');
    const seed2 = getScratchSeed('hello world 2');
    expect(seed1).not.toBe(seed2);
  });

  it('should handle empty string', () => {
    const seed = getScratchSeed('');
    expect(seed).toBeGreaterThan(0);
    expect(seed).toBeLessThan(1);
  });

  it('should return known output for known input', () => {
      const seed = getScratchSeed('2023-10-15');
      expect(typeof seed).toBe('number');
  });
});
