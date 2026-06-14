import { describe, it, expect } from 'vitest';
import { FALLBACK_MISSIONS } from './missions';

describe('FALLBACK_MISSIONS', () => {
  it('should not be empty', () => {
    expect(FALLBACK_MISSIONS).toBeDefined();
    expect(Array.isArray(FALLBACK_MISSIONS)).toBe(true);
    expect(FALLBACK_MISSIONS.length).toBeGreaterThan(0);
  });

  it('should contain valid missions', () => {
    FALLBACK_MISSIONS.forEach(mission => {
      expect(mission).toHaveProperty('id');
      expect(mission).toHaveProperty('title');
      expect(mission).toHaveProperty('description');
      expect(mission).toHaveProperty('instructions');
      expect(mission).toHaveProperty('rewardGold');
      expect(mission).toHaveProperty('maxParticipants');
      expect(mission).toHaveProperty('difficulty');
      expect(mission).toHaveProperty('type');
      expect(mission).toHaveProperty('status');
      expect(mission).toHaveProperty('visible');
    });
  });

  it('should have correct data types and constraints', () => {
    FALLBACK_MISSIONS.forEach(mission => {
      expect(typeof mission.id).toBe('string');
      expect(typeof mission.title).toBe('string');
      expect(typeof mission.description).toBe('string');
      expect(typeof mission.instructions).toBe('string');

      expect(typeof mission.rewardGold).toBe('number');
      expect(mission.rewardGold).toBeGreaterThan(0);

      expect(typeof mission.maxParticipants).toBe('number');
      expect(mission.maxParticipants).toBeGreaterThanOrEqual(1);

      expect(['easy', 'medium', 'hard', 'elite']).toContain(mission.difficulty);
      expect(['story', 'hunt', 'escort', 'investigation', 'event']).toContain(mission.type);

      expect(mission.status).toBe('available');
      expect(typeof mission.visible).toBe('boolean');
    });
  });
});
