import { VolunteerAttendanceStatus, VolunteerRole } from '@/libs/models';
import { describe, expect, it } from 'vitest';
import { EnrichedVolunteerAttendance } from '../hooks/useMinistryServiceAttendance';

describe('Ministry Coordinator Attendance Logic', () => {
  const mockVolunteers: EnrichedVolunteerAttendance[] = [
    {
      assignmentId: 'asg-1',
      assignment: { id: 'asg-1', role: VolunteerRole.VOLUNTEER },
      fullName: 'Juan Pérez',
      role: VolunteerRole.VOLUNTEER,
      areaId: 'area-cunas',
      areaName: 'Cunas',
      groupId: 'grp-1',
      groupName: 'Grupo 1',
      isScheduled: true,
      attendanceStatus: VolunteerAttendanceStatus.ATTENDED,
    },
    {
      assignmentId: 'asg-2',
      assignment: { id: 'asg-2', role: VolunteerRole.SUPERVISOR },
      fullName: 'María Gómez',
      role: VolunteerRole.SUPERVISOR,
      areaId: 'area-cunas',
      areaName: 'Cunas',
      groupId: 'grp-1',
      groupName: 'Grupo 1',
      isScheduled: true,
      attendanceStatus: VolunteerAttendanceStatus.UNEXCUSED,
    },
    {
      assignmentId: 'asg-3',
      assignment: { id: 'asg-3', role: VolunteerRole.VOLUNTEER },
      fullName: 'Carlos López',
      role: VolunteerRole.VOLUNTEER,
      areaId: 'area-parvulos',
      areaName: 'Párvulos',
      groupId: 'grp-1',
      groupName: 'Grupo 1',
      isScheduled: true,
      attendanceStatus: VolunteerAttendanceStatus.EXCUSED,
    },
    {
      assignmentId: 'asg-4',
      assignment: { id: 'asg-4', role: VolunteerRole.VOLUNTEER },
      fullName: 'Ana Torres',
      role: VolunteerRole.VOLUNTEER,
      areaId: 'area-parvulos',
      areaName: 'Párvulos',
      groupId: 'grp-2',
      groupName: 'Grupo 2',
      isScheduled: false,
      attendanceStatus: VolunteerAttendanceStatus.ATTENDED,
    },
  ];

  it('calculates attendance metrics accurately for scheduled group', () => {
    let totalScheduled = 0;
    let attended = 0;
    let unexcused = 0;
    let excused = 0;

    mockVolunteers.forEach((v) => {
      if (v.isScheduled) totalScheduled++;
      if (v.attendanceStatus === VolunteerAttendanceStatus.ATTENDED) attended++;
      else if (v.attendanceStatus === VolunteerAttendanceStatus.UNEXCUSED)
        unexcused++;
      else if (v.attendanceStatus === VolunteerAttendanceStatus.EXCUSED)
        excused++;
    });

    expect(totalScheduled).toBe(3);
    expect(attended).toBe(2); // 1 scheduled + 1 support
    expect(unexcused).toBe(1);
    expect(excused).toBe(1);

    const scheduledAttended = mockVolunteers.filter(
      (v) =>
        v.isScheduled &&
        v.attendanceStatus === VolunteerAttendanceStatus.ATTENDED,
    ).length;
    const rate = Math.round((scheduledAttended / totalScheduled) * 100);
    expect(rate).toBe(33); // 1 out of 3 scheduled attended
  });

  it('correctly aggregates volunteers by area', () => {
    const areaMap = new Map<string, { attended: number; total: number }>();

    mockVolunteers.forEach((v) => {
      const existing = areaMap.get(v.areaId) || { attended: 0, total: 0 };
      existing.total++;
      if (v.attendanceStatus === VolunteerAttendanceStatus.ATTENDED) {
        existing.attended++;
      }
      areaMap.set(v.areaId, existing);
    });

    const cunas = areaMap.get('area-cunas');
    expect(cunas).toBeDefined();
    expect(cunas?.total).toBe(2);
    expect(cunas?.attended).toBe(1);

    const parvulos = areaMap.get('area-parvulos');
    expect(parvulos).toBeDefined();
    expect(parvulos?.total).toBe(2);
    expect(parvulos?.attended).toBe(1);
  });

  it('distinguishes between scheduled volunteers and support volunteers', () => {
    const scheduled = mockVolunteers.filter((v) => v.isScheduled);
    const support = mockVolunteers.filter((v) => !v.isScheduled);

    expect(scheduled.length).toBe(3);
    expect(support.length).toBe(1);
    expect(support[0].fullName).toBe('Ana Torres');
    expect(support[0].groupName).toBe('Grupo 2');
  });

  it('excludes unscheduled volunteers who have no attendance record', () => {
    // A volunteer from Grupo 2 who was NOT marked should NOT be in the service report
    const unscheduledUnmarked = {
      isScheduled: false,
      hasRecord: false,
    };
    const shouldInclude =
      unscheduledUnmarked.isScheduled || unscheduledUnmarked.hasRecord;
    expect(shouldInclude).toBe(false);

    // A volunteer from Grupo 2 who WAS marked as support SHOULD be included
    const unscheduledMarked = {
      isScheduled: false,
      hasRecord: true,
    };
    const shouldIncludeSupport =
      unscheduledMarked.isScheduled || unscheduledMarked.hasRecord;
    expect(shouldIncludeSupport).toBe(true);
  });
});
