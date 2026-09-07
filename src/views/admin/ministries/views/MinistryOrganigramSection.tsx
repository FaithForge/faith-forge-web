import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Crown,
  Layers,
  Users,
  ShieldCheck,
  Download,
  AlertCircle,
  BarChart3,
  Network,
  Sparkles,
  Loader2,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import SelectSearch from '@/components/ui/SelectSearch';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import {
  GetMinistryAreas,
  GetMinistryGroupConfigs,
  GetServiceAreaGroups,
} from '@/libs/state/redux/thunks/church/ministry.thunk';
import {
  GetVolunteerAssignments,
  GetVolunteers,
} from '@/libs/state/redux/thunks/church/volunteer.thunk';
import { IMinistry, IServiceAreaGroup, IVolunteerAssignment, VolunteerRole } from '@/libs/models';
import { capitalizeWords } from '@/libs/utils/text';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import clsx from 'clsx';

/**
 * Masks a national ID string to protect sensitive personal data.
 * Keeps only the last 4 characters visible, e.g. "1047480449" -> "••••••0449".
 *
 * @param {string} [id] - The raw national ID.
 * @returns {string} The masked ID or '-' if empty.
 */
const maskNationalId = (id?: string): string => {
  if (!id || id.trim() === '' || id.trim() === '-') return '-';
  const clean = id.trim();
  if (clean.length <= 4) return '••••';
  return '••••••' + clean.slice(-4);
};

/**
 * Masks a phone number to protect privacy.
 * Keeps only the last 4 digits visible, e.g. "3057322009" -> "••••••2009".
 *
 * @param {string} [phone] - The raw phone number.
 * @returns {string} The masked phone or '-' if empty.
 */
const maskPhone = (phone?: string): string => {
  if (!phone || phone.trim() === '' || phone.trim() === '-') return '-';
  const clean = phone.trim();
  if (clean.length <= 4) return '••••';
  return '••••••' + clean.slice(-4);
};

interface MinistryOrganigramSectionProps {
  ministryId: string;
  churchCampusId?: string;
  ministry?: IMinistry;
}

type CoverageFilter = 'ALL' | 'COVERED' | 'UNCOVERED';

/**
 * Interactive Organigram and Analytics section with dynamic filtering and executive PDF generation.
 * Supports filtering by Area, Grupo, and Supervision status, updating both the visual architecture
 * and the exported PDF report in real-time.
 *
 * @param {MinistryOrganigramSectionProps} props - Component properties.
 * @returns {JSX.Element} Rendered organigram view.
 */
