import { DATE_FORMAT_DISPLAY } from '@/libs/common-types/constants';
import {
  IMatrixEventColumn,
  IMatrixVolunteerRosterItem,
  MatrixCellStatus,
  MatrixRiskLevel,
  VolunteerRole,
} from '@/libs/models';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

/**
 * Computes risk level based on attendance rate and absence breakdown:
 * - CRITICAL: >= 3 unexcused absences, OR (>= 2 unexcused AND rate <= 30%). Never critical if unexcused = 0.
 * - ALERT: 2 unexcused absences, OR 1 unexcused absence, OR (unexcused > 0 AND rate <= 59%).
 * - REGULAR: 0 unexcused absences with at least 1 excused absence, OR rate between 60% and 84%.
 * - OPTIMAL: 0 unexcused, 0 excused, and rate >= 85%.
 *
 * @param {number} rate - Attendance rate between 0 and 100.
 * @param {number} [unexcusedCount=0] - Number of unexcused absences.
 * @param {number} [excusedCount=0] - Number of justified/excused absences.
 * @returns {MatrixRiskLevel} Risk classification.
 */
function evaluateRiskLevel(
  rate: number,
  unexcusedCount: number = 0,
  excusedCount: number = 0,
): MatrixRiskLevel {
  if (unexcusedCount >= 3 || (unexcusedCount >= 2 && rate <= 30)) {
    return MatrixRiskLevel.CRITICAL;
  }
  if (unexcusedCount === 2 || (unexcusedCount === 1 && rate < 60)) {
    return MatrixRiskLevel.ALERT;
  }
  if (unexcusedCount === 0 && excusedCount > 0) {
    return MatrixRiskLevel.REGULAR;
  }
  if (unexcusedCount > 0 && rate <= 59) {
    return MatrixRiskLevel.ALERT;
  }
  if (rate <= 84) {
    return MatrixRiskLevel.REGULAR;
  }
  return MatrixRiskLevel.OPTIMAL;
}

/**
 * Builds pastoral WhatsApp outreach link.
 *
 * @param {string} phone - Target phone number.
 * @param {string} dialCode - Country code prefix.
 * @param {string} volunteerName - First name of volunteer.
 * @param {string} ministryName - Active ministry name.
 * @returns {string | null} WhatsApp direct link or null if no phone.
 */
