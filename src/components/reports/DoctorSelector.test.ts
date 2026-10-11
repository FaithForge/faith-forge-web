import { describe, it, expect } from 'vitest';
import { filterDoctors, DoctorOption } from './DoctorSelector';

const mockDoctors: DoctorOption[] = [
  {
    id: 'asg-1',
    fullName: 'Silvia Patricia Avila Martinez',
    areaName: 'Saludkids',
    code: '102030',
  },
  {
    id: 'asg-2',
    fullName: 'Carlos Andrés Perez Gómez',
    areaName: 'Médicos de Apoyo',
    code: '405060',
  },
  {
    id: 'asg-3',
    fullName: 'María José Rodríguez',
    areaName: 'Salud',
    code: 708090,
  },
];

describe('DoctorSelector - filterDoctors', () => {
  it('returns all doctors when query is empty or whitespace', () => {
    expect(filterDoctors(mockDoctors, '')).toEqual(mockDoctors);
    expect(filterDoctors(mockDoctors, '   ')).toEqual(mockDoctors);
  });

  it('filters doctors by name case-insensitively and ignoring accents', () => {
    const result1 = filterDoctors(mockDoctors, 'silvia');
    expect(result1).toHaveLength(1);
    expect(result1[0].id).toBe('asg-1');

    const result2 = filterDoctors(mockDoctors, 'andres');
    expect(result2).toHaveLength(1);
    expect(result2[0].id).toBe('asg-2');

    const result3 = filterDoctors(mockDoctors, 'maria');
    expect(result3).toHaveLength(1);
    expect(result3[0].id).toBe('asg-3');
  });

  it('filters doctors by area name', () => {
    const result = filterDoctors(mockDoctors, 'saludkids');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('asg-1');

    const resultArea = filterDoctors(mockDoctors, 'médicos');
    expect(resultArea).toHaveLength(1);
    expect(resultArea[0].id).toBe('asg-2');
  });

  it('filters doctors by numeric code with or without hash symbol', () => {
    const result = filterDoctors(mockDoctors, '102030');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('asg-1');

    const resultWithHash = filterDoctors(mockDoctors, '#405060');
    expect(resultWithHash).toHaveLength(1);
    expect(resultWithHash[0].id).toBe('asg-2');
  });

  it('returns empty array when no doctors match the query', () => {
    const result = filterDoctors(mockDoctors, 'NonExistentDoctor');
    expect(result).toHaveLength(0);
  });
});
