import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import {
  formatDateOnly,
  toDateOnlyInputValue,
  isDateToday,
  formatDateTime,
  formatRelativeTime,
} from './date';

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

  describe('formatDateTime', () => {
    it('returns empty string for null, undefined, or invalid inputs', () => {
      expect(formatDateTime(null)).toBe('');
      expect(formatDateTime(undefined)).toBe('');
      expect(formatDateTime('')).toBe('');
      expect(formatDateTime('invalid-date')).toBe('');
    });

    it('parses UTC timestamp without Z suffix and converts to Colombia timezone (America/Bogota)', () => {
      const utcString = '2026-09-25T03:35:00';
      // 03:35 UTC on Sep 25 is 22:35 on Sep 24 in Colombia (UTC-5)
      expect(formatDateTime(utcString)).toBe('24 sep 2026, 22:35');
    });

    it('parses SQL timestamp string with space and converts to Colombia timezone', () => {
      const sqlString = '2026-09-25 03:27:00';
      // 03:27 UTC on Sep 25 is 22:27 on Sep 24 in Colombia (UTC-5)
      expect(formatDateTime(sqlString)).toBe('24 sep 2026, 22:27');
    });

    it('parses ISO string with Z suffix and converts to Colombia timezone', () => {
      const isoString = '2026-09-25T03:35:00.000Z';
      expect(formatDateTime(isoString)).toBe('24 sep 2026, 22:35');
    });

    it('supports custom format strings', () => {
      const isoString = '2026-09-25T03:35:00.000Z';
      expect(formatDateTime(isoString, 'YYYY-MM-DD')).toBe('2026-09-24');
    });

    it('supports custom target timezone', () => {
      const isoString = '2026-09-25T03:35:00.000Z';
      expect(formatDateTime(isoString, 'DD MMM YYYY, HH:mm', 'UTC')).toBe('25 sep 2026, 03:35');
    });
  });

  describe('formatRelativeTime', () => {
    it('returns empty string for null, undefined, or invalid inputs', () => {
      expect(formatRelativeTime(null)).toBe('');
      expect(formatRelativeTime(undefined)).toBe('');
      expect(formatRelativeTime('')).toBe('');
      expect(formatRelativeTime('invalid-date')).toBe('');
    });

    it('correctly calculates relative time for UTC timestamp without Z in Colombia timezone', () => {
      const recentUtc = dayjs().utc().subtract(5, 'minute').format('YYYY-MM-DD HH:mm:ss');
      const result = formatRelativeTime(recentUtc);
      expect(result).toMatch(/hace \d+ minuto/i);
    });
  });
});

