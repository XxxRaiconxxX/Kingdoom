import { describe, it, expect } from 'vitest';
import {
  COMMUNITY_APP_DOWNLOAD_FALLBACK_URL,
  COMMUNITY_APP_VERSION,
  COMMUNITY_APP_UPDATED_AT,
  HOME_STATS,
  KINGDOM_STATUS,
  KINGDOM_ANNOUNCEMENTS,
  JOIN_STEPS,
} from '../home';
import { Crown, Dice5, Flame, Users } from 'lucide-react';

describe('Home Data', () => {
  describe('COMMUNITY_APP_DOWNLOAD_FALLBACK_URL', () => {
    it('should be a valid HTTPS URL', () => {
      expect(typeof COMMUNITY_APP_DOWNLOAD_FALLBACK_URL).toBe('string');
      expect(COMMUNITY_APP_DOWNLOAD_FALLBACK_URL.startsWith('https://')).toBe(true);
      expect(COMMUNITY_APP_DOWNLOAD_FALLBACK_URL).toContain('app-debug.apk');
    });
  });

  describe('COMMUNITY_APP_VERSION and UPDATED_AT', () => {
    it('should have correct version format', () => {
      expect(COMMUNITY_APP_VERSION).toMatch(/^v\d+\.\d+\.\d+$/);
    });

    it('should have correct date format', () => {
      expect(COMMUNITY_APP_UPDATED_AT).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });
  });

  describe('HOME_STATS', () => {
    it('should have 3 stats with correct structure', () => {
      expect(HOME_STATS.length).toBe(3);
      expect(HOME_STATS[0]).toEqual({ value: "En progreso", label: "Personajes", icon: Users });
      expect(HOME_STATS[1]).toEqual({ value: "4", label: "Facciones", icon: Flame });
      expect(HOME_STATS[2]).toEqual({ value: "24/7", label: "Eventos", icon: Dice5 });
    });
  });

  describe('KINGDOM_STATUS', () => {
    it('should have required properties', () => {
      expect(KINGDOM_STATUS).toHaveProperty('eyebrow');
      expect(KINGDOM_STATUS).toHaveProperty('title');
      expect(KINGDOM_STATUS).toHaveProperty('description');
      expect(KINGDOM_STATUS.icon).toBe(Crown);
    });
  });

  describe('KINGDOM_ANNOUNCEMENTS', () => {
    it('should have announcements with title and content', () => {
      expect(KINGDOM_ANNOUNCEMENTS.length).toBeGreaterThan(0);
      KINGDOM_ANNOUNCEMENTS.forEach(announcement => {
        expect(announcement).toHaveProperty('title');
        expect(typeof announcement.title).toBe('string');
        expect(announcement).toHaveProperty('content');
        expect(typeof announcement.content).toBe('string');
      });
    });
  });

  describe('JOIN_STEPS', () => {
    it('should have steps with title and description', () => {
      expect(JOIN_STEPS.length).toBeGreaterThan(0);
      JOIN_STEPS.forEach(step => {
        expect(step).toHaveProperty('title');
        expect(typeof step.title).toBe('string');
        expect(step).toHaveProperty('description');
        expect(typeof step.description).toBe('string');
      });
    });
  });
});
