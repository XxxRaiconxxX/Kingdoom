import { describe, it, expect } from 'vitest';
import { getOptimizedImageUrl } from './imageUtils';

describe('getOptimizedImageUrl', () => {
  it('returns an empty string if url is empty', () => {
    expect(getOptimizedImageUrl('')).toBe('');
  });

  it('transforms supabase public storage URLs correctly', () => {
    const url = 'https://project.supabase.co/storage/v1/object/public/bucket/image.png';
    const result = getOptimizedImageUrl(url, 800, 90);
    expect(result).toBe('https://project.supabase.co/storage/v1/render/image/public/bucket/image.png?width=800&quality=90&format=webp');
  });

  it('uses default width and quality if not provided', () => {
    const url = 'https://project.supabase.co/storage/v1/object/public/bucket/image.png';
    const result = getOptimizedImageUrl(url);
    expect(result).toBe('https://project.supabase.co/storage/v1/render/image/public/bucket/image.png?width=400&quality=80&format=webp');
  });

  it('returns original url if it is not a supabase url', () => {
    const url = 'https://example.com/image.png';
    expect(getOptimizedImageUrl(url)).toBe(url);
  });

  it('returns original url if it is a supabase url but not a public object', () => {
    const url = 'https://project.supabase.co/storage/v1/object/private/bucket/image.png';
    expect(getOptimizedImageUrl(url)).toBe(url);
  });

  it('returns original string if it is an invalid url (error path)', () => {
    const invalidUrl = 'not-a-valid-url';
    expect(getOptimizedImageUrl(invalidUrl)).toBe(invalidUrl);
  });
});
