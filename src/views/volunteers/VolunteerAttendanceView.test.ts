import { describe, it, expect } from 'vitest';
import { isClassroomArea } from './VolunteerAttendanceView';
import { isCoordinatorRole, isSupervisorRole } from './components/AreaAttendanceDrawer';
import { MinistryAreaScope, VolunteerRole } from '@/libs/models';

describe('isClassroomArea', () => {
  it('returns false for null or undefined area', () => {
    expect(isClassroomArea(null)).toBe(false);
    expect(isClassroomArea(undefined)).toBe(false);
  });

  it('returns true when scope is KID_GROUP_MANAGEMENT', () => {
    expect(
      isClassroomArea({
        scope: MinistryAreaScope.KID_GROUP_MANAGEMENT,
        name: 'Cualquier nombre',
      }),
    ).toBe(true);
  });

  it('returns true when area is linked to kid groups', () => {
    expect(
      isClassroomArea({
        kidGroups: [{ id: 'group-1' }],
        name: 'Sin scope pero con grupo',
      }),
    ).toBe(true);

    expect(
      isClassroomArea({
        kidGroupId: 'group-1',
        name: 'Grupo asignado',
      }),
    ).toBe(true);

    expect(
      isClassroomArea({
        kidGroupIds: ['group-1', 'group-2'],
        name: 'Grupos asignados',
      }),
    ).toBe(true);
  });

  it('returns false for explicitly non-classroom scopes', () => {
    expect(
      isClassroomArea({
        scope: MinistryAreaScope.KID_REGISTRATION,
        name: 'Estación Registro',
      }),
    ).toBe(false);

    expect(
      isClassroomArea({
        scope: MinistryAreaScope.KID_SECURITY,
        name: 'Control Acceso',
      }),
    ).toBe(false);

    expect(
      isClassroomArea({
        scope: MinistryAreaScope.KID_MEDICAL,
        name: 'Primeros Auxilios',
      }),
    ).toBe(false);
  });

  it('returns false for general areas without classroom scope or kid groups', () => {
    expect(
      isClassroomArea({
        scope: null,
        name: 'Apoyo General',
      }),
    ).toBe(false);

    expect(
      isClassroomArea({
        scope: null,
        name: 'Multimedia y Audio',
      }),
    ).toBe(false);

    expect(
      isClassroomArea({
        scope: null,
        name: 'Alabanza',
      }),
    ).toBe(false);

    expect(
      isClassroomArea({
        scope: null,
        name: 'Limpieza y Aseo',
      }),
    ).toBe(false);

    expect(
      isClassroomArea({
        scope: null,
        name: 'Refrigerio',
      }),
    ).toBe(false);

    expect(
      isClassroomArea({
        scope: null,
        name: 'Staff y Logística',
      }),
    ).toBe(false);
  });

  it('returns false for areas without scope or kid groups regardless of name', () => {
    expect(
      isClassroomArea({
        scope: null,
      }),
    ).toBe(false);

    expect(
      isClassroomArea({
        scope: null,
        kidGroups: [],
      }),
    ).toBe(false);
  });
});

describe('isSupervisorRole', () => {
  it('returns true only for SUPERVISOR', () => {
    expect(isSupervisorRole(VolunteerRole.SUPERVISOR)).toBe(true);
  });

  it('returns false for coordinators and general volunteers', () => {
    expect(isSupervisorRole(VolunteerRole.GROUP_COORDINATOR)).toBe(false);
    expect(isSupervisorRole(VolunteerRole.AREA_GENERAL_COORDINATOR)).toBe(false);
    expect(isSupervisorRole(VolunteerRole.MINISTRY_GENERAL_COORDINATOR)).toBe(false);
    expect(isSupervisorRole(VolunteerRole.VOLUNTEER)).toBe(false);
    expect(isSupervisorRole(undefined)).toBe(false);
  });
});

describe('isCoordinatorRole', () => {
  it('returns true for coordinator roles', () => {
    expect(isCoordinatorRole(VolunteerRole.GROUP_COORDINATOR)).toBe(true);
    expect(isCoordinatorRole(VolunteerRole.AREA_GENERAL_COORDINATOR)).toBe(true);
    expect(isCoordinatorRole(VolunteerRole.MINISTRY_GENERAL_COORDINATOR)).toBe(true);
  });

  it('returns false for supervisor and volunteer roles', () => {
    expect(isCoordinatorRole(VolunteerRole.SUPERVISOR)).toBe(false);
    expect(isCoordinatorRole(VolunteerRole.VOLUNTEER)).toBe(false);
    expect(isCoordinatorRole(undefined)).toBe(false);
  });
});
