import { describe, it, expect } from 'vitest';
import {
  getExperienceForNextLevel,
  getTotalExperienceForLevel,
  getLevelFromExperience,
} from './pveProgress';

describe('pveProgress utils', () => {
  describe('getExperienceForNextLevel', () => {
    it('returns correct experience for negative or zero levels (clamped to 2 in formula)', () => {
      // 40 + 25 * Math.max(2, level + 1)
      // level = -1 => 40 + 25 * max(2, 0) = 40 + 50 = 90
      // level = 0 => 40 + 25 * max(2, 1) = 40 + 50 = 90
      expect(getExperienceForNextLevel(-1)).toBe(90);
      expect(getExperienceForNextLevel(0)).toBe(90);
    });

    it('returns correct experience for level 1 (boundary)', () => {
      // level = 1 => 40 + 25 * max(2, 2) = 40 + 50 = 90
      expect(getExperienceForNextLevel(1)).toBe(90);
    });

    it('returns correct experience for level > 1', () => {
      // level = 2 => 40 + 25 * 3 = 115
      // level = 3 => 40 + 25 * 4 = 140
      expect(getExperienceForNextLevel(2)).toBe(115);
      expect(getExperienceForNextLevel(3)).toBe(140);
    });
  });

  describe('getTotalExperienceForLevel', () => {
    it('returns 0 for levels <= 1', () => {
      expect(getTotalExperienceForLevel(-10)).toBe(0);
      expect(getTotalExperienceForLevel(0)).toBe(0);
      expect(getTotalExperienceForLevel(1)).toBe(0);
    });

    it('returns sum of experience for levels > 1', () => {
      // level = 2 => targetLevel=2 => 40 + 25*2 = 90
      expect(getTotalExperienceForLevel(2)).toBe(90);

      // level = 3 => targetLevel=2 (90) + targetLevel=3 (115) = 205
      expect(getTotalExperienceForLevel(3)).toBe(205);

      // level = 4 => 205 + targetLevel=4 (140) = 345
      expect(getTotalExperienceForLevel(4)).toBe(345);
    });
  });

  describe('getLevelFromExperience', () => {
    it('returns level 1 for 0 or negative experience', () => {
      expect(getLevelFromExperience(-50)).toBe(1);
      expect(getLevelFromExperience(0)).toBe(1);
    });

    it('returns level 1 for experience just below level 2 threshold (90)', () => {
      expect(getLevelFromExperience(89)).toBe(1);
    });

    it('returns level 2 exactly at or above level 2 threshold (90) and below level 3 threshold (205)', () => {
      expect(getLevelFromExperience(90)).toBe(2);
      expect(getLevelFromExperience(150)).toBe(2);
      expect(getLevelFromExperience(204)).toBe(2);
    });

    it('returns level 3 exactly at or above level 3 threshold (205)', () => {
      expect(getLevelFromExperience(205)).toBe(3);
      expect(getLevelFromExperience(300)).toBe(3);
    });
  });
});
