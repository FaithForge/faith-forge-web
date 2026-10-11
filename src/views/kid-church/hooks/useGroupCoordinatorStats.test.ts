import { describe, it, expect } from 'vitest';
import {
  isClassroomArea,
  isSupervisorRole,
  isCoordinatorRole,
  isKidNewToday,
} from './useGroupCoordinatorStats';
import { MinistryAreaScope, VolunteerRole } from '@/libs/models';

describe('useGroupCoordinatorStats helpers', () => {
  describe('isClassroomArea', () => {
    it('returns false for null or undefined area', () => {
      expect(isClassroomArea(null)).toEqual(false);
      expect(isClassroomArea(undefined)).toEqual(false);
    });

    it('returns true when scope is KID_GROUP_MANAGEMENT', () => {
      expect(
        isClassroomArea({
          scope: MinistryAreaScope.KID_GROUP_MANAGEMENT,
          name: 'Cunas',
        }),
      ).toEqual(true);
    });

    it('returns true when area has kid groups', () => {
      expect(
        isClassroomArea({
          kidGroups: [{ id: 'group-1' }],
          name: 'Salón 1',
        }),
      ).toEqual(true);

      expect(
        isClassroomArea({
          kidGroupId: 'group-2',
          name: 'Salón 2',
        }),
      ).toEqual(true);
    });

    it('returns false when area has no kid groups and different scope', () => {
      expect(
        isClassroomArea({
          scope: MinistryAreaScope.KID_REGISTRATION,
          name: 'Entrada',
        }),
      ).toEqual(false);
    });
  });

  describe('isSupervisorRole', () => {
    it('returns true only for VolunteerRole.SUPERVISOR', () => {
      expect(isSupervisorRole(VolunteerRole.SUPERVISOR)).toEqual(true);
      expect(isSupervisorRole(VolunteerRole.VOLUNTEER)).toEqual(false);
      expect(isSupervisorRole(VolunteerRole.GROUP_COORDINATOR)).toEqual(false);
    });
  });

  describe('isCoordinatorRole', () => {
    it('identifies coordinator roles properly', () => {
      expect(isCoordinatorRole(VolunteerRole.GROUP_COORDINATOR)).toEqual(true);
      expect(isCoordinatorRole(VolunteerRole.AREA_GENERAL_COORDINATOR)).toEqual(true);
      expect(isCoordinatorRole(VolunteerRole.MINISTRY_GENERAL_COORDINATOR)).toEqual(true);
      expect(isCoordinatorRole(VolunteerRole.SUPERVISOR)).toEqual(false);
      expect(isCoordinatorRole(VolunteerRole.VOLUNTEER)).toEqual(false);
    });
  });

  describe('isKidNewToday', () => {
    it('returns true when currentKidRegistration.additionalInfo.isNew is true', () => {
      // ARRANGE
      const kid = {
        id: 'kid-1',
        currentKidRegistration: {
          additionalInfo: {
            isNew: true,
          },
        },
      } as any;

      // ACT
      const result = isKidNewToday(kid, '2026-10-10');

      // ASSERT
      expect(result).toEqual(true);
    });

    it('returns false when currentKidRegistration.additionalInfo.isNew is false', () => {
      // ARRANGE
      const kid = {
        id: 'kid-2',
        createdAt: '2026-10-10T10:00:00.000Z',
        currentKidRegistration: {
          additionalInfo: {
            isNew: false,
          },
        },
      } as any;

      // ACT
      const result = isKidNewToday(kid, '2026-10-10');

      // ASSERT
      expect(result).toEqual(false);
    });

    it('returns true when createdAt matches reference day', () => {
      // ARRANGE
      const kid = {
        id: 'kid-3',
        createdAt: '2026-10-10T08:30:00.000Z',
      } as any;

      // ACT
      const result = isKidNewToday(kid, '2026-10-10');

      // ASSERT
      expect(result).toEqual(true);
    });

    it('returns false when createdAt belongs to another day', () => {
      // ARRANGE
      const kid = {
        id: 'kid-4',
        createdAt: '2026-09-15T12:00:00.000Z',
      } as any;

      // ACT
      const result = isKidNewToday(kid, '2026-10-10');

      // ASSERT
      expect(result).toEqual(false);
    });

    it('returns false when neither isNew nor createdAt is provided', () => {
      // ARRANGE
      const kid = {
        id: 'kid-5',
      } as any;

      // ACT
      const result = isKidNewToday(kid, '2026-10-10');

      // ASSERT
      expect(result).toEqual(false);
    });
  });
});
