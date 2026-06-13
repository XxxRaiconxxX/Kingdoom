import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isNativeApp, getPlatformLabel } from '../platform';

describe('platform utils', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    // Reset window between tests to avoid pollution
    global.window = originalWindow;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isNativeApp', () => {
    it('returns false when window is undefined', () => {
      // @ts-ignore
      delete global.window;
      expect(isNativeApp()).toBe(false);
    });

    it('returns false when window is defined but no Capacitor', () => {
      // @ts-ignore
      global.window = {} as Window & typeof globalThis;
      expect(isNativeApp()).toBe(false);
    });

    it('returns false when Capacitor exists but no isNativePlatform method', () => {
      // @ts-ignore
      global.window = { Capacitor: {} } as any;
      expect(isNativeApp()).toBe(false);
    });

    it('returns the result of Capacitor.isNativePlatform()', () => {
      // @ts-ignore
      global.window = {
        Capacitor: {
          isNativePlatform: vi.fn().mockReturnValue(true),
        },
      } as any;
      expect(isNativeApp()).toBe(true);

      // @ts-ignore
      global.window.Capacitor.isNativePlatform = vi.fn().mockReturnValue(false);
      expect(isNativeApp()).toBe(false);
    });
  });

  describe('getPlatformLabel', () => {
    it('returns "web" when window is undefined', () => {
      // @ts-ignore
      delete global.window;
      expect(getPlatformLabel()).toBe('web');
    });

    it('returns "web" when window is defined but no Capacitor', () => {
      // @ts-ignore
      global.window = {} as Window & typeof globalThis;
      expect(getPlatformLabel()).toBe('web');
    });

    it('returns "web" when Capacitor exists but no getPlatform method', () => {
      // @ts-ignore
      global.window = { Capacitor: {} } as any;
      expect(getPlatformLabel()).toBe('web');
    });

    it('returns the result of Capacitor.getPlatform()', () => {
      // @ts-ignore
      global.window = {
        Capacitor: {
          getPlatform: vi.fn().mockReturnValue('ios'),
        },
      } as any;
      expect(getPlatformLabel()).toBe('ios');

      // @ts-ignore
      global.window.Capacitor.getPlatform = vi.fn().mockReturnValue('android');
      expect(getPlatformLabel()).toBe('android');
    });
  });
});