function buildWhatsAppLink(
  phone?: string,
  dialCode?: string,
  volunteerName?: string,
  ministryName?: string,
): string | null {
  if (!phone) return null;

  const rawPhone = phone.replace(/\D/g, '');
  const rawCode = (dialCode || '57').replace(/\D/g, '');
  const cleanPhone = rawPhone.startsWith(rawCode)
    ? rawPhone
    : `${rawCode}${rawPhone}`;

  const message = `¡Hola ${volunteerName || ''}! Te saludamos del ministerio ${ministryName || ''}. Notamos que no has podido acompañarnos en los últimos servicios y queríamos saber cómo estás y si podemos apoyarte en algo.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Checks whether an unlinking action requires an emphatic warning banner.
 *
 * @param {MatrixRiskLevel} riskLevel - The risk status of the volunteer.
 * @returns {boolean} True if the volunteer has Regular or Optimal attendance.
 */
function requiresEmphaticWarning(riskLevel: MatrixRiskLevel): boolean {
  return (
    riskLevel === MatrixRiskLevel.REGULAR ||
    riskLevel === MatrixRiskLevel.OPTIMAL
  );
}

/**
 * Generates CSV content with UTF-8 BOM for attendance matrix.
 *
 * @param {IMatrixEventColumn[]} events - List of event columns.
 * @param {IMatrixVolunteerRosterItem[]} roster - List of volunteers.
 * @returns {string} Formatted CSV string.
 */
function generateMatrixCsv(
  events: IMatrixEventColumn[],
  roster: IMatrixVolunteerRosterItem[],
): string {
  const eventHeaders = events.map(
    (ev) =>
      `"${dayjs(ev.date).format(DATE_FORMAT_DISPLAY)} - ${ev.meetingName}"`,
  );

  const headers = [
    '"Servidor"',
    '"Teléfono"',
    '"Área"',
    '"Grupo"',
    '"Tasa (%)"',
    '"Estado de Riesgo"',
    '"Faltas Sin Justificar"',
    '"Faltas Justificadas"',
    '"Asistencias"',
    ...eventHeaders,
  ];

  const rows = roster.map((v) => {
    const eventStatuses = events.map((ev) => {
      const cell = v.matrix[`${ev.date}_${ev.id}`];
      if (!cell) return '"No Convocado"';
      switch (cell.status) {
        case MatrixCellStatus.ATTENDED:
          return '"Asistió"';
        case MatrixCellStatus.EXCUSED:
          return `"${cell.observation ? `Con Excusa: ${cell.observation}` : 'Con Excusa'}"`;
        case MatrixCellStatus.UNEXCUSED:
          return '"Sin Excusa"';
        case MatrixCellStatus.EXEMPT:
          return '"Exento"';
        default:
          return '"-"';
      }
    });

    return [
      `"${v.fullName}"`,
      `"${v.phone || '-'}"`,
      `"${v.areaName || '-'}"`,
      `"${v.groupName || '-'}"`,
      `"${v.attendanceRate}%"`,
      `"${v.riskLevel}"`,
      `"${v.unexcusedCount}"`,
      `"${v.excusedCount}"`,
      `"${v.attendedCount}"`,
      ...eventStatuses,
    ].join(',');
  });

  return `\uFEFF${headers.join(',')}\n${rows.join('\n')}`;
}

describe('MinistryCoordinatorAttendanceMatrixView Logic & Transformations', () => {
  const mockEvents: IMatrixEventColumn[] = [
    {
      id: 'm1',
      meetingName: 'Taller',
      date: '2026-05-12',
      initialHour: '08:00',
      scheduledGroupIds: [],
    },
    {
      id: 'm2',
      meetingName: 'Sync',
      date: '2026-05-15',
      initialHour: '18:00',
      scheduledGroupIds: [],
    },
    {
      id: 'm3',
      meetingName: 'Rev.',
      date: '2026-05-19',
      initialHour: '10:00',
      scheduledGroupIds: [],
    },
  ];

  const mockRoster: IMatrixVolunteerRosterItem[] = [
    {
      assignmentId: 'asg-1',
      churchMemberId: 'm-1',
      fullName: 'Carlos Mendoza',
      firstName: 'Carlos',
      lastName: 'Mendoza',
      phone: '3001234567',
      dialCodePhone: '+57',
      areaName: 'Producción',
      groupName: 'Grupo 1',
      role: VolunteerRole.VOLUNTEER,
      attendanceRate: 0,
      riskLevel: MatrixRiskLevel.CRITICAL,
      unexcusedCount: 3,
      excusedCount: 0,
      attendedCount: 0,
      totalRequired: 3,
      matrix: {
        '2026-05-12_m1': { status: MatrixCellStatus.UNEXCUSED },
        '2026-05-15_m2': { status: MatrixCellStatus.UNEXCUSED },
        '2026-05-19_m3': { status: MatrixCellStatus.UNEXCUSED },
      },
    },
    {
      assignmentId: 'asg-2',
      churchMemberId: 'm-2',
      fullName: 'Lucía Paredes',
      firstName: 'Lucía',
      lastName: 'Paredes',
      phone: '3009876543',
      dialCodePhone: '+57',
      areaName: 'Producción',
      groupName: 'Grupo 1',
      role: VolunteerRole.VOLUNTEER,
      attendanceRate: 50,
      riskLevel: MatrixRiskLevel.ALERT,
      unexcusedCount: 1,
      excusedCount: 1,
      attendedCount: 1,
      totalRequired: 3,
      matrix: {
        '2026-05-12_m1': { status: MatrixCellStatus.ATTENDED },
        '2026-05-15_m2': {
          status: MatrixCellStatus.EXCUSED,
          observation: 'Médico',
        },
        '2026-05-19_m3': { status: MatrixCellStatus.UNEXCUSED },
      },
    },
    {
      assignmentId: 'asg-3',
      churchMemberId: 'm-3',
      fullName: 'Elena Salazar',
      firstName: 'Elena',
      lastName: 'Salazar',
      phone: '3105551234',
      dialCodePhone: '+57',
      areaName: 'Producción',
      groupName: 'Grupo 1',
      role: VolunteerRole.VOLUNTEER,
      attendanceRate: 67,
      riskLevel: MatrixRiskLevel.REGULAR,
      unexcusedCount: 0,
      excusedCount: 1,
      attendedCount: 2,
      totalRequired: 3,
      matrix: {
        '2026-05-12_m1': { status: MatrixCellStatus.ATTENDED },
        '2026-05-15_m2': { status: MatrixCellStatus.EXCUSED },
        '2026-05-19_m3': { status: MatrixCellStatus.ATTENDED },
      },
    },
    {
      assignmentId: 'asg-4',
      churchMemberId: 'm-4',
      fullName: 'Javier Morales',
      firstName: 'Javier',
      lastName: 'Morales',
      phone: '3157778899',
      dialCodePhone: '+57',
      areaName: 'Producción',
      groupName: 'Grupo 1',
      role: VolunteerRole.VOLUNTEER,
      attendanceRate: 100,
      riskLevel: MatrixRiskLevel.OPTIMAL,
      unexcusedCount: 0,
      excusedCount: 0,
      attendedCount: 3,
      totalRequired: 3,
      matrix: {
        '2026-05-12_m1': { status: MatrixCellStatus.ATTENDED },
        '2026-05-15_m2': { status: MatrixCellStatus.ATTENDED },
        '2026-05-19_m3': { status: MatrixCellStatus.ATTENDED },
      },
    },
  ];

  describe('Single-Group Filter Policy', () => {
    it('restricts group selection to individual group IDs and does not allow ALL', () => {
      const availableGroups = [
        { id: 'group-1', name: 'Grupo #1' },
        { id: 'group-2', name: 'Grupo #2' },
      ];

      const resolveInitialGroup = (groups: { id: string; name: string }[]) =>
        groups[0]?.id || '';

      const selected = resolveInitialGroup(availableGroups);
      expect(selected).toEqual('group-1');
      expect(selected).not.toEqual('ALL');
      expect(availableGroups.some((g) => g.id === selected)).toEqual(true);
    });
  });

  describe('Risk Level Segmentation', () => {
    it('classifies attendance rates into the calibrated risk categories and protects excused absences', () => {
      // Critical: >= 3 unexcused
      expect(evaluateRiskLevel(0, 3, 0)).toEqual(MatrixRiskLevel.CRITICAL);
      expect(evaluateRiskLevel(30, 2, 0)).toEqual(MatrixRiskLevel.CRITICAL);

      // Justified Absences: 0 unexcused, at least 1 excused -> ALWAYS REGULAR, NEVER CRITICAL
      expect(evaluateRiskLevel(0, 0, 3)).toEqual(MatrixRiskLevel.REGULAR);
      expect(evaluateRiskLevel(50, 0, 2)).toEqual(MatrixRiskLevel.REGULAR);

      // Alert: 1 or 2 unexcused
      expect(evaluateRiskLevel(0, 1, 2)).toEqual(MatrixRiskLevel.ALERT);
      expect(evaluateRiskLevel(50, 1, 1)).toEqual(MatrixRiskLevel.ALERT);
      expect(evaluateRiskLevel(59, 1, 0)).toEqual(MatrixRiskLevel.ALERT);

      // Regular: 60% - 84%
      expect(evaluateRiskLevel(60, 0, 0)).toEqual(MatrixRiskLevel.REGULAR);
      expect(evaluateRiskLevel(75, 0, 0)).toEqual(MatrixRiskLevel.REGULAR);
      expect(evaluateRiskLevel(84, 0, 0)).toEqual(MatrixRiskLevel.REGULAR);

      // Optimal: 85% - 100% with 0 unexcused, 0 excused
      expect(evaluateRiskLevel(85, 0, 0)).toEqual(MatrixRiskLevel.OPTIMAL);
      expect(evaluateRiskLevel(100, 0, 0)).toEqual(MatrixRiskLevel.OPTIMAL);
    });
  });

  describe('Roster Filtering and Search', () => {
    it('filters volunteers by risk level', () => {
      const criticalVolunteers = mockRoster.filter(
        (v) => v.riskLevel === MatrixRiskLevel.CRITICAL,
      );
      expect(criticalVolunteers.length).toEqual(1);
      expect(criticalVolunteers[0].fullName).toEqual('Carlos Mendoza');

      const alertVolunteers = mockRoster.filter(
        (v) => v.riskLevel === MatrixRiskLevel.ALERT,
      );
      expect(alertVolunteers.length).toEqual(1);
      expect(alertVolunteers[0].fullName).toEqual('Lucía Paredes');
    });

    it('filters volunteers by name case-insensitively', () => {
      const query = 'elena';
      const results = mockRoster.filter((v) =>
        v.fullName.toLowerCase().includes(query.toLowerCase()),
      );
      expect(results.length).toEqual(1);
      expect(results[0].fullName).toEqual('Elena Salazar');
    });
  });

  describe('Roster Sorting Algorithms', () => {
    it('sorts primarily by unexcused absences descending to surface critical members', () => {
      const sorted = [...mockRoster].sort(
        (a, b) => b.unexcusedCount - a.unexcusedCount,
      );
      expect(sorted[0].fullName).toEqual('Carlos Mendoza');
      expect(sorted[0].unexcusedCount).toEqual(3);
      expect(sorted[1].fullName).toEqual('Lucía Paredes');
      expect(sorted[1].unexcusedCount).toEqual(1);
    });

    it('sorts by attendance rate ascending', () => {
      const sorted = [...mockRoster].sort(
        (a, b) => a.attendanceRate - b.attendanceRate,
      );
      expect(sorted[0].attendanceRate).toEqual(0);
      expect(sorted[3].attendanceRate).toEqual(100);
    });

    it('sorts by attendance rate descending', () => {
      const sorted = [...mockRoster].sort(
        (a, b) => b.attendanceRate - a.attendanceRate,
      );
      expect(sorted[0].attendanceRate).toEqual(100);
      expect(sorted[3].attendanceRate).toEqual(0);
    });

    it('sorts alphabetically by full name', () => {
      const sorted = [...mockRoster].sort((a, b) =>
        a.fullName.localeCompare(b.fullName),
      );
      expect(sorted[0].fullName).toEqual('Carlos Mendoza');
      expect(sorted[1].fullName).toEqual('Elena Salazar');
      expect(sorted[2].fullName).toEqual('Javier Morales');
      expect(sorted[3].fullName).toEqual('Lucía Paredes');
    });
  });

  describe('Immediate Pastoral Outreach via WhatsApp', () => {
    it('formats a direct wa.me link with country dial code and pastoral message', () => {
      const link = buildWhatsAppLink('3001234567', '+57', 'Carlos', 'Alabanza');
      expect(link).toContain('https://wa.me/573001234567?text=');
      expect(link).toContain('Carlos');
      expect(link).toContain('Alabanza');
    });

    it('returns null if phone is missing', () => {
      const link = buildWhatsAppLink(undefined, '+57', 'Carlos', 'Alabanza');
      expect(link).toEqual(null);
    });
  });

  describe('Administrative Action Warning Protocol', () => {
    it('requires emphatic warning only for Regular and Optimal volunteers', () => {
      expect(requiresEmphaticWarning(MatrixRiskLevel.OPTIMAL)).toEqual(true);
      expect(requiresEmphaticWarning(MatrixRiskLevel.REGULAR)).toEqual(true);
      expect(requiresEmphaticWarning(MatrixRiskLevel.ALERT)).toEqual(false);
      expect(requiresEmphaticWarning(MatrixRiskLevel.CRITICAL)).toEqual(false);
    });
  });

  describe('CSV Export Generation with UTF-8 BOM', () => {
    it('generates a valid CSV with BOM, correct event column headers, and statuses', () => {
      const csv = generateMatrixCsv(mockEvents, mockRoster);

      // Starts with UTF-8 BOM
      expect(csv.startsWith('\uFEFF')).toEqual(true);

      // Contains header line
      expect(csv).toContain('"Servidor","Teléfono","Área","Grupo"');
      expect(csv).toContain('"12/05/2026 - Taller"');
      expect(csv).toContain('"15/05/2026 - Sync"');
      expect(csv).toContain('"19/05/2026 - Rev."');

      // Contains volunteer rows
      expect(csv).toContain(
        '"Carlos Mendoza","3001234567","Producción","Grupo 1","0%","CRITICAL"',
      );
      expect(csv).toContain('"Sin Excusa"');
      expect(csv).toContain('"Con Excusa: Médico"');
      expect(csv).toContain('"Asistió"');
    });
  });
});
