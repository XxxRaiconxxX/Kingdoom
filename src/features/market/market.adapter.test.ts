import { describe, it, expect } from 'vitest';
import { slugifyMarketItem, mapMarketItemRow, buildMarketItemPayload } from './market.adapter';
import type { MarketItemRow, AdminMarketItemInput } from './market.types';
import type { MarketItem } from '../../types';

describe('slugifyMarketItem', () => {
  it('should format a potion category correctly', () => {
    expect(slugifyMarketItem('Health Potion', 'potions')).toBe('potion-health-potion');
  });

  it('should format an armor category correctly', () => {
    expect(slugifyMarketItem('Chain Mail', 'armors')).toBe('armor-chain-mail');
  });

  it('should format a sword category correctly', () => {
    expect(slugifyMarketItem('Excalibur', 'swords')).toBe('sword-excalibur');
  });

  it('should format an other category correctly', () => {
    expect(slugifyMarketItem('Magic Ring', 'others')).toBe('other-magic-ring');
  });

  it('should handle special characters and accents', () => {
    expect(slugifyMarketItem('Anillo Mágico de la Perdición!', 'others')).toBe('other-anillo-magico-de-la-perdicion');
  });

  it('should handle uppercase letters', () => {
    expect(slugifyMarketItem('HELMET OF DOOM', 'armors')).toBe('armor-helmet-of-doom');
  });

  it('should handle multiple spaces', () => {
    expect(slugifyMarketItem('Super   Strong    Sword', 'swords')).toBe('sword-super-strong-sword');
  });

  it('should trim leading and trailing spaces', () => {
    expect(slugifyMarketItem('  Axe  ', 'swords')).toBe('sword-axe');
  });
});

describe('mapMarketItemRow', () => {
  it('should map a row with all values correctly', () => {
    const row: MarketItemRow = {
      id: '1',
      name: 'Test Item',
      description: 'A test item',
      ability: 'Test ability',
      price: 100,
      rarity: 'common',
      image_url: 'test.jpg',
      image_fit: 'contain',
      image_position: 'center',
      category: 'swords',
      stock_status: 'available',
      stock_limit: 10,
      stock_sold: 5,
      featured: true,
    };

    const expected: MarketItem = {
      id: '1',
      name: 'Test Item',
      description: 'A test item',
      ability: 'Test ability',
      price: 100,
      rarity: 'common',
      imageUrl: 'test.jpg',
      imageFit: 'contain',
      imagePosition: 'center',
      category: 'swords',
      stockStatus: 'available',
      stockLimit: 10,
      stockSold: 5,
      featured: true,
    };

    expect(mapMarketItemRow(row)).toEqual(expected);
  });

  it('should map a row with null values to undefined', () => {
    const row: MarketItemRow = {
      id: '2',
      name: 'Test Item 2',
      description: 'Another test item',
      ability: null,
      price: 50,
      rarity: 'rare',
      image_url: 'test2.jpg',
      image_fit: null,
      image_position: null,
      category: 'potions',
      stock_status: 'available',
      stock_limit: null,
      stock_sold: null,
      featured: false,
    };

    const expected: MarketItem = {
      id: '2',
      name: 'Test Item 2',
      description: 'Another test item',
      ability: undefined,
      price: 50,
      rarity: 'rare',
      imageUrl: 'test2.jpg',
      imageFit: undefined,
      imagePosition: undefined,
      category: 'potions',
      stockStatus: 'available',
      stockLimit: undefined,
      stockSold: undefined,
      featured: false,
    };

    expect(mapMarketItemRow(row)).toEqual(expected);
  });
});

describe('buildMarketItemPayload', () => {
  it('should build payload correctly and trim strings', () => {
    const input: AdminMarketItemInput = {
      id: '1',
      name: '  Test Item  ',
      description: '  Test description  ',
      ability: '  Test ability  ',
      price: 100,
      rarity: 'epic',
      imageUrl: '  test.jpg  ',
      imageFit: 'cover',
      imagePosition: '  center top  ',
      category: 'armors',
      stockStatus: 'limited',
      stockLimit: 5,
      stockSold: 2,
      featured: true,
    };

    const expected = {
      id: '1',
      name: 'Test Item',
      description: 'Test description',
      ability: 'Test ability',
      price: 100,
      rarity: 'epic',
      image_url: 'test.jpg',
      image_fit: 'cover',
      image_position: 'center top',
      category: 'armors',
      stock_status: 'limited',
      stock_limit: 5,
      stock_sold: 2,
      featured: true,
    };

    expect(buildMarketItemPayload(input)).toEqual(expected);
  });

  it('should map empty or null-ish strings to null', () => {
    const input: AdminMarketItemInput = {
      id: '2',
      name: 'Test',
      description: 'Desc',
      ability: '   ',
      price: 10,
      rarity: 'common',
      imageUrl: 'img.jpg',
      imageFit: '',
      imagePosition: '   ',
      category: 'others',
      stockStatus: 'available',
      stockLimit: 0,
      stockSold: 0,
      featured: false,
    };

    const expected = {
      id: '2',
      name: 'Test',
      description: 'Desc',
      ability: null,
      price: 10,
      rarity: 'common',
      image_url: 'img.jpg',
      image_fit: null,
      image_position: null,
      category: 'others',
      stock_status: 'available',
      stock_limit: 0,
      stock_sold: 0,
      featured: false,
    };

    expect(buildMarketItemPayload(input)).toEqual(expected);
  });

  it('should floor and floor to 0 negative numeric values', () => {
    const input: AdminMarketItemInput = {
      id: '3',
      name: 'Test',
      description: 'Desc',
      ability: '',
      price: 10,
      rarity: 'common',
      imageUrl: 'img.jpg',
      imageFit: '',
      imagePosition: '',
      category: 'others',
      stockStatus: 'available',
      stockLimit: -5,
      stockSold: 2.7,
      featured: false,
    };

    const expected = {
      id: '3',
      name: 'Test',
      description: 'Desc',
      ability: null,
      price: 10,
      rarity: 'common',
      image_url: 'img.jpg',
      image_fit: null,
      image_position: null,
      category: 'others',
      stock_status: 'available',
      stock_limit: 0,
      stock_sold: 2,
      featured: false,
    };

    expect(buildMarketItemPayload(input)).toEqual(expected);
  });
});

  it('should format an unknown category correctly as fallback', () => {
    // We cast to MarketCategoryId to test the fallback branch for line 12
    expect(slugifyMarketItem('Unknown Item', 'unknown' as any)).toBe('item-unknown-item');
  });
