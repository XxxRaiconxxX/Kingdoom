import { describe, it, expect } from 'vitest';
import { ACTIVE_EVENTS } from './events';

describe('ACTIVE_EVENTS', () => {
  it('should be an array', () => {
    expect(Array.isArray(ACTIVE_EVENTS)).toBe(true);
  });

  it('should contain at least one event', () => {
    expect(ACTIVE_EVENTS.length).toBeGreaterThan(0);
  });

  it('each event should have the required properties with correct types based on RealmEvent interface', () => {
    ACTIVE_EVENTS.forEach((event) => {
      // id is optional

      expect(event).toHaveProperty('title');
      expect(typeof event.title).toBe('string');
      expect(event.title.length).toBeGreaterThan(0);

      expect(event).toHaveProperty('description');
      expect(typeof event.description).toBe('string');
      expect(event.description.length).toBeGreaterThan(0);

      expect(event).toHaveProperty('longDescription');
      expect(typeof event.longDescription).toBe('string');
      expect(event.longDescription.length).toBeGreaterThan(0);

      expect(event).toHaveProperty('imageUrl');
      expect(typeof event.imageUrl).toBe('string');

      expect(event).toHaveProperty('startDate');
      expect(typeof event.startDate).toBe('string');
      expect(event.startDate.length).toBeGreaterThan(0);

      expect(event).toHaveProperty('endDate');
      expect(typeof event.endDate).toBe('string');
      expect(event.endDate.length).toBeGreaterThan(0);

      expect(event).toHaveProperty('status');
      expect(['in-production', 'active', 'finished']).toContain(event.status);

      expect(event).toHaveProperty('factions');
      expect(Array.isArray(event.factions)).toBe(true);
      expect(event.factions.length).toBeGreaterThan(0);
      event.factions.forEach(faction => expect(typeof faction).toBe('string'));

      expect(event).toHaveProperty('rewards');
      expect(typeof event.rewards).toBe('string');
      expect(event.rewards.length).toBeGreaterThan(0);

      expect(event).toHaveProperty('requirements');
      expect(typeof event.requirements).toBe('string');
      expect(event.requirements.length).toBeGreaterThan(0);
    });
  });

  it('no duplicate titles exist', () => {
      const titles = ACTIVE_EVENTS.map(event => event.title);
      const uniqueTitles = new Set(titles);
      expect(uniqueTitles.size).toBe(titles.length);
  });
});
