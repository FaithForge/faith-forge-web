import { describe, it, expect } from 'vitest';
import { formatDateOnly, toDateOnlyInputValue, isDateToday } from './date';

describe('date utils', () => {
  describe('toDateOnlyInputValue', () => {
    it('returns empty string for null, undefined, or empty values', () => {
      expect(toDateOnlyInputValue(null)).toBe('');
      expect(toDateOnlyInputValue(undefined)).toBe('');
      expect(toDateOnlyInputValue('')).toBe('');
    });

    it('extracts YYYY-MM-DD from ISO string directly without timezone offset shifts', () => {
      expect(toDateOnlyInputValue('2024-05-18T15:30:00.000Z')).toBe('2024-05-18');
      expect(toDateOnlyInputValue('2024-12-01')).toBe('2024-12-01');
    });
  });

  describe('formatDateOnly', () => {
    it('formats date to Spanish locale without shifting day', () => {
      const formatted = formatDateOnly('2024-05-18', 'D [de] MMMM [de] YYYY');
      expect(formatted.toLowerCase()).toBe('18 de mayo de 2024');
    });

    it('returns empty string for invalid date', () => {
      expect(formatDateOnly('invalid-date')).toBe('');
      expect(formatDateOnly(null)).toBe('');
    });
  });

  describe('isDateToday', () => {
    it('returns false for null or invalid date', () => {
      expect(isDateToday(null)).toBe(false);
      expect(isDateToday('')).toBe(false);
    });
  });
});
