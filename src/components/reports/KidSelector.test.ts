import { describe, it, expect } from 'vitest';
import { filterRegisteredKids } from './KidSelector';
import { IKid } from '@/libs/models';

describe('filterRegisteredKids', () => {
  const mockKids: IKid[] = [
    {
      id: 'kid-1',
      firstName: 'Matías David',
      lastName: 'Carbal Din',
      faithForgeId: 113563,
      age: 2,
    } as unknown as IKid,
    {
      id: 'kid-2',
      firstName: 'Sofía',
      lastName: 'Pérez Gómez',
      faithForgeId: 204918,
      age: 4,
    } as unknown as IKid,
    {
      id: 'kid-3',
      firstName: 'Lucas',
      lastName: 'García',
      faithForgeId: 301294,
      age: 6,
    } as unknown as IKid,
  ];

  it('returns all kids when query is empty or whitespace', () => {
    expect(filterRegisteredKids(mockKids, '')).toEqual(mockKids);
    expect(filterRegisteredKids(mockKids, '   ')).toEqual(mockKids);
  });

  it('matches by partial name without accents', () => {
    // Search "matias" matching "Matías"
    const results = filterRegisteredKids(mockKids, 'matias');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('kid-1');
  });

  it('matches by accented search query', () => {
    // Search "Sofía" or "sofia" matching "Sofía"
    const resultsAccented = filterRegisteredKids(mockKids, 'sofía');
    expect(resultsAccented).toHaveLength(1);
    expect(resultsAccented[0].id).toBe('kid-2');

    const resultsUnaccented = filterRegisteredKids(mockKids, 'sofia');
    expect(resultsUnaccented).toHaveLength(1);
    expect(resultsUnaccented[0].id).toBe('kid-2');
  });

  it('matches by last name', () => {
    const results = filterRegisteredKids(mockKids, 'carbal');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('kid-1');
  });

  it('matches by numeric faithForgeId code', () => {
    const results = filterRegisteredKids(mockKids, '113563');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('kid-1');
  });

  it('matches by code with hash prefix like #113563', () => {
    const results = filterRegisteredKids(mockKids, '#113563');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('kid-1');
  });

  it('returns empty array when no kids match', () => {
    const results = filterRegisteredKids(mockKids, 'NoExiste');
    expect(results).toHaveLength(0);
  });
});