export const MinistryOrganigramSection: React.FC<MinistryOrganigramSectionProps> = ({
  ministryId,
  churchCampusId,
  ministry,
}) => {
  const dispatch = useAppDispatch();

  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'organigram' | 'analytics'>('organigram');

  // Filters (User requirement: "que el reporte se pueda generar filtrando")
  const [filterAreaId, setFilterAreaId] = useState<string>('ALL');
  const [filterGroupId, setFilterGroupId] = useState<string>('ALL');
  const [filterCoverage, setFilterCoverage] = useState<CoverageFilter>('ALL');
  // Privacy mode: mask sensitive data (cédula and phone)
  const [maskSensitiveData, setMaskSensitiveData] = useState<boolean>(true);

  const campuses = useAppSelector((state) => state.churchCampusSlice.data);
  const { areasByMinistry, groupsByMinistry, serviceAreaGroups } = useAppSelector(
    (state) => state.ministrySlice,
  );
  const { assignments, assignmentsByPartition, volunteers: { data: volunteersList } } =
    useAppSelector((state) => state.volunteerSlice);

  // Load structure and assignments on mount to ensure 0-equipos bug is completely avoided
  useEffect(() => {
    if (ministryId) {
      dispatch(GetMinistryAreas({ ministryId, force: false }));
      dispatch(GetMinistryGroupConfigs({ ministryId, force: false }));
      dispatch(GetServiceAreaGroups({ ministryId }));
      dispatch(GetVolunteerAssignments({ ministryId, limit: 500, force: false }));
      dispatch(GetVolunteers({ ministryId, limit: 500, force: false }));
    }
  }, [dispatch, ministryId]);

  const areas = areasByMinistry[ministryId] || [];
  const groups = useMemo(() => {
    return [...(groupsByMinistry[ministryId] || [])].sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
    );
  }, [groupsByMinistry, ministryId]);

  const campusName = useMemo(() => {
    if (ministry?.churchCampus?.name) return ministry.churchCampus.name;
    const cId = churchCampusId || ministry?.churchCampusId;
    return campuses.find((c) => c.id === cId)?.name || 'Sede Principal';
  }, [ministry, churchCampusId, campuses]);

  // Combined assignments
  const allAssignments = useMemo(() => {
    const campusTeamsKey = `campus_teams_${ministryId}_${churchCampusId || ''}`;
    const ministryCoordsKey = `ministry_coords_${ministryId}`;
    const areaCoordsKey = `area_coords_${ministryId}`;
    const groupCoordsKey = `group_coords_${ministryId}`;

    const partList = [
      ...(assignmentsByPartition[ministryCoordsKey] || []),
      ...(assignmentsByPartition[areaCoordsKey] || []),
      ...(assignmentsByPartition[groupCoordsKey] || []),
      ...(assignmentsByPartition[campusTeamsKey] || []),
    ];

    if (partList.length > 0) return partList;
    return assignments;
  }, [assignmentsByPartition, ministryId, churchCampusId, assignments]);

  const getVolunteerDetails = useCallback(
    (asg: IVolunteerAssignment, mask: boolean = false) => {
      const vId = asg.volunteerId || asg.ministryVolunteerId;
      const vol =
        asg.volunteer ||
        asg.ministryVolunteer ||
        volunteersList.find((v) => v.id === vId || (v.userId && v.userId === asg.volunteer?.userId));
      const user = asg.volunteer?.user || vol?.user || asg.user;
      const rawName = user && (user.firstName || user.lastName)
        ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
        : 'Servidor';
      const rawId = user?.nationalId || '-';
      const rawPhone = user?.phone || '-';
      return {
        name: capitalizeWords(rawName),
        nationalId: mask ? maskNationalId(rawId) : rawId,
        phone: mask ? maskPhone(rawPhone) : rawPhone,
        rawNationalId: rawId,
        rawPhone,
      };
    },
    [volunteersList],
  );

  // 1. Coordinadores Generales
  const generalCoordinators = useMemo(() => {
    return allAssignments.filter((a) => a.role === VolunteerRole.MINISTRY_GENERAL_COORDINATOR);
  }, [allAssignments]);

  // 2. Coordinadores de Área
  const areaCoordinators = useMemo(() => {
    return allAssignments.filter((a) => a.role === VolunteerRole.AREA_GENERAL_COORDINATOR);
  }, [allAssignments]);

  // 3. Coordinadores de Grupo
  const groupCoordinators = useMemo(() => {
    return allAssignments.filter((a) => a.role === VolunteerRole.GROUP_COORDINATOR);
  }, [allAssignments]);

  // 4. Teams (Filtered by Area and/or Group and/or Coverage)
  const filteredCampusTeams = useMemo(() => {
    const areaIds = new Set(areas.map((a) => a.id));
    return serviceAreaGroups.filter((sag) => {
      // Must belong to this ministry's areas
      if (!areaIds.has(sag.ministryAreaId)) return false;

      // Filter by Area
      if (filterAreaId !== 'ALL' && sag.ministryAreaId !== filterAreaId) return false;

      // Filter by Group
      if (filterGroupId !== 'ALL' && sag.ministryGroupConfigId !== filterGroupId) return false;

      // Filter by Coverage status
      if (filterCoverage !== 'ALL') {
        const hasSup = allAssignments.some(
          (a) => a.serviceAreaGroupId === sag.id && a.role === VolunteerRole.SUPERVISOR,
        );
        if (filterCoverage === 'COVERED' && !hasSup) return false;
        if (filterCoverage === 'UNCOVERED' && hasSup) return false;
      }

      return true;
    });
  }, [serviceAreaGroups, areas, filterAreaId, filterGroupId, filterCoverage, allAssignments]);

  // Filter options for Area
  const areaOptions = useMemo(() => {
    return [
      { id: 'ALL', name: `Todas las Áreas (${areas.length})` },
      ...areas.map((a) => ({ id: a.id, name: a.name })),
    ];
  }, [areas]);

  // Filter options for Grupo
  const groupOptions = useMemo(() => {
    return [
      { id: 'ALL', name: `Todos los Grupos (${groups.length})` },
      ...groups.map((g) => ({ id: g.id, name: g.name })),
    ];
  }, [groups]);

  // Filter options for Coverage
  const coverageOptions = [
    { id: 'ALL', name: 'Todos los Equipos' },
    { id: 'COVERED', name: 'Solo con Supervisor' },
    { id: 'UNCOVERED', name: 'Sin Supervisor (Pendientes)' },
  ];

  // Active filter label for badges and report title
  const activeFilterTitle = useMemo(() => {
    const parts: string[] = [];
    if (filterAreaId !== 'ALL') {
      const a = areas.find((ar) => ar.id === filterAreaId);
      if (a) parts.push(`Área: ${a.name}`);
    }
    if (filterGroupId !== 'ALL') {
      const g = groups.find((gr) => gr.id === filterGroupId);
      if (g) parts.push(`Grupo: ${g.name}`);
    }
    if (filterCoverage === 'COVERED') parts.push('Con Supervisor');
    if (filterCoverage === 'UNCOVERED') parts.push('Sin Supervisor');
    return parts.length > 0 ? parts.join(' • ') : 'General (Sin Filtros)';
  }, [filterAreaId, filterGroupId, filterCoverage, areas, groups]);

  // Group filtered teams by Area for the organigram cards
  const organigramAreas = useMemo(() => {
    const targetAreas = filterAreaId !== 'ALL'
      ? areas.filter((a) => a.id === filterAreaId)
      : areas;

    return targetAreas.map((area) => {
      const areaTeams = filteredCampusTeams.filter((t) => t.ministryAreaId === area.id);
      const coords = areaCoordinators.filter((c) => c.ministryAreaId === area.id);

      // Teams with supervisor and volunteers breakdown
      const teamsWithDetails = areaTeams.map((team) => {
        const group = groups.find((g) => g.id === team.ministryGroupConfigId);
        const teamAsgs = allAssignments.filter((a) => a.serviceAreaGroupId === team.id);
        const sups = teamAsgs.filter((a) => a.role === VolunteerRole.SUPERVISOR);
        const vols = teamAsgs.filter((a) => a.role === VolunteerRole.VOLUNTEER);

        return {
          team,
          group,
          supervisors: sups,
          volunteers: vols,
          totalCount: teamAsgs.length,
          hasSupervisor: sups.length > 0,
        };
      });

      return {
        area,
        coordinators: coords,
        teams: teamsWithDetails,
        totalTeams: teamsWithDetails.length,
        coveredTeams: teamsWithDetails.filter((t) => t.hasSupervisor).length,
      };
    }).filter((a) => (filterAreaId !== 'ALL' || a.totalTeams > 0));
  }, [areas, filterAreaId, filteredCampusTeams, areaCoordinators, groups, allAssignments]);

  // Executive KPIs based on active filter
  const kpiStats = useMemo(() => {
    const teamIds = new Set(filteredCampusTeams.map((t) => t.id));
    const filteredAsgs = allAssignments.filter(
      (a) => a.serviceAreaGroupId && teamIds.has(a.serviceAreaGroupId),
    );

    const sups = filteredAsgs.filter((a) => a.role === VolunteerRole.SUPERVISOR);
    const vols = filteredAsgs.filter((a) => a.role === VolunteerRole.VOLUNTEER);

    const coveredCount = filteredCampusTeams.filter((team) =>
      sups.some((s) => s.serviceAreaGroupId === team.id),
    ).length;

    const coveragePct = filteredCampusTeams.length > 0
      ? Math.round((coveredCount / filteredCampusTeams.length) * 100)
      : 100;

    return {
      totalTeams: filteredCampusTeams.length,
      coveredTeams: coveredCount,
      coveragePct,
      supervisorsCount: sups.length,
      volunteersCount: vols.length,
      totalMembersCount: filteredAsgs.length,
    };
  }, [filteredCampusTeams, allAssignments]);

  /**
   * Generates a fully filtered executive PDF report with visual statistics, KPI cards,
   * detailed group member listings with supervisors first, and optional privacy masking.
   */
  const handleExportPDF = () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo
      const darkColor: [number, number, number] = [30, 41, 59];
      const dateStr = new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const marginX = 14;
      const contentWidth = 210 - marginX * 2; // 182 mm

      // --- HEADER ---
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('IGLEKIDS • REPORTE OFICIAL DE ESTRUCTURA Y ORGANIGRAMA', marginX, 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(
        `Ministerio: ${ministry?.name || 'Iglekids'} | Sede: ${campusName} | Filtro: ${activeFilterTitle}`,
        marginX,
        17,
      );
      doc.text(`Generado: ${dateStr}`, 152, 17);

      if (maskSensitiveData) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(224, 231, 255); // Indigo-100
        doc.text('[DATOS SENSIBLES ENMASCARADOS - CÉDULA Y TELÉFONO PROTEGIDOS]', marginX, 22.5);
      }

      let currentY = 32.5;

      // --- 1. RESUMEN EJECUTIVO Y ANÁLISIS ESTADÍSTICO (VISUAL) ---
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('1. RESUMEN EJECUTIVO Y ANÁLISIS ESTADÍSTICO', marginX, currentY);
      currentY += 4;

      // 4 KPI Cards
      const cardGap = 3;
      const cardW = (contentWidth - cardGap * 3) / 4; // ~43.25 mm
      const cardH = 16;

      // Card 1: Equipos Filtrados
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.roundedRect(marginX, currentY, cardW, cardH, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text('EQUIPOS', marginX + 3, currentY + 4.5);
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text(String(kpiStats.totalTeams), marginX + 3, currentY + 10.5);
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`En ${organigramAreas.length} área(s)`, marginX + 3, currentY + 14);

      // Card 2: Supervisores (Líderes)
      const card2X = marginX + cardW + cardGap;
      doc.setFillColor(238, 242, 255); // indigo-50
      doc.setDrawColor(199, 210, 254); // indigo-200
      doc.roundedRect(card2X, currentY, cardW, cardH, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(67, 56, 202); // indigo-700
      doc.text('SUPERVISORES', card2X + 3, currentY + 4.5);
      doc.setFontSize(13);
      doc.text(String(kpiStats.supervisorsCount), card2X + 3, currentY + 10.5);
      doc.setFontSize(6);
      doc.setTextColor(99, 102, 241); // indigo-500
      doc.text('Líderes de equipo', card2X + 3, currentY + 14);

      // Card 3: Servidores Activos
      const card3X = marginX + (cardW + cardGap) * 2;
      doc.setFillColor(240, 253, 250); // teal-50
      doc.setDrawColor(153, 246, 228); // teal-200
      doc.roundedRect(card3X, currentY, cardW, cardH, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 118, 110); // teal-700
      doc.text('SERVIDORES', card3X + 3, currentY + 4.5);
      doc.setFontSize(13);
      doc.text(String(kpiStats.volunteersCount), card3X + 3, currentY + 10.5);
      doc.setFontSize(6);
      doc.setTextColor(20, 184, 166); // teal-500
      doc.text('Plantilla operativa', card3X + 3, currentY + 14);

      // Card 4: Total Personal
      const card4X = marginX + (cardW + cardGap) * 3;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(card4X, currentY, cardW, cardH, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text('TOTAL PERSONAL', card4X + 3, currentY + 4.5);
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(String(kpiStats.totalMembersCount), card4X + 3, currentY + 10.5);
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text('Miembros asignados', card4X + 3, currentY + 14);

      currentY += cardH + 3.5;

      // --- STATISTICAL CHARTS CONTAINER ---
      const chartsBoxY = currentY;
      const chartsBoxH = 24.5;
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(marginX, chartsBoxY, contentWidth, chartsBoxH, 2, 2, 'FD');

      const colWidth = (contentWidth - 6) / 2; // ~88 mm

      // --- CHART A: Tasa de Cobertura de Supervisores ---
      const chartAX = marginX + 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text('TASA DE COBERTURA DE SUPERVISIÓN', chartAX, chartsBoxY + 5.5);

      const covPct = kpiStats.coveragePct;
      const covColor: [number, number, number] =
        covPct >= 80 ? [5, 150, 105] : covPct >= 50 ? [217, 119, 6] : [225, 29, 72];
      doc.setFontSize(11.5);
      doc.setTextColor(covColor[0], covColor[1], covColor[2]);
      doc.text(`${covPct}%`, chartAX, chartsBoxY + 11.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `(${kpiStats.coveredTeams} de ${kpiStats.totalTeams || 1} equipos cubiertos con supervisor)`,
        chartAX + 15,
        chartsBoxY + 11.5,
      );

      // Visual Progress Bar for Coverage
      const barWMax = colWidth - 8;
      const barH = 4.2;
      const barY = chartsBoxY + 14.5;

      doc.setFillColor(226, 232, 240); // slate-200
      doc.roundedRect(chartAX, barY, barWMax, barH, 1.2, 1.2, 'F');

      const fillBarW = Math.max(1, (covPct / 100) * barWMax);
      doc.setFillColor(covColor[0], covColor[1], covColor[2]);
      doc.roundedRect(chartAX, barY, fillBarW, barH, 1.2, 1.2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(covColor[0], covColor[1], covColor[2]);
      const statusLabel =
        covPct === 100
          ? 'Cobertura total de supervisores (100%)'
          : covPct >= 50
          ? 'Cobertura parcial en equipos'
          : 'Cobertura critica: faltan supervisores';
      doc.text(statusLabel, chartAX, barY + barH + 3.2);

      // Vertical separator between chart A and B
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginX + colWidth + 3, chartsBoxY + 3, marginX + colWidth + 3, chartsBoxY + chartsBoxH - 3);

      // --- CHART B: Proporción Supervisores vs Servidores ---
      const chartBX = marginX + colWidth + 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text('DISTRIBUCIÓN DEL PERSONAL EN EQUIPOS', chartBX, chartsBoxY + 5.5);

      const totalStaff = kpiStats.totalMembersCount || 1;
      const supPct = Math.round((kpiStats.supervisorsCount / totalStaff) * 100);
      const volPct = Math.max(0, 100 - supPct);

      // Segmented Horizontal Bar
      const versusBarW = colWidth - 10;
      const versusBarH = 4.8;
      const versusBarY = chartsBoxY + 9;

      const supSegmentW = Math.max(0, (supPct / 100) * versusBarW);
      const volSegmentW = Math.max(0, versusBarW - supSegmentW);

      if (supSegmentW > 0) {
        doc.setFillColor(79, 70, 229); // indigo
        doc.roundedRect(chartBX, versusBarY, supSegmentW, versusBarH, 1.2, 1.2, 'F');
      }
      if (supSegmentW > 1.5 && volSegmentW > 1.5) {
        doc.setFillColor(79, 70, 229);
        doc.rect(chartBX + supSegmentW - 1.5, versusBarY, 1.5, versusBarH, 'F');
      }
      if (volSegmentW > 0) {
        doc.setFillColor(13, 148, 136); // teal
        doc.roundedRect(chartBX + supSegmentW, versusBarY, volSegmentW, versusBarH, 1.2, 1.2, 'F');
      }

      // Legend below the versus bar
      const legY = versusBarY + versusBarH + 4;
      doc.setFillColor(79, 70, 229);
      doc.circle(chartBX + 2, legY - 1, 1.3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(67, 56, 202);
      doc.text(`Supervisores: ${kpiStats.supervisorsCount} (${supPct}%)`, chartBX + 4.5, legY);

      const leg2X = chartBX + 40;
      doc.setFillColor(13, 148, 136);
      doc.circle(leg2X + 2, legY - 1, 1.3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 118, 110);
      doc.text(`Servidores: ${kpiStats.volunteersCount} (${volPct}%)`, leg2X + 4.5, legY);

      currentY = chartsBoxY + chartsBoxH + 6;

      // --- TABLA 2: LIDERAZGO ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('2. LIDERAZGO RESPONSABLE', marginX, currentY);
      currentY += 4;

      const leadershipRows: string[][] = [];

      if (filterAreaId === 'ALL' && filterGroupId === 'ALL') {
        generalCoordinators.forEach((c) => {
          const d = getVolunteerDetails(c, maskSensitiveData);
          leadershipRows.push(['Coord. General', d.name, d.nationalId, 'Ministerio Completo', d.phone]);
        });
      }

      organigramAreas.forEach((oa) => {
        oa.coordinators.forEach((c) => {
          const d = getVolunteerDetails(c, maskSensitiveData);
          leadershipRows.push(['Coord. de Área', d.name, d.nationalId, `Área: ${oa.area.name}`, d.phone]);
        });
      });

      if (filterGroupId !== 'ALL') {
        const targetGroup = groups.find((g) => g.id === filterGroupId);
        groupCoordinators.filter((c) => c.ministryGroupConfigId === filterGroupId).forEach((c) => {
          const d = getVolunteerDetails(c, maskSensitiveData);
          leadershipRows.push(['Coord. de Grupo', d.name, d.nationalId, `Grupo: ${targetGroup?.name}`, d.phone]);
        });
      }

      autoTable(doc, {
        startY: currentY,
        head: [['Rol de Liderazgo', 'Nombre Completo', 'Documento', 'Alcance Asignado', 'Teléfono']],
        body: leadershipRows.length > 0 ? leadershipRows : [['Sin coordinadores asignados para este filtro', '-', '-', '-', '-']],
        theme: 'striped',
        headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: darkColor },
        columnStyles: {
          0: { cellWidth: 32 },
          1: { cellWidth: 54 },
          2: { cellWidth: 28, halign: 'center' },
          3: { cellWidth: 40 },
          4: { cellWidth: 28, halign: 'center' },
        },
        margin: { left: marginX, right: marginX },
      });

      // @ts-expect-error - jspdf-autotable attaches lastAutoTable
      currentY = doc.lastAutoTable.finalY + 6;

      if (currentY > 235) {
        doc.addPage();
        currentY = 20;
      }

      // --- TABLA 3: MATRIZ DE EQUIPOS Y SUPERVISORES ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      const table3Title = filterGroupId !== 'ALL'
        ? '3. MATRIZ DE EQUIPOS Y COBERTURA'
        : '3. MATRIZ DE EQUIPOS Y PLANTILLAS';
      doc.text(table3Title, marginX, currentY);
      currentY += 4;

      const teamRows: string[][] = [];

      organigramAreas.forEach((oa) => {
        oa.teams.forEach((t) => {
          const supNames = t.supervisors.length > 0
            ? t.supervisors.map((s) => getVolunteerDetails(s, maskSensitiveData).name).join(', ')
            : 'SIN SUPERVISOR';

          teamRows.push([
            oa.area.name,
            t.group?.name || 'Grupo',
            supNames,
            `${t.volunteers.length} serv.`,
            `${t.totalCount} miembros`,
            t.hasSupervisor ? 'CUBIERTO' : 'PENDIENTE',
          ]);
        });
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Área', 'Grupo', 'Supervisor(es)', 'Servidores', 'Total', 'Estado']],
        body: teamRows.length > 0 ? teamRows : [['No hay equipos con los filtros seleccionados', '-', '-', '-', '-', '-']],
        theme: 'grid',
        headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: darkColor },
        margin: { left: marginX, right: marginX },
      });

      // @ts-expect-error - jspdf-autotable attaches lastAutoTable
      currentY = doc.lastAutoTable.finalY + 6;

      // --- SECCIÓN 4: LISTADOS DETALLADOS POR CADA GRUPO (SUPERVISORES PRIMERO) ---
      const allReportTeams: {
        team: IServiceAreaGroup;
        groupName: string;
        areaName: string;
        supervisors: IVolunteerAssignment[];
        volunteers: IVolunteerAssignment[];
        totalCount: number;
      }[] = [];

      organigramAreas.forEach((oa) => {
        oa.teams.forEach((t) => {
          allReportTeams.push({
            team: t.team,
            groupName: t.group?.name || 'Grupo',
            areaName: oa.area.name,
            supervisors: t.supervisors,
            volunteers: t.volunteers,
            totalCount: t.totalCount,
          });
        });
      });

      if (allReportTeams.length > 0) {
        if (currentY > 220) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text('4. PLANTILLAS Y LISTADOS DETALLADOS POR GRUPO', marginX, currentY);
        currentY += 5;

        allReportTeams.forEach((t) => {
          if (currentY > 230) {
            doc.addPage();
            currentY = 20;
          }

          // Sort supervisors: by name
          const sups = [...t.supervisors].sort((a, b) => {
            const nameA = getVolunteerDetails(a, maskSensitiveData).name;
            const nameB = getVolunteerDetails(b, maskSensitiveData).name;
            return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
          });

          // Sort volunteers: by name
          const vols = [...t.volunteers].sort((a, b) => {
            const nameA = getVolunteerDetails(a, maskSensitiveData).name;
            const nameB = getVolunteerDetails(b, maskSensitiveData).name;
            return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
          });

          // Header for this group
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.text(
            `GRUPO: ${t.groupName.toUpperCase()} - ${t.areaName.toUpperCase()} (${t.totalCount} integrantes: ${sups.length} supervisores, ${vols.length} servidores)`,
            marginX,
            currentY,
          );
          currentY += 3.5;

          // Build members: supervisors first!
          const membersList: {
            role: string;
            name: string;
            nationalId: string;
            phone: string;
            isSupervisor: boolean;
          }[] = [];

          sups.forEach((s) => {
            const d = getVolunteerDetails(s, maskSensitiveData);
            membersList.push({
              role: 'SUPERVISOR',
              name: d.name,
              nationalId: d.nationalId,
              phone: d.phone,
              isSupervisor: true,
            });
          });

          vols.forEach((v) => {
            const d = getVolunteerDetails(v, maskSensitiveData);
            membersList.push({
              role: 'Servidor',
              name: d.name,
              nationalId: d.nationalId,
              phone: d.phone,
              isSupervisor: false,
            });
          });

          const memberRows = membersList.map((m, idx) => [
            String(idx + 1),
            m.role,
            m.name,
            m.nationalId,
            m.phone,
          ]);

          autoTable(doc, {
            startY: currentY,
            head: [['N°', 'Rol en Equipo', 'Nombre Completo', 'Documento', 'Teléfono']],
            body:
              memberRows.length > 0
                ? memberRows
                : [['-', '-', 'Sin integrantes asignados a este equipo', '-', '-']],
            theme: 'grid',
            headStyles: {
              fillColor: [67, 56, 202], // Indigo-700
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 7.5,
            },
            bodyStyles: {
              fontSize: 7.5,
              textColor: darkColor,
            },
            columnStyles: {
              0: { cellWidth: 10, halign: 'center' }, // N°
              1: { cellWidth: 36, halign: 'center' }, // Rol
              2: { cellWidth: 66 }, // Nombre Completo
              3: { cellWidth: 35, halign: 'center' }, // Documento
              4: { cellWidth: 35, halign: 'center' }, // Teléfono
            },
            margin: { left: marginX, right: marginX },
            didParseCell: (data) => {
              if (data.section === 'body' && memberRows.length > 0) {
                const member = membersList[data.row.index];
                if (member?.isSupervisor) {
                  data.cell.styles.fillColor = [238, 242, 255]; // Indigo-50
                  data.cell.styles.fontStyle = 'bold';
                  if (data.column.index === 1) {
                    data.cell.styles.textColor = [67, 56, 202]; // Indigo-700
                  } else {
                    data.cell.styles.textColor = [30, 41, 59];
                  }
                }
              }
            },
          });

          // @ts-expect-error - jspdf-autotable attaches lastAutoTable
          currentY = doc.lastAutoTable.finalY + 5;
        });
      }

      // Footer with page numbering
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        const privacyText = maskSensitiveData ? ' • [Datos personales protegidos]' : '';
        doc.text(
          `Iglekids • Reporte Filtrado: ${activeFilterTitle}${privacyText} • Página ${i} de ${pageCount}`,
          105,
          290,
          { align: 'center' },
        );
      }

      // Filename reflects active filter
      const safeMinistry = (ministry?.name || 'Iglekids').replace(/\s+/g, '_');
      const safeFilter = activeFilterTitle.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      const privacySuffix = maskSensitiveData ? '_Protegido' : '';
      doc.save(`Organigrama_${safeMinistry}_${safeFilter}${privacySuffix}.pdf`);

      toast.success('Reporte PDF generado y descargado exitosamente');
    } catch {
      toast.error('Error al generar el reporte PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetFilters = () => {
    setFilterAreaId('ALL');
    setFilterGroupId('ALL');
    setFilterCoverage('ALL');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* HEADER & PDF EXPORT ACTION BAR */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200/90 shadow-xs flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-black text-primary uppercase tracking-wider mb-0.5">
            <Sparkles size={14} />
            <span>Estructura y Cobertura</span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-gray-900">
            Organigrama Ministerial
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Filtra por área o grupo para consultar y exportar reportes personalizados en PDF.
          </p>
        </div>

        <Button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="rounded-2xl text-xs gap-1.5 py-2.5 px-4 bg-primary text-white shadow-xs shrink-0 cursor-pointer"
        >
          {isExporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          <span>Exportar PDF</span>
        </Button>
      </div>

      {/* FILTER BAR: ÁREA + GRUPO + COBERTURA (RESPONDS TO USER REQUIREMENT) */}
      <div className="bg-white rounded-3xl p-4 border border-gray-200/90 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wide">
            <Filter size={13} className="text-primary" />
            <span>Filtros del Organigrama y Reporte PDF</span>
          </div>

          {(filterAreaId !== 'ALL' || filterGroupId !== 'ALL' || filterCoverage !== 'ALL') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Filter 1: Área */}
          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">
              Filtrar por Área
            </label>
            <SelectSearch
              label=""
              placeholder="Todas las áreas..."
              options={areaOptions}
              value={filterAreaId}
              onChange={(val) => setFilterAreaId(val)}
              searchable={areaOptions.length > 5}
            />
          </div>

          {/* Filter 2: Grupo */}
          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">
              Filtrar por Grupo
            </label>
            <SelectSearch
              label=""
              placeholder="Todos los grupos..."
              options={groupOptions}
              value={filterGroupId}
              onChange={(val) => setFilterGroupId(val)}
              searchable={groupOptions.length > 5}
            />
          </div>

          {/* Filter 3: Estado de Supervisión */}
          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">
              Estado de Supervisión
            </label>
            <SelectSearch
              label=""
              placeholder="Todos los estados..."
              options={coverageOptions}
              value={filterCoverage}
              onChange={(val) => setFilterCoverage(val as CoverageFilter)}
            />
          </div>
        </div>

        {/* Privacy toggle for sensitive data in PDF and UI */}
        <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={maskSensitiveData}
              onChange={(e) => setMaskSensitiveData(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
            />
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className={maskSensitiveData ? 'text-primary' : 'text-gray-400'} />
              <span>Enmascarar datos sensibles en reporte PDF (Cédula y Teléfono)</span>
            </span>
          </label>
          <span
            className={clsx(
              'text-[10px] font-bold px-2.5 py-0.5 rounded-full border',
              maskSensitiveData
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-amber-700 bg-amber-50 border-amber-200',
            )}
          >
            {maskSensitiveData ? '🛡️ Modo Privacidad Activo' : '⚠️ Cédula y Teléfono Visibles'}
          </span>
        </div>
      </div>

      {/* EXECUTIVE KPI BAR FOR FILTERED SCOPE */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white rounded-2xl p-3 border border-gray-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400">Equipos Filtrados</span>
          <p className="text-xl font-black text-gray-900 mt-0.5">{kpiStats.totalTeams}</p>
          <p className="text-[10px] text-gray-400">En {organigramAreas.length} área(s)</p>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-gray-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400">Supervisores</span>
          <p className="text-xl font-black text-indigo-700 mt-0.5">
            {kpiStats.supervisorsCount}
          </p>
          <p className="text-[10px] text-gray-400">Líderes de equipo</p>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-gray-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400">Servidores Activos</span>
          <p className="text-xl font-black text-teal-700 mt-0.5">
            {kpiStats.volunteersCount}
          </p>
          <p className="text-[10px] text-gray-400">Plantilla operativa</p>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-gray-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400">Tasa de Cobertura</span>
          <p
            className={clsx(
              'text-xl font-black mt-0.5',
              kpiStats.coveragePct >= 80
                ? 'text-emerald-600'
                : kpiStats.coveragePct >= 50
                ? 'text-amber-600'
                : 'text-rose-600',
            )}
          >
            {kpiStats.coveragePct}%
          </p>
          <p className="text-[10px] text-gray-400">
            {kpiStats.coveredTeams}/{kpiStats.totalTeams || 1} cubiertos
          </p>
        </div>
      </div>

      {/* TOP LEVEL CÚPULA: COORDINACIÓN GENERAL */}
      {filterAreaId === 'ALL' && filterGroupId === 'ALL' && (
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200/90 rounded-3xl p-4 shadow-xs flex flex-col items-center text-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Crown size={18} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
              Coordinación General del Ministerio
            </span>
            <h3 className="text-sm font-extrabold text-gray-900 mt-0.5">
              {ministry?.name || 'Iglekids'}
            </h3>
          </div>

          {generalCoordinators.length === 0 ? (
            <span className="text-xs text-amber-700 italic">Sin coordinador general asignado</span>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
              {generalCoordinators.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white border border-amber-300 text-xs font-bold text-gray-900 shadow-2xs"
                >
                  <Crown size={12} className="text-amber-600" />
                  <span>{getVolunteerDetails(c).name}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ORGANIGRAM AREAS BREAKDOWN (RESPONSIVE CARDS) */}
      <div className="flex flex-col gap-4">
        {organigramAreas.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-gray-200/80 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-gray-400">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">
                No hay equipos que coincidan con los filtros
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Prueba restableciendo los filtros de área o grupo.
              </p>
            </div>
            <Button onClick={handleResetFilters} size="sm" variant="default" className="text-xs">
              Restablecer filtros
            </Button>
          </div>
        ) : (
          organigramAreas.map(({ area, coordinators, teams, totalTeams, coveredTeams }) => {
            const areaCoveragePct = totalTeams > 0 ? Math.round((coveredTeams / totalTeams) * 100) : 100;

            return (
              <div
                key={area.id}
                className="bg-white rounded-3xl border border-gray-200/90 shadow-xs overflow-hidden flex flex-col"
              >
                {/* Area Card Header */}
                <div className="p-4 bg-slate-50 border-b border-gray-200/80 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
                      <Layers size={16} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">
                        {area.name}
                      </h3>
                      <p className="text-[11px] text-gray-500 truncate">
                        {coordinators.length > 0
                          ? `Coord: ${coordinators.map((c) => getVolunteerDetails(c).name).join(', ')}`
                          : 'Sin coordinador de área asignado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
                        areaCoveragePct === 100
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200',
                      )}
                    >
                      {areaCoveragePct === 100 ? (
                        <CheckCircle2 size={11} />
                      ) : (
                        <AlertCircle size={11} />
                      )}
                      <span>{coveredTeams}/{totalTeams} equipos cubiertos ({areaCoveragePct}%)</span>
                    </span>
                  </div>
                </div>

                {/* Teams Matrix for this Area */}
                <div
                  className={clsx(
                    'p-4 grid gap-3',
                    filterGroupId !== 'ALL'
                      ? 'grid-cols-1'
                      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
                  )}
                >
                  {teams.map(({ team, group, supervisors, volunteers, totalCount, hasSupervisor }) => {
                    const supervisorNames = supervisors.map((s) => getVolunteerDetails(s).name);

                    // When filtered by group, show expanded roster with supervisors first
                    if (filterGroupId !== 'ALL') {
                      return (
                        <div
                          key={team.id}
                          className="p-4 rounded-2xl border border-gray-200/90 bg-slate-50/50 shadow-2xs flex flex-col gap-3"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-gray-200/70 pb-2.5 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-gray-900">
                                {group?.name || 'Grupo'}
                              </span>
                              <span className="text-[11px] font-semibold text-gray-500">
                                ({area.name})
                              </span>
                            </div>
                            <span
                              className={clsx(
                                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
                                hasSupervisor
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200',
                              )}
                            >
                              {hasSupervisor ? (
                                <>
                                  <CheckCircle2 size={11} />
                                  <span>Supervisado ({supervisors.length})</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle size={11} />
                                  <span>Sin supervisor</span>
                                </>
                              )}
                            </span>
                          </div>

                          {/* Listado con distinción: Supervisores PRIMERO */}
                          <div className="flex flex-col gap-2.5">
                            {/* Supervisores */}
                            <div>
                              <div className="flex items-center gap-1.5 text-[11px] font-black text-indigo-800 uppercase tracking-wide mb-1.5">
                                <ShieldCheck size={13} className="text-indigo-600" />
                                <span>Supervisores ({supervisors.length})</span>
                              </div>
                              {supervisors.length === 0 ? (
                                <p className="text-xs text-amber-700 italic pl-2">
                                  No hay supervisores asignados a este equipo.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {supervisors.map((s) => {
                                    const d = getVolunteerDetails(s, maskSensitiveData);
                                    return (
                                      <div
                                        key={s.id}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 font-bold shadow-2xs"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] shrink-0">
                                            ★
                                          </div>
                                          <div className="min-w-0">
                                            <p className="truncate font-black">{d.name}</p>
                                            <p className="text-[10px] text-indigo-600 font-normal truncate">
                                              Doc: {d.nationalId} • Tel: {d.phone}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Servidores */}
                            <div className="pt-1">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                                <Users size={13} className="text-teal-600" />
                                <span>Servidores Activos ({volunteers.length})</span>
                              </div>
                              {volunteers.length === 0 ? (
                                <p className="text-xs text-gray-400 italic pl-2">
                                  No hay servidores asignados a este equipo.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                                  {volunteers.map((v) => {
                                    const d = getVolunteerDetails(v, maskSensitiveData);
                                    return (
                                      <div
                                        key={v.id}
                                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-200/80 text-xs text-gray-800 shadow-2xs"
                                      >
                                        <div className="min-w-0">
                                          <p className="font-semibold text-gray-900 truncate">
                                            {d.name}
                                          </p>
                                          <p className="text-[10px] text-gray-400 truncate">
                                            Doc: {d.nationalId} • Tel: {d.phone}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500">
                            <span className="font-bold text-teal-700">
                              {volunteers.length} servidores activos
                            </span>
                            <span className="font-black text-gray-800">
                              {totalCount} integrantes en total
                            </span>
                          </div>
                        </div>
                      );
                    }

                    // Compact card when not filtering by a single group
                    return (
                      <div
                        key={team.id}
                        className={clsx(
                          'p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2',
                          hasSupervisor
                            ? 'bg-slate-50/70 border-gray-200/80 hover:bg-slate-50'
                            : 'bg-amber-50/40 border-amber-200/90 hover:bg-amber-50/70',
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-black text-gray-900 truncate">
                              {group?.name || 'Grupo'}
                            </span>
                            <span
                              className={clsx(
                                'w-2 h-2 rounded-full shrink-0',
                                hasSupervisor ? 'bg-emerald-500' : 'bg-amber-500',
                              )}
                              title={hasSupervisor ? 'Supervisado' : 'Sin supervisor'}
                            />
                          </div>

                          <div className="text-[11px] text-gray-600 mt-1">
                            {hasSupervisor ? (
                              <p className="font-semibold text-indigo-900 line-clamp-1">
                                Sup: {supervisorNames.join(', ')}
                              </p>
                            ) : (
                              <p className="font-bold text-amber-700">Sin supervisor</p>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[10px] text-gray-500">
                          <span className="font-bold text-teal-700">{volunteers.length} servidores</span>
                          <span className="font-semibold">{totalCount} miembros</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MinistryOrganigramSection;
