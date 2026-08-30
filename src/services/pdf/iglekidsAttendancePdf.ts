import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { IAttendanceReportData } from '@/libs/models';

dayjs.locale('es');

/**
 * Palette colors for the Iglekids attendance report.
 */
const COLORS = {
  primary: [124, 58, 237] as [number, number, number], // #7C3AED (Violet)
  primaryDark: [91, 33, 182] as [number, number, number], // #5B21B6
  primaryLight: [237, 233, 254] as [number, number, number], // #EDE9FE
  secondaryPink: [236, 72, 153] as [number, number, number], // #EC4899
  secondaryBlue: [59, 130, 246] as [number, number, number], // #3B82F6
  amberDark: [180, 83, 9] as [number, number, number], // #B45309
  amberLight: [254, 243, 199] as [number, number, number], // #FEF3C7
  emeraldDark: [4, 120, 87] as [number, number, number], // #047857
  emeraldLight: [209, 250, 229] as [number, number, number], // #D1FAE5
  redDark: [185, 28, 28] as [number, number, number], // #B91C1C
  redLight: [254, 226, 226] as [number, number, number], // #FEE2E2
  textDark: [30, 41, 59] as [number, number, number], // #1E293B
  textMuted: [100, 116, 139] as [number, number, number], // #64748B
  border: [226, 232, 240] as [number, number, number], // #E2E8F0
  bgSoft: [248, 250, 252] as [number, number, number], // #F8FAFC
  white: [255, 255, 255] as [number, number, number],
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
  // Top brand bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // App / Brand Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.primary);
  doc.text('IGLEKIDS', marginX, currentY);

  // Church Name (Prominent)
  const churchName = report.metadata?.church?.name || 'Comunidad Cristiana';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.textDark);
  doc.text(churchName.toUpperCase(), marginX + 34, currentY);

  // Document Type subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Informe Oficial de Asistencia y Métricas de Servicio', marginX + 34, currentY + 4.5);

  currentY += 10;

  // --- BANNER DESTACADO DEL SERVICIO ---
  const bannerY = currentY;
  const bannerHeight = 18;

  // Background Box
  doc.setFillColor(...COLORS.bgSoft);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(marginX, bannerY, contentWidth, bannerHeight, 2, 2, 'FD');

  // Left accent border line
  doc.setFillColor(...COLORS.primary);
  doc.rect(marginX, bannerY, 2.5, bannerHeight, 'F');

  const colW = contentWidth / 4;

  // Sede
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('SEDE', marginX + 6, bannerY + 5.5);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textDark);
  const campusName = report.metadata?.campus?.name || 'Sede Principal';
  doc.text(doc.splitTextToSize(campusName, colW - 8)[0] || '', marginX + 6, bannerY + 11);

  // Servicio
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('SERVICIO', marginX + colW + 2, bannerY + 5.5);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textDark);
  const meetingName = report.metadata?.meeting?.name || 'Servicio General';
  doc.text(doc.splitTextToSize(meetingName, colW - 6)[0] || '', marginX + colW + 2, bannerY + 11);

  // DÍA (SUPER DESTACADO)
  const dayBoxX = marginX + colW * 2 + 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('DÍA DEL SERVICIO', dayBoxX, bannerY + 5.5);

  const dayLabel = (report.metadata?.dayName || report.metadata?.meeting?.day || 'DOMINGO').toUpperCase();
  // Highlight Badge for Day
  doc.setFillColor(...COLORS.primaryLight);
  doc.setDrawColor(...COLORS.primary);
  doc.roundedRect(dayBoxX, bannerY + 7.5, 30, 7.5, 1.5, 1.5, 'FD');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text(`★ ${dayLabel}`, dayBoxX + 3.5, bannerY + 12.5);

  // Fecha
  const dateBoxX = marginX + colW * 3 + 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('FECHA', dateBoxX, bannerY + 5.5);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textDark);
  const dateFormatted = report.metadata?.reportDate
    ? dayjs(report.metadata.reportDate).format('DD [de] MMMM, YYYY')
    : dayjs().format('DD [de] MMMM, YYYY');
  doc.text(dateFormatted, dateBoxX, bannerY + 11);

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
  doc.text('NUEVOS (1ª VEZ)', kpi2X + 3, currentY + 4.5);
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
  doc.roundedRect(kpi44X(marginX, kpiW), currentY, kpiW, kpiH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('SALÓN PRINCIPAL', kpi4X + 3, currentY + 4.5);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textDark);
  doc.text(topGroup ? topGroup.groupName : 'N/A', kpi4X + 3, currentY + 9.5);
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.primary);
  doc.text(topGroup ? `${topGroup.count} niños (${topGroup.percentage || Math.round((topGroup.count / totalKidsCount) * 100)}%)` : '', kpi4X + 3, currentY + 13.5);

  currentY += kpiH + 6;

  // --- SECCIÓN 2: ANÁLISIS VISUAL Y MÉTRICAS ESTADÍSTICAS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.textDark);
  doc.text('ANÁLISIS ESTADÍSTICO Y DISTRIBUCIÓN', marginX, currentY);
  currentY += 4;

  const sectionBoxY = currentY;
  const sectionBoxH = 46;
  doc.setFillColor(...COLORS.bgSoft);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(marginX, sectionBoxY, contentWidth, sectionBoxH, 2, 2, 'FD');

  const halfW = (contentWidth - 6) / 2;

  // [A] Distribución por Salón (Barras Horizontales)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text('DISTRIBUCIÓN POR SALÓN', marginX + 4, sectionBoxY + 5);

  const groups = report.summary?.byKidGroup || [];
  const maxGroupCount = Math.max(...groups.map((g) => g.count), 1);
  const maxBarW = halfW - 48;
  let barY = sectionBoxY + 8.5;

  groups.slice(0, 7).forEach((group) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textDark);
    const gName = group.groupName.length > 14 ? group.groupName.substring(0, 13) + '…' : group.groupName;
    doc.text(gName, marginX + 4, barY + 2.5);

    const barW = Math.max(2, (group.count / maxGroupCount) * maxBarW);
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(marginX + 28, barY, barW, 3.2, 0.8, 0.8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(`${group.count}`, marginX + 28 + barW + 2, barY + 2.5);

    barY += 4.8;
  });

  // [B] Género y [C] Picos de Llegada (Lado Derecho)
  const rightColX = marginX + halfW + 3;

  // Género
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text('DISTRIBUCIÓN POR GÉNERO', rightColX, sectionBoxY + 5);

  const maleStat = report.summary?.byGender?.find((g) => g.gender === 'M' || g.label.toLowerCase().includes('masc')) || { count: 0, percentage: 0 };
  const femaleStat = report.summary?.byGender?.find((g) => g.gender === 'F' || g.label.toLowerCase().includes('fem')) || { count: 0, percentage: 0 };

  const mCount = maleStat.count;
  const fCount = femaleStat.count;
  const totalGen = mCount + fCount || 1;
  const mPct = maleStat.percentage || Math.round((mCount / totalGen) * 100);
  const fPct = femaleStat.percentage || Math.round((fCount / totalGen) * 100);

  // Mini badges género
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(...COLORS.secondaryBlue);
  doc.roundedRect(rightColX, sectionBoxY + 7.5, (halfW - 6) / 2, 8.5, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.secondaryBlue);
  doc.text(`Masculino: ${mCount} (${mPct}%)`, rightColX + 2.5, sectionBoxY + 13);

  const femaleBoxX = rightColX + (halfW - 6) / 2 + 3;
  doc.setFillColor(253, 242, 248);
  doc.setDrawColor(...COLORS.secondaryPink);
  doc.roundedRect(femaleBoxX, sectionBoxY + 7.5, (halfW - 6) / 2, 8.5, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.secondaryPink);
  doc.text(`Femenino: ${fCount} (${fPct}%)`, femaleBoxX + 2.5, sectionBoxY + 13);

  // [C] Picos de Horario de Ingreso (Histograma rápido)
  const slotsY = sectionBoxY + 19;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text('PICOS DE INGRESO (CHECK-IN POR HORARIO)', rightColX, slotsY);

  const slots = report.summary?.checkInTimeSlots || [];
  const maxSlotCount = Math.max(...slots.map((s) => s.count), 1);
  let slotItemY = slotsY + 3.5;

  slots.slice(0, 4).forEach((slot) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.textDark);
    doc.text(slot.slot, rightColX, slotItemY + 2.5);

    const sBarW = Math.max(2, (slot.count / maxSlotCount) * (halfW - 38));
    doc.setFillColor(168, 85, 247);
    doc.roundedRect(rightColX + 24, slotItemY, sBarW, 3, 0.8, 0.8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(`${slot.count}`, rightColX + 24 + sBarW + 2, slotItemY + 2.5);

    slotItemY += 4.6;
  });

  currentY = sectionBoxY + sectionBoxH + 6;

  // --- SECCIÓN 3: LISTADO NOMINAL DETALLADO DE ASISTENCIA ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.textDark);
  doc.text('LISTADO DETALLADO DE ASISTENCIA POR SALÓN', marginX, currentY);
  currentY += 2;

  // Format attendees into autoTable rows grouped by salon
  const tableRows: Array<any> = [];

  // Group attendees by salon
  const attendeesByGroup: Record<string, typeof report.attendees> = {};
  (report.attendees || []).forEach((att) => {
    const gName = att.group?.name || 'General';
    if (!attendeesByGroup[gName]) {
      attendeesByGroup[gName] = [];
    }
    attendeesByGroup[gName].push(att);
  });

  let globalIndex = 1;
  const groupNames = Object.keys(attendeesByGroup);

  if (groupNames.length === 0) {
    tableRows.push(['-', '-', 'No se encontraron niños registrados en este servicio.', '-', '-', '-', '-']);
  } else {
    groupNames.forEach((gName) => {
      const kidsInGroup = attendeesByGroup[gName];
      // Section header row for group
      tableRows.push([
        {
          content: `■ SALÓN: ${gName.toUpperCase()} (${kidsInGroup.length} ${kidsInGroup.length === 1 ? 'niño' : 'niños'})`,
          colSpan: 7,
          styles: {
            fillColor: [243, 244, 246],
            textColor: COLORS.primaryDark,
            fontStyle: 'bold',
            fontSize: 7.5,
          },
        },
      ]);

      kidsInGroup.forEach((att) => {
        const checkIn = att.checkInTimeFormatted || (att.checkInTime ? dayjs(att.checkInTime).format('hh:mm A') : '-');
        const kidName = `${att.kid.firstName} ${att.kid.lastName}`.trim();
        const ageGender = `${att.kid.age || '-'}a (${att.kid.gender || '-'})`;
        const stateBadge = att.kid.isFirstTime ? '★ Nuevo' : 'Recurrente';
        const guardianInfo = `${att.guardian?.fullName || '-'}${att.guardian?.relation ? ` (${att.guardian.relation})` : ''}`;
        const phone = att.guardian?.phone || '-';
        const hasAlert = att.medicalCondition?.hasCondition;
        const notes = hasAlert
          ? `⚠ ${att.medicalCondition?.name || 'Condición Médica'}`
          : (att.observations || '-');

        tableRows.push([
          String(globalIndex++),
          checkIn,
          kidName,
          ageGender,
          stateBadge,
          guardianInfo,
          phone,
        ]);
      });
    });
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX, bottom: 16 },
    head: [['#', 'Ingreso', 'Nombre del Niño(a)', 'Edad / Gén', 'Tipo', 'Acudiente', 'Teléfono']],
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
      cellPadding: 1.8,
    },
    alternateRowStyles: {
      fillColor: COLORS.bgSoft,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 42 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 50 },
      6: { cellWidth: 30 },
    },
    didParseCell: (data) => {
      // Highlight "Nuevo" badge in amber
      if (data.column.index === 4 && typeof data.cell.raw === 'string' && data.cell.raw.includes('Nuevo')) {
        data.cell.styles.textColor = COLORS.amberDark;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // Get Y after table
  let finalY = (doc as any).lastAutoTable.finalY + 6;

  // --- SECCIÓN 4: RESUMEN DE ALERTAS MÉDICAS Y CUIDADOS ESPECIALES ---
  const medicalAlerts = report.medicalAlerts || [];
  if (medicalAlerts.length > 0) {
    // Check if we need a page break
    if (finalY > pageHeight - 45) {
      doc.addPage();
      finalY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.redDark);
    doc.text(`ALERTAS MÉDICAS Y CUIDADOS ESPECIALES (${medicalAlerts.length} ${medicalAlerts.length === 1 ? 'caso' : 'casos'})`, marginX, finalY);
    finalY += 3;

    const alertRows = medicalAlerts.map((al) => [
      al.groupName || 'General',
      al.kidFullName,
      al.conditionName,
      al.description || '-',
      `${al.guardianName || ''} (${al.guardianPhone || ''})`,
    ]);

    autoTable(doc, {
      startY: finalY,
      margin: { left: marginX, right: marginX, bottom: 16 },
      head: [['Salón', 'Niño(a)', 'Condición / Alergia', 'Descripción / Cuidados', 'Contacto de Emergencia']],
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
        0: { cellWidth: 24 },
        1: { cellWidth: 36 },
        2: { cellWidth: 36 },
        3: { cellWidth: 42 },
        4: { cellWidth: 44 },
      },
    });
  }

  // --- PIE DE PÁGINA TÉCNICO (PAGINACIÓN CONTINUA) ---
  const totalPages = doc.getNumberOfPages();
  const nowFormatted = dayjs().format('DD/MM/YYYY hh:mm A');

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Subtle footer separator
    doc.setDrawColor(...COLORS.border);
    doc.line(marginX, pageHeight - 10, pageWidth - marginX, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(
      `Iglekids Cloud • Generado el ${nowFormatted}`,
      marginX,
      pageHeight - 6
    );

    doc.setFont('helvetica', 'bold');
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 6,
      { align: 'right' }
    );
  }

  // Sanitize filename
  const meetingSanitized = (report.metadata?.meeting?.name || 'Servicio').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = report.metadata?.reportDate || dayjs().format('YYYY-MM-DD');
  const filename = `${dateStr}-${meetingSanitized}-Asistencia-Iglekids.pdf`;

  // Download directly
  doc.save(filename);
};

/** Helper to compute 4th KPI X position cleanly */
function kpi44X(marginX: number, kpiW: number): number {
  return marginX + (kpiW + 3) * 3;
}
