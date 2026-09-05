import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/es';
import { IAttendanceReportData } from '@/libs/models';

dayjs.extend(utc);
dayjs.locale('es');

/**
 * Palette colors for the Iglekids attendance report.
 */
const COLORS = {
  primary: [124, 58, 237] as [number, number, number],
  primaryDark: [91, 33, 182] as [number, number, number],
  primaryLight: [237, 233, 254] as [number, number, number],
  secondaryPink: [236, 72, 153] as [number, number, number],
  secondaryBlue: [59, 130, 246] as [number, number, number],
  amberDark: [180, 83, 9] as [number, number, number],
  amberLight: [254, 243, 199] as [number, number, number],
  emeraldDark: [4, 120, 87] as [number, number, number],
  emeraldLight: [209, 250, 229] as [number, number, number],
  redDark: [185, 28, 28] as [number, number, number],
  redLight: [254, 226, 226] as [number, number, number],
  textDark: [30, 41, 59] as [number, number, number],
  textMuted: [100, 116, 139] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  bgSoft: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

/**
 * Known age progression order for Iglekids classrooms (from youngest to oldest).
 */
const KNOWN_CLASSROOM_ORDER: Array<{ match: string; rank: number }> = [
  { match: 'bebe', rank: 1 },
  { match: 'bebé', rank: 1 },
  { match: 'cuna', rank: 1 },
  { match: 'caminador', rank: 2 },
  { match: 'yo soy', rank: 3 },
  { match: 'maternal', rank: 3 },
  { match: 'parvulo', rank: 3 },
  { match: 'párvulo', rank: 3 },
  { match: 'tito', rank: 4 },
  { match: 'jeremia', rank: 5 },
  { match: 'jeremía', rank: 5 },
  { match: 'zaqueo', rank: 6 },
  { match: 'timoteo', rank: 7 },
];

/**
 * Computes an age-sorting rank for a classroom group.
 * Matches known Iglekids classrooms first, and falls back to attendee average age.
 *
 * @param {string} groupName - The classroom name.
 * @param {Array<{ kid: { age: number } }> | undefined} kids - Attendees in that group.
 * @returns {number} Numeric rank (lower number = younger age).
 */
const getGroupAgeRank = (groupName: string, kids?: Array<{ kid: { age: number } }>): number => {
  const norm = groupName.toLowerCase().trim();
  const known = KNOWN_CLASSROOM_ORDER.find((item) => norm.includes(item.match));
  if (known) return known.rank * 10;

  if (kids && kids.length > 0) {
    const sum = kids.reduce((acc, k) => acc + (k.kid.age || 0), 0);
    return 100 + sum / kids.length;
  }

  return 200;
};

/**
 * Converts a 24h time string or slot range to 12h AM/PM format.
 * Example: "19:30 - 19:45" → "07:30 - 07:45 PM"
 *
 * @param {string} timeStr - 24h time string or "HH:MM - HH:MM" slot range.
 * @returns {string} Formatted 12h AM/PM string.
 */
const to12h = (timeStr: string): string => {
  if (!timeStr) return timeStr;

  const convertSingle = (t: string): { label: string; suffix: string } => {
    const [hStr, mStr] = t.trim().split(':');
    const h = parseInt(hStr, 10);
    const m = mStr || '00';
    if (isNaN(h)) return { label: t.trim(), suffix: '' };
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return { label: `${String(h12).padStart(2, '0')}:${m}`, suffix };
  };

  if (timeStr.includes(' - ')) {
    const parts = timeStr.split(' - ');
    const start = convertSingle(parts[0]);
    const end = convertSingle(parts[1] || '');
    return `${start.label} - ${end.label} ${end.suffix}`;
  }

  const single = convertSingle(timeStr);
  return `${single.label} ${single.suffix}`;
};

/**
 * Returns a human-readable age string. Shows months for children under 1 year
 * and years otherwise, writing "años" or "meses" in full.
 *
 * @param {number} age - Age in years from the API.
 * @param {string | undefined} birthday - ISO birthday string for precise calculation.
 * @returns {string} Age label like "7 años", "1 año", "5 meses", "1 mes".
 */
const formatAge = (age: number, birthday?: string): string => {
  if (age && age > 0) {
    return age === 1 ? '1 año' : `${age} años`;
  }

  if (birthday) {
    const dateStr = typeof birthday === 'string' ? birthday.substring(0, 10) : dayjs(birthday).format('YYYY-MM-DD');
    const months = dayjs().diff(dayjs.utc(dateStr), 'month');
    if (months < 12) {
      return months === 1 ? '1 mes' : `${Math.max(0, months)} meses`;
    }
    const years = Math.floor(months / 12);
    return years === 1 ? '1 año' : `${years} años`;
  }

  return '-';
};

/**
 * Converts a string to Title Case (proper case for display).
 * Handles Spanish accented characters properly.
 * Example: "JUAN PÉREZ" → "Juan Pérez"
 *
 * @param {string} str - Input string.
 * @returns {string} Title-cased string.
 */
const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formats a phone number with its dial code.
 *
 * @param {string} phone - Raw phone number from API.
 * @param {string | undefined} dialCode - Dial code string (e.g. "+57").
 * @returns {string} Formatted phone string like "+57 3052420401".
 */
const formatPhone = (phone: string, dialCode?: string): string => {
  if (!phone || phone === '-') return '-';
  if (phone.startsWith('+')) return phone;
  const code = (dialCode || '+57').trim();
  return `${code} ${phone}`;
};

/**
 * Generates and downloads the official Iglekids service attendance PDF report.
 *
 * @param {IAttendanceReportData} report - Full attendance and summary data.
 * @returns {void}
 */
export const generateIglekidsAttendancePdf = (report: IAttendanceReportData): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  let currentY = 14;

  // --- 1. HEADER INSTITUCIONAL ---
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.primary);
  doc.text('IGLEKIDS', marginX, currentY);

  const churchName = report.metadata?.church?.name || 'Comunidad Cristiana';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.textDark);
  doc.text(toTitleCase(churchName), marginX + 34, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Informe Oficial de Asistencia y Metricas de Servicio', marginX + 34, currentY + 4.5);

  currentY += 10;

  // --- BANNER DESTACADO DEL SERVICIO (EQUILIBRADO) ---
  const bannerY = currentY;
  const bannerHeight = 19;

  // Background Box
  doc.setFillColor(...COLORS.bgSoft);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(marginX, bannerY, contentWidth, bannerHeight, 2, 2, 'FD');

  // Left accent border line
  doc.setFillColor(...COLORS.primary);
  doc.rect(marginX, bannerY, 2.5, bannerHeight, 'F');

  const colW = contentWidth / 4;

  // Subtle column separators for balanced dashboard layout
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(marginX + colW, bannerY + 3, marginX + colW, bannerY + bannerHeight - 3);
  doc.line(marginX + colW * 2, bannerY + 3, marginX + colW * 2, bannerY + bannerHeight - 3);
  doc.line(marginX + colW * 3, bannerY + 3, marginX + colW * 3, bannerY + bannerHeight - 3);

  // Col 1: Sede
  const col0X = marginX + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.primary);
  doc.text('SEDE', col0X, bannerY + 5.5);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textDark);
  const campusName = report.metadata?.campus?.name || 'Sede Principal';
  doc.text(doc.splitTextToSize(toTitleCase(campusName), colW - 8)[0] || '', col0X, bannerY + 11.5);

  // Col 2: Servicio
  const col1X = marginX + colW + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.primary);
  doc.text('SERVICIO', col1X, bannerY + 5.5);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textDark);
  const meetingName = report.metadata?.meeting?.name || 'Servicio General';
  const meetingLines = doc.splitTextToSize(toTitleCase(meetingName), colW - 7);
  doc.text(meetingLines.slice(0, 2), col1X, bannerY + 11.5, { lineHeightFactor: 1.25 });

  // Col 3: Día del Servicio (Equilibrado con la misma jerarquía)
  const col2X = marginX + colW * 2 + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.primary);
  doc.text('DIA DEL SERVICIO', col2X, bannerY + 5.5);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textDark);
  const dayLabel = report.metadata?.dayName || report.metadata?.meeting?.day || 'Domingo';
  doc.text(toTitleCase(dayLabel), col2X, bannerY + 11.5);

  // Col 4: Fecha
  const col3X = marginX + colW * 3 + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.primary);
  doc.text('FECHA', col3X, bannerY + 5.5);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textDark);
  const reportDateRaw = report.metadata?.reportDate;
  const dateFormatted = reportDateRaw
    ? dayjs(reportDateRaw).locale('es').format('DD [de] MMMM[,] YYYY')
    : dayjs().locale('es').format('DD [de] MMMM[,] YYYY');
  doc.text(dateFormatted, col3X, bannerY + 11.5);

  currentY = bannerY + bannerHeight + 6;

  // --- SECCIÓN 1: TOTALES GENERALES (KPI CARDS) ---
  const kpiW = (contentWidth - 9) / 4;
  const kpiH = 16;

  // KPI 1: Total Registrados
  doc.setFillColor(...COLORS.primaryLight);
  doc.setDrawColor(...COLORS.primary);
  doc.roundedRect(marginX, currentY, kpiW, kpiH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text('TOTAL REGISTRADOS', marginX + 3, currentY + 4.5);
  doc.setFontSize(14);
  doc.text(String(report.summary?.totalKids ?? 0), marginX + 3, currentY + 12.5);

  // KPI 2: Nuevos
  const kpi2X = marginX + kpiW + 3;
  doc.setFillColor(...COLORS.amberLight);
  doc.setDrawColor(...COLORS.amberDark);
  doc.roundedRect(kpi2X, currentY, kpiW, kpiH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.amberDark);
  const newKidsCount = report.summary?.totalNewKids ?? 0;
  const totalKidsCount = report.summary?.totalKids || 1;
  const newKidsPct = Math.round((newKidsCount / totalKidsCount) * 100);
  doc.text('NUEVOS (1a VEZ)', kpi2X + 3, currentY + 4.5);
  doc.setFontSize(14);
  doc.text(`${newKidsCount}`, kpi2X + 3, currentY + 12.5);
  doc.setFontSize(7.5);
  doc.text(`(${newKidsPct}%)`, kpi2X + 16, currentY + 12.5);

  // KPI 3: Recurrentes
  const kpi3X = marginX + (kpiW + 3) * 2;
  doc.setFillColor(...COLORS.emeraldLight);
  doc.setDrawColor(...COLORS.emeraldDark);
  doc.roundedRect(kpi3X, currentY, kpiW, kpiH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.emeraldDark);
  const returningCount = report.summary?.totalReturningKids ?? Math.max(0, (report.summary?.totalKids ?? 0) - newKidsCount);
  const returningPct = Math.round((returningCount / totalKidsCount) * 100);
  doc.text('RECURRENTES', kpi3X + 3, currentY + 4.5);
  doc.setFontSize(14);
  doc.text(`${returningCount}`, kpi3X + 3, currentY + 12.5);
  doc.setFontSize(7.5);
  doc.text(`(${returningPct}%)`, kpi3X + 16, currentY + 12.5);

  // KPI 4: Salón con mayor afluencia
  const kpi4X = marginX + (kpiW + 3) * 3;
  const topGroup = [...(report.summary?.byKidGroup || [])].sort((a, b) => b.count - a.count)[0];
  doc.setFillColor(...COLORS.bgSoft);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(kpi4X, currentY, kpiW, kpiH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('+ CONCURRIDO', kpi4X + 3, currentY + 4.5);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textDark);
  doc.text(topGroup ? toTitleCase(topGroup.groupName) : 'N/A', kpi4X + 3, currentY + 9.5);
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.primary);
  const topPct = topGroup ? (topGroup.percentage || Math.round((topGroup.count / totalKidsCount) * 100)) : 0;
  doc.text(topGroup ? `${topGroup.count} niños (${topPct}%)` : '', kpi4X + 3, currentY + 13.5);

  currentY += kpiH + 6;

  // --- SECCIÓN 2: ANÁLISIS ESTADÍSTICO ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.textDark);
  doc.text('ANALISIS ESTADISTICO Y DISTRIBUCION', marginX, currentY);
  currentY += 4;

  const sectionBoxY = currentY;
  // Increased height to 66 to give comfortable space to the 8 time slots and versus bar
  const sectionBoxH = 66;
  doc.setFillColor(...COLORS.bgSoft);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(marginX, sectionBoxY, contentWidth, sectionBoxH, 2, 2, 'FD');

  const halfW = (contentWidth - 6) / 2;

  // [A] Distribución por Salón (Ordenado de MENOR A MAYOR EDAD)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text('DISTRIBUCION POR SALON (MENOR A MAYOR EDAD)', marginX + 4, sectionBoxY + 5);

  const rawGroups = report.summary?.byKidGroup || [];
  // Sort classrooms by age ascending (menor a mayor edad)
  const groups = [...rawGroups].sort((a, b) => getGroupAgeRank(a.groupName) - getGroupAgeRank(b.groupName));

  const maxGroupCount = Math.max(...groups.map((g) => g.count), 1);
  const maxBarW = halfW - 52;
  let barY = sectionBoxY + 9;

  groups.slice(0, 8).forEach((group) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.textDark);
    const gName = group.groupName.length > 13
      ? toTitleCase(group.groupName.substring(0, 12)) + '.'
      : toTitleCase(group.groupName);
    doc.text(gName, marginX + 4, barY + 2.5);

    const barW = Math.max(2, (group.count / maxGroupCount) * maxBarW);
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(marginX + 28, barY, barW, 3.2, 0.8, 0.8, 'F');

    const groupPct = group.percentage || Math.round((group.count / totalKidsCount) * 100);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(`${group.count} (${groupPct}%)`, marginX + 28 + barW + 2, barY + 2.5);

    barY += 5.2;
  });

  // [B] Género — barra versus horizontal
  const rightColX = marginX + halfW + 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text('GENERO: VERSUS', rightColX, sectionBoxY + 5);

  const maleStat = report.summary?.byGender?.find((g) => g.gender === 'M' || g.label.toLowerCase().includes('masc')) || { count: 0, percentage: 0 };
  const femaleStat = report.summary?.byGender?.find((g) => g.gender === 'F' || g.label.toLowerCase().includes('fem')) || { count: 0, percentage: 0 };

  const mCount = maleStat.count;
  const fCount = femaleStat.count;
  const totalGen = mCount + fCount || 1;
  const mPct = maleStat.percentage || Math.round((mCount / totalGen) * 100);
  const fPct = femaleStat.percentage || Math.round((fCount / totalGen) * 100);

  const versusBarY = sectionBoxY + 8.5;
  const versusBarH = 6.5;
  const versusBarW = halfW - 6;
  const mBarW = Math.max(0, (mPct / 100) * versusBarW);
  const fBarW = Math.max(0, versusBarW - mBarW);

  // Blue (male) segment
  if (mBarW > 0) {
    doc.setFillColor(...COLORS.secondaryBlue);
    doc.roundedRect(rightColX, versusBarY, mBarW, versusBarH, 1.5, 1.5, 'F');
  }
  // Fill seam between segments
  if (mBarW > 2 && fBarW > 2) {
    doc.setFillColor(...COLORS.secondaryBlue);
    doc.rect(rightColX + mBarW - 2, versusBarY, 2, versusBarH, 'F');
  }
  // Pink (female) segment
  if (fBarW > 0) {
    doc.setFillColor(...COLORS.secondaryPink);
    doc.roundedRect(rightColX + mBarW, versusBarY, fBarW, versusBarH, 1.5, 1.5, 'F');
  }
  if (mBarW > 2 && fBarW > 2) {
    doc.setFillColor(...COLORS.secondaryPink);
    doc.rect(rightColX + mBarW, versusBarY, 2, versusBarH, 'F');
  }

  // Labels below versus bar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.secondaryBlue);
  doc.text(`Masculino: ${mCount} (${mPct}%)`, rightColX, versusBarY + versusBarH + 3.8);
  doc.setTextColor(...COLORS.secondaryPink);
  const femLabelX = rightColX + Math.max(mBarW, versusBarW / 2);
  doc.text(`Femenino: ${fCount} (${fPct}%)`, femLabelX, versusBarY + versusBarH + 3.8);

  // [C] Picos de Ingreso — Fixed gap and improved bar proportions
  const slotsY = sectionBoxY + 23.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text('PICOS DE INGRESO (CHECK-IN)', rightColX, slotsY);

  const slots = report.summary?.checkInTimeSlots || [];
  const maxSlotCount = Math.max(...slots.map((s) => s.count), 1);
  let slotItemY = slotsY + 4;
  const maxSlotBarW = halfW - 32;

  slots.slice(0, 8).forEach((slot) => {
    const slotLabel12h = to12h(slot.slot);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.textDark);
    doc.text(slotLabel12h, rightColX, slotItemY + 2.3);

    // Bar starts right after label at rightColX + 21 to remove awkward gap
    const sBarW = Math.max(2, (slot.count / maxSlotCount) * maxSlotBarW);
    doc.setFillColor(168, 85, 247);
    doc.roundedRect(rightColX + 21, slotItemY, sBarW, 2.8, 0.6, 0.6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(`${slot.count}`, rightColX + 21 + sBarW + 1.5, slotItemY + 2.3);

    slotItemY += 4.5;
  });

  currentY = sectionBoxY + sectionBoxH + 6;

  // --- SECCIÓN 3: LISTADO NOMINAL DETALLADO DE ASISTENCIA ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.textDark);
  doc.text('LISTADO DETALLADO DE ASISTENCIA POR SALON', marginX, currentY);
  currentY += 2;

  // Group attendees by salon
  const attendeesByGroup: Record<string, typeof report.attendees> = {};
  (report.attendees || []).forEach((att) => {
    const gName = att.group?.name || 'General';
    if (!attendeesByGroup[gName]) attendeesByGroup[gName] = [];
    attendeesByGroup[gName].push(att);
  });

  const tableRows: Array<any> = [];
  let globalIndex = 1;

  // Sort group names by age ascending (menor a mayor edad)
  const groupNames = Object.keys(attendeesByGroup).sort(
    (a, b) => getGroupAgeRank(a, attendeesByGroup[a]) - getGroupAgeRank(b, attendeesByGroup[b])
  );

  if (groupNames.length === 0) {
    tableRows.push(['-', '-', 'No se encontraron registros.', '-', '-', '-']);
  } else {
    groupNames.forEach((gName) => {
      const kidsInGroup = attendeesByGroup[gName];
      tableRows.push([
        {
          content: `  Salon: ${toTitleCase(gName)}  (${kidsInGroup.length} ${kidsInGroup.length === 1 ? 'niño' : 'niños'})`,
          colSpan: 6,
          styles: {
            fillColor: [237, 233, 254],
            textColor: COLORS.primaryDark,
            fontStyle: 'bold',
            fontSize: 7.5,
          },
        },
      ]);

      kidsInGroup.forEach((att) => {
        const checkIn = att.checkInTimeFormatted || (att.checkInTime ? dayjs(att.checkInTime).format('hh:mm A') : '-');

        // Name in Title Case; append (Nuevo) in amber for new kids, no label or color for regular kids
        const rawKidName = `${att.kid.firstName || ''} ${att.kid.lastName || ''}`.trim();
        const kidName = toTitleCase(rawKidName);
        const kidNameDisplay = att.kid.isFirstTime ? `${kidName} (Nuevo)` : kidName;

        // Age in full "años" / "meses", and Gender in full "Femenino" / "Masculino"
        const ageLabel = formatAge(att.kid.age, att.kid.birthday);
        const genderLabel = att.kid.gender === 'M' ? 'Masculino' : att.kid.gender === 'F' ? 'Femenino' : att.kid.gender;
        const ageGender = `${ageLabel}\n${genderLabel}`;

        // Phone with dial code
        const phone = formatPhone(att.guardian?.phone || '', att.guardian?.dialCodePhone);

        const guardianName = toTitleCase(att.guardian?.fullName || '-');
        const guardianRelation = att.guardian?.relation ? ` (${toTitleCase(att.guardian.relation)})` : '';
        const guardianInfo = `${guardianName}${guardianRelation}`;

        tableRows.push([
          String(globalIndex++),
          checkIn,
          kidNameDisplay,
          ageGender,
          guardianInfo,
          phone,
        ]);
      });
    });
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX, bottom: 16 },
    head: [['#', 'Ingreso', 'Nombre del Nino(a)', 'Edad / Genero', 'Acudiente', 'Telefono']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: COLORS.textDark,
      cellPadding: 2,
      minCellHeight: 8,
    },
    alternateRowStyles: {
      fillColor: COLORS.bgSoft,
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 54 },
      3: { cellWidth: 28, halign: 'center' },
      4: { cellWidth: 44 },
      5: { cellWidth: 31 },
    },
    didParseCell: (data) => {
      // Highlight new kids with "(Nuevo)" in amber and bold, regular kids keep standard styling
      if (data.column.index === 2 && typeof data.cell.raw === 'string' && data.cell.raw.includes('(Nuevo)')) {
        data.cell.styles.textColor = COLORS.amberDark;
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.column.index === 3) {
        data.cell.styles.halign = 'center';
      }
    },
  });

  // Get Y after table
  let finalY = (doc as any).lastAutoTable.finalY + 6;

  // --- SECCIÓN 4: ALERTAS MÉDICAS ---
  const medicalAlerts = report.medicalAlerts || [];
  if (medicalAlerts.length > 0) {
    if (finalY > pageHeight - 45) {
      doc.addPage();
      finalY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.redDark);
    doc.text(
      `ALERTAS MEDICAS Y CUIDADOS ESPECIALES (${medicalAlerts.length} ${medicalAlerts.length === 1 ? 'caso' : 'casos'})`,
      marginX,
      finalY
    );
    finalY += 3;

    const alertRows = medicalAlerts.map((al) => [
      toTitleCase(al.groupName || 'General'),
      toTitleCase(al.kidFullName || ''),
      al.conditionName,
      al.description || '-',
      `${toTitleCase(al.guardianName || '')} - ${formatPhone(al.guardianPhone || '')}`,
    ]);

    autoTable(doc, {
      startY: finalY,
      margin: { left: marginX, right: marginX, bottom: 16 },
      head: [['Salon', 'Nino(a)', 'Condicion', 'Descripcion / Cuidados', 'Contacto Emergencia']],
      body: alertRows,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.redDark,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      bodyStyles: {
        fontSize: 7,
        textColor: COLORS.textDark,
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: COLORS.redLight,
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 38 },
        2: { cellWidth: 32 },
        3: { cellWidth: 44 },
        4: { cellWidth: 46 },
      },
    });
  }

  // --- PIE DE PÁGINA (PAGINACIÓN CONTINUA) ---
  const totalPages = doc.getNumberOfPages();
  const nowFormatted = dayjs().format('DD/MM/YYYY hh:mm A');

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setDrawColor(...COLORS.border);
    doc.line(marginX, pageHeight - 10, pageWidth - marginX, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(`Iglekids Cloud  |  Generado el ${nowFormatted}`, marginX, pageHeight - 6);

    doc.setFont('helvetica', 'bold');
    doc.text(`Pagina ${i} de ${totalPages}`, pageWidth - marginX, pageHeight - 6, { align: 'right' });
  }

  // Sanitize filename
  const meetingSanitized = (report.metadata?.meeting?.name || 'Servicio').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = report.metadata?.reportDate || dayjs().format('YYYY-MM-DD');
  const filename = `${dateStr}-${meetingSanitized}-Asistencia-Iglekids.pdf`;

  doc.save(filename);
};
