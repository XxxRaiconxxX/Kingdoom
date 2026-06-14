import { describe, it, expect } from 'vitest';
import { createEmptyExchangeState } from './realmExchange.storage';

describe('createEmptyExchangeState', () => {
  it('should return an object with empty positions and predictions arrays', () => {
    const state = createEmptyExchangeState();
    expect(state).toEqual({
      positions: [],
      predictions: [],
    });
  });

  it('should return a new object reference each time it is called to prevent state mutation leaks', () => {
    const state1 = createEmptyExchangeState();
    const state2 = createEmptyExchangeState();

    // The objects should have the same structure
    expect(state1).toEqual(state2);
    // But they must be different instances
    expect(state1).not.toBe(state2);

    // The arrays inside should also be different instances
    expect(state1.positions).not.toBe(state2.positions);
    expect(state1.predictions).not.toBe(state2.predictions);
  });
});
