import { describe, it, expect } from 'vitest';
import { RANKING_PLAYERS } from './ranking';

describe('RANKING_PLAYERS', () => {
  it('should be defined and be an array', () => {
    expect(RANKING_PLAYERS).toBeDefined();
    expect(Array.isArray(RANKING_PLAYERS)).toBe(true);
  });

  it('should contain exactly 5 players', () => {
    expect(RANKING_PLAYERS.length).toBe(5);
  });

  it('should have correctly structured player objects', () => {
    RANKING_PLAYERS.forEach(player => {
      expect(player).toHaveProperty('id');
      expect(typeof player.id).toBe('string');

      expect(player).toHaveProperty('name');
      expect(typeof player.name).toBe('string');

      expect(player).toHaveProperty('faction');
      expect(typeof player.faction).toBe('string');

      expect(player).toHaveProperty('activityPoints');
      expect(typeof player.activityPoints).toBe('number');
      expect(player.activityPoints).toBeGreaterThanOrEqual(0);

      expect(player).toHaveProperty('missionsCompleted');
      expect(typeof player.missionsCompleted).toBe('number');
      expect(player.missionsCompleted).toBeGreaterThanOrEqual(0);

      expect(player).toHaveProperty('eventsJoined');
      expect(typeof player.eventsJoined).toBe('number');
      expect(player.eventsJoined).toBeGreaterThanOrEqual(0);

      expect(player).toHaveProperty('streakDays');
      expect(typeof player.streakDays).toBe('number');
      expect(player.streakDays).toBeGreaterThanOrEqual(0);

      expect(player).toHaveProperty('status');
      expect(['alive', 'dead']).toContain(player.status);
    });
  });

  it('should be sorted by activityPoints in descending order', () => {
    const points = RANKING_PLAYERS.map(p => p.activityPoints);
    const sortedPoints = [...points].sort((a, b) => b - a);
    expect(points).toEqual(sortedPoints);
  });

  it('should contain specific known top player Aldric Noctis', () => {
    const topPlayer = RANKING_PLAYERS[0];
    expect(topPlayer.name).toBe('Aldric Noctis');
    expect(topPlayer.id).toBe('aldric-noctis');
    expect(topPlayer.faction).toBe('Cuervos del Norte');
    expect(topPlayer.status).toBe('alive');
  });

  it('should correctly mark Thorne Blackwall as dead', () => {
    const thorne = RANKING_PLAYERS.find(p => p.id === 'thorne-blackwall');
    expect(thorne).toBeDefined();
    expect(thorne?.status).toBe('dead');
  });

  it('should have unique IDs for all players', () => {
    const ids = RANKING_PLAYERS.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });
});
