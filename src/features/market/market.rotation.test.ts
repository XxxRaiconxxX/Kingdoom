import { describe, it, expect } from 'vitest';
import { getMarketRotationState } from './market.rotation';
import type { MarketItem } from '../../types';

describe('getMarketRotationState', () => {
  const MARKET_ROTATION_WINDOW_MS = 5 * 60 * 60 * 1000;

  const mockItems: MarketItem[] = [
    {
      id: 'item-1',
      name: 'Common Potion',
      description: 'A simple potion.',
      ability: 'Heals 10 HP.',
      price: 10,
      rarity: 'common',
      imageUrl: 'potion.png',
      imageFit: 'contain',
      imagePosition: 'center',
      category: 'potions',
      stockStatus: 'in-stock',
      stockLimit: 10,
      stockSold: 0,
      featured: false,
    },
    {
      id: 'item-2',
      name: 'Rare Sword',
      description: 'A sharp sword.',
      ability: 'Deals 20 damage.',
      price: 100,
      rarity: 'rare',
      imageUrl: 'sword.png',
      imageFit: 'contain',
      imagePosition: 'center',
      category: 'swords',
      stockStatus: 'in-stock',
      stockLimit: 5,
      stockSold: 2,
      featured: false,
    },
    {
      id: 'item-3',
      name: 'Sold Out Armor',
      description: 'Sturdy armor.',
      ability: 'Reduces damage by 15.',
      price: 50,
      rarity: 'common',
      imageUrl: 'armor.png',
      imageFit: 'contain',
      imagePosition: 'center',
      category: 'armors',
      stockStatus: 'sold-out',
      stockLimit: 5,
      stockSold: 5,
      featured: false,
    },
    {
      id: 'item-4',
      name: 'Epic Staff',
      description: 'A magical staff.',
      ability: 'Casts fireball.',
      price: 500,
      rarity: 'epic',
      imageUrl: 'staff.png',
      imageFit: 'contain',
      imagePosition: 'center',
      category: 'others',
      stockStatus: 'in-stock',
      stockLimit: 0, // No limit
      stockSold: 100,
      featured: false,
    },
    {
      id: 'item-5',
      name: 'Legendary Shield',
      description: 'An ancient shield.',
      ability: 'Blocks all damage.',
      price: 1000,
      rarity: 'legendary',
      imageUrl: 'shield.png',
      imageFit: 'contain',
      imagePosition: 'center',
      category: 'armors',
      stockStatus: 'in-stock',
      stockLimit: 1,
      stockSold: 1, // Effectively sold out due to stockLimit <= stockSold
      featured: false,
    },
  ];

  it('should return a valid market rotation state with empty items', () => {
    const items: MarketItem[] = [];
    const now = 1000000;
    const state = getMarketRotationState(items, now);

    expect(state).toHaveProperty('items', []);
    expect(state).toHaveProperty('activeRarities', []);
    expect(state.windowId).toBe(Math.floor(now / MARKET_ROTATION_WINDOW_MS));
  });

  it('should calculate nextRefreshAt and nextRefreshLabel correctly', () => {
    // Let's pick a time exactly 1.5 hours before the end of the window
    const windowId = 10;
    const endOfWindow = (windowId + 1) * MARKET_ROTATION_WINDOW_MS;
    const oneHourAndHalfMs = 90 * 60 * 1000;
    const now = endOfWindow - oneHourAndHalfMs;

    const state = getMarketRotationState([], now);

    expect(state.windowId).toBe(windowId);
    expect(state.nextRefreshAt).toBe(endOfWindow);
    // 90 minutes remaining = 1h 30m
    expect(state.nextRefreshLabel).toBe('1h 30m');
  });

  it('should correctly format minutes if under 1 hour', () => {
    const windowId = 5;
    const endOfWindow = (windowId + 1) * MARKET_ROTATION_WINDOW_MS;
    const fortyFiveMinsMs = 45 * 60 * 1000;
    const now = endOfWindow - fortyFiveMinsMs;

    const state = getMarketRotationState([], now);
    expect(state.nextRefreshLabel).toBe('45m');
  });

  it('should correctly format exactly 0 minutes to at least 1m to avoid 0m UI', () => {
    const windowId = 5;
    const endOfWindow = (windowId + 1) * MARKET_ROTATION_WINDOW_MS;
    // We want to force remainingHours = 0 and remainingMinutes = 0
    // If we just use endOfWindow, windowId becomes 6 and remaining time is 5h!
    // Instead, we use endOfWindow - 1ms, which keeps us in the current window.
    // nextRefreshAt is endOfWindow. remainingMs = 1.
    // remainingHours = 0. remainingMinutes = Math.ceil(1 / 60000) = 1.

    // To literally get 0 remainingMinutes, we would need remainingMs = 0 without shifting the window.
    // But since the window shifts instantly when now === endOfWindow, remainingMs is NEVER 0.
    // The closest we can get is remainingMs = 1.
    // Let's test remainingMs = 1
    const now = endOfWindow - 1;

    const state = getMarketRotationState([], now);
    expect(state.nextRefreshLabel).toBe('1m');
  });

  it('should filter out sold-out items (by status or stock limits)', () => {
    const now = 0; // Fixed time for determinism
    const state = getMarketRotationState(mockItems, now);

    // item-3 is 'sold-out'
    // item-5 has stockSold >= stockLimit
    const selectedIds = state.items.map(i => i.id);

    expect(selectedIds).not.toContain('item-3');
    expect(selectedIds).not.toContain('item-5');

    // item-1, item-2, item-4 should potentially be selected
    // Note: rarity 'common' is always active (probability 1).
    expect(selectedIds).toContain('item-1');
  });

  it('should generate deterministic results for the same time window', () => {
    const now1 = 10000;
    const now2 = 20000; // Same window

    const state1 = getMarketRotationState(mockItems, now1);
    const state2 = getMarketRotationState(mockItems, now2);

    expect(state1.items.map(i => i.id)).toEqual(state2.items.map(i => i.id));
    expect(state1.activeRarities).toEqual(state2.activeRarities);
  });

  it('should use current date when no "now" parameter is passed', () => {
    // Cannot mock Date easily without polluting, but we can verify it doesn't throw and returns valid state
    const state = getMarketRotationState(mockItems);
    expect(state).toHaveProperty('windowId');
    expect(typeof state.windowId).toBe('number');
  });
});
