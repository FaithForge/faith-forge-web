import { describe, expect, it } from 'vitest';
import {
  capitalizeWords,
  formatPersonFirstAndLastNames,
  formatPersonFullName,
  formatPersonShortName,
  removeAccentsAndFormat,
} from './text';

describe('text utils', () => {
  describe('capitalizeWords', () => {
    it('capitalizes all-caps names into Title Case', () => {
      expect(capitalizeWords('JUAN CARLOS PEÑA MERLANO')).toBe('Juan Carlos Peña Merlano');
      expect(capitalizeWords('ARGENNY MARIA MALAMBO MONTALVO')).toBe('Argenny Maria Malambo Montalvo');
      expect(capitalizeWords('CARMEN ROSA CARABALLO GOMEZ')).toBe('Carmen Rosa Caraballo Gomez');
      expect(capitalizeWords('DEYIS VILLADIEGO LIÑAN')).toBe('Deyis Villadiego Liñan');
      expect(capitalizeWords('JULIANA SOFIA FLOREZ GUERRA')).toBe('Juliana Sofia Florez Guerra');
    });

    it('preserves existing proper casing', () => {
      expect(capitalizeWords('Day Diana Batista Bermudez')).toBe('Day Diana Batista Bermudez');
    });

    it('handles multiple spaces and leading/trailing whitespace', () => {
      expect(capitalizeWords('  SENITH   MARIA  PUCHE  RODELO  ')).toBe('Senith Maria Puche Rodelo');
    });

    it('handles hyphens and parentheses in names', () => {
      expect(capitalizeWords('jean-pierre del carmen')).toBe('Jean-Pierre Del Carmen');
      expect(capitalizeWords('MARÍA (MAMÁ)')).toBe('María (Mamá)');
    });

    it('returns empty string for falsy/empty values', () => {
      expect(capitalizeWords('')).toBe('');
      expect(capitalizeWords(undefined)).toBe('');
      expect(capitalizeWords('   ')).toBe('');
    });
  });

  describe('formatPersonFullName', () => {
    it('formats firstName and lastName correctly', () => {
      expect(formatPersonFullName('JUAN CARLOS', 'PEÑA MERLANO')).toBe('Juan Carlos Peña Merlano');
    });

    it('formats single full name argument', () => {
      expect(formatPersonFullName('JUAN CARLOS PEÑA MERLANO')).toBe('Juan Carlos Peña Merlano');
    });

    it('handles missing or partial names', () => {
      expect(formatPersonFullName('JUAN CARLOS', undefined)).toBe('Juan Carlos');
      expect(formatPersonFullName(undefined, 'PEÑA MERLANO')).toBe('Peña Merlano');
      expect(formatPersonFullName('', '')).toBe('');
      expect(formatPersonFullName(undefined, undefined)).toBe('');
    });
  });

  describe('formatPersonShortName', () => {
    it('formats first name and first last name from separate inputs', () => {
      expect(formatPersonShortName('JUAN CARLOS', 'PEÑA MERLANO')).toBe('Juan Carlos Peña');
    });

    it('formats from combined single string', () => {
      expect(formatPersonShortName('JUAN CARLOS PEÑA MERLANO')).toBe('Juan Carlos');
    });

    it('handles missing values', () => {
      expect(formatPersonShortName(undefined, undefined)).toBe('');
    });
  });

  describe('formatPersonFirstAndLastNames', () => {
    it('formats first given name and all last names', () => {
      expect(formatPersonFirstAndLastNames('Carlos Andres', 'Toro Cortina')).toBe('Carlos Toro Cortina');
    });
  });

  describe('removeAccentsAndFormat', () => {
    it('removes accents and formatting symbols', () => {
      expect(removeAccentsAndFormat('Ángel Peña')).toBe('Angel Peña');
    });
  });
});

