import { describe, it, expect } from 'vitest';
import { getOptimizedImageUrl } from '../imageUtils';

describe('getOptimizedImageUrl', () => {
  it('should return original URL if empty', () => {
    expect(getOptimizedImageUrl('')).toBe('');
  });

  it('should optimize Supabase public storage URLs', () => {
    const url = 'https://example.supabase.co/storage/v1/object/public/bucket/image.png';
    const optimized = getOptimizedImageUrl(url, 500, 90);

    expect(optimized).toContain('/render/image/public/');
    expect(optimized).not.toContain('/object/public/');

    const parsedUrl = new URL(optimized);
    expect(parsedUrl.searchParams.get('width')).toBe('500');
    expect(parsedUrl.searchParams.get('quality')).toBe('90');
    expect(parsedUrl.searchParams.get('format')).toBe('webp');
  });

  it('should use default width and quality if not provided', () => {
    const url = 'https://example.supabase.co/storage/v1/object/public/bucket/image.png';
    const optimized = getOptimizedImageUrl(url);

    const parsedUrl = new URL(optimized);
    expect(parsedUrl.searchParams.get('width')).toBe('400');
    expect(parsedUrl.searchParams.get('quality')).toBe('80');
  });

  it('should not modify non-Supabase URLs', () => {
    const url = 'https://example.com/image.png';
    expect(getOptimizedImageUrl(url)).toBe(url);
  });

  it('should not modify Supabase URLs that are not public object storage', () => {
    const url = 'https://example.supabase.co/storage/v1/object/authenticated/bucket/image.png';
    expect(getOptimizedImageUrl(url)).toBe(url);
  });

  it('should handle invalid URLs gracefully', () => {
    const invalidUrl = 'not-a-valid-url';
    expect(getOptimizedImageUrl(invalidUrl)).toBe(invalidUrl);
  });
});
