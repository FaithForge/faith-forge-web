import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileDown, ShieldCheck, Loader2 } from 'lucide-react';
import AppDrawer from '@/components/ui/AppDrawer';
import Button from '@/components/ui/Button';
import SelectSearch from '@/components/ui/SelectSearch';
import Select from '@/components/ui/Select';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import {
  IMinistry,
  IMinistryArea,
  IMinistryGroupConfig,
  IMinistryWorkspaceLeadership,
  IMinistryWorkspaceTeam,
  IServiceAreaGroup,
  IVolunteerAssignment,
  VolunteerRole,
} from '@/libs/models';
import {
  GetVolunteerAssignments,
  GetVolunteers,
} from '@/libs/state/redux/thunks/church/volunteer.thunk';
import { GetServiceAreaGroups } from '@/libs/state/redux/thunks/church/ministry.thunk';
import { capitalizeWords } from '@/libs/utils/text';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

/**
 * Masks a national ID string to protect sensitive personal data.
 *
 * @param {string} [id] - Raw national ID.
 * @returns {string} Masked string or '-' if empty.
 */
const maskNationalId = (id?: string): string => {
  if (!id || id.trim() === '' || id.trim() === '-') return '-';
  const clean = id.trim();
  if (clean.length <= 4) return '••••';
  return '••••••' + clean.slice(-4);
};

/**
 * Masks a phone number to protect privacy.
 *
 * @param {string} [phone] - Raw phone number.
 * @returns {string} Masked string or '-' if empty.
 */
const maskPhone = (phone?: string): string => {
  if (!phone || phone.trim() === '' || phone.trim() === '-') return '-';
  const clean = phone.trim();
  if (clean.length <= 4) return '••••';
  return '••••••' + clean.slice(-4);
};

/**
 * Filter coverage modes for teams in the PDF report.
 */
type CoverageFilter = 'ALL' | 'COVERED' | 'UNCOVERED';

/**
 * Props for ExportOrganizationPdfModal component.
 */
interface ExportOrganizationPdfModalProps {
  /** Controls drawer open state */
  open: boolean;
  /** Callback fired when drawer open state changes */
  onOpenChange: (open: boolean) => void;
  /** Active ministry to generate report for */
  ministry?: IMinistry;
  /** Campus identifier */
  churchCampusId?: string;
  /** Human readable campus name */
  campusName?: string;
  /** Pre-loaded workspace areas */
  workspaceAreas?: IMinistryArea[];
  /** Pre-loaded workspace groups */
  workspaceGroups?: IMinistryGroupConfig[];
  /** Pre-loaded workspace teams */
  workspaceTeams?: IMinistryWorkspaceTeam[];
  /** Pre-loaded workspace leadership */
  workspaceLeadership?: IMinistryWorkspaceLeadership;
}

/**
 * Modal drawer that configures filters and privacy settings, and exports
 * an official executive organization report in PDF format.
 *
 * @param {ExportOrganizationPdfModalProps} props - Component properties.
 * @returns {JSX.Element} Rendered export drawer modal.
 */
export const ExportOrganizationPdfModal: React.FC<ExportOrganizationPdfModalProps> = ({
  open,
  onOpenChange,
  ministry,
  churchCampusId,
  campusName,
  workspaceAreas,
  workspaceGroups,
  workspaceTeams,
  workspaceLeadership,
}) => {
  const { t } = useTranslation('admin');
  const dispatch = useAppDispatch();
  useModalBackClose(open, () => onOpenChange(false));

  const ministryId = ministry?.id || '';

  // Redux state
  const { areasByMinistry, groupsByMinistry, serviceAreaGroups } = useAppSelector(
    (state) => state.ministrySlice,
  );
  const {
    assignments,
    assignmentsByPartition,
    volunteers: { data: volunteersList },
  } = useAppSelector((state) => state.volunteerSlice);

  // Load detailed volunteer assignments in concurrency when modal opens
  useEffect(() => {
    if (!open || !ministryId) return;

    Promise.all([
      dispatch(GetVolunteerAssignments({ ministryId, limit: 500, force: false })),
      dispatch(GetVolunteers({ ministryId, limit: 500, force: false })),
      dispatch(GetServiceAreaGroups({ ministryId })),
    ]);
  }, [open, ministryId, dispatch]);

  // Form options
  const [maskSensitiveData, setMaskSensitiveData] = useState<boolean>(true);
  const [filterAreaId, setFilterAreaId] = useState<string>('ALL');
  const [filterGroupId, setFilterGroupId] = useState<string>('ALL');
  const [filterCoverage, setFilterCoverage] = useState<CoverageFilter>('ALL');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Structure lists (prefer workspace pre-aggregated data from parent)
  const areas = useMemo(() => {
    const list =
      workspaceAreas && workspaceAreas.length > 0
        ? workspaceAreas
        : areasByMinistry[ministryId] || [];
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }, [workspaceAreas, areasByMinistry, ministryId]);

  const groups = useMemo(() => {
    const list =
      workspaceGroups && workspaceGroups.length > 0
        ? workspaceGroups
        : groupsByMinistry[ministryId] || [];
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }, [workspaceGroups, groupsByMinistry, ministryId]);

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

  /**
   * Resolves volunteer display metadata with optional privacy masking.
   */
  const getVolunteerDetails = useCallback(
    (asg: IVolunteerAssignment, mask: boolean = false) => {
      const vId = asg.volunteerId || asg.ministryVolunteerId;
      const vol =
        asg.volunteer ||
        asg.ministryVolunteer ||
        volunteersList.find((v) => v.id === vId || (v.userId && v.userId === asg.volunteer?.userId));
      const user = asg.volunteer?.user || vol?.user || asg.user;
      const rawName =
        user && (user.firstName || user.lastName)
          ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
          : 'Servidor';
      const rawId = user?.nationalId || '-';
      const rawPhone = user?.phone || '-';
      return {
        name: capitalizeWords(rawName),
        nationalId: mask ? maskNationalId(rawId) : rawId,
        phone: mask ? maskPhone(rawPhone) : rawPhone,
      };
    },
    [volunteersList],
  );

  // Available Teams (use pre-aggregated workspaceTeams or fallback to Redux)
  const availableTeams = useMemo(() => {
    if (workspaceTeams && workspaceTeams.length > 0) {
      return workspaceTeams.map(
        (wt) =>
          ({
            id: wt.id,
            ministryAreaId: wt.ministryAreaId,
            ministryGroupConfigId: wt.ministryGroupConfigId,
            churchCampusId: wt.churchCampusId,
            state: wt.state,
          } as IServiceAreaGroup),
      );
    }
    return serviceAreaGroups;
  }, [workspaceTeams, serviceAreaGroups]);

  // Coordinators
  const generalCoordinators = useMemo(() => {
    return allAssignments.filter((a) => a.role === VolunteerRole.MINISTRY_GENERAL_COORDINATOR);
  }, [allAssignments]);

  const areaCoordinators = useMemo(() => {
    return allAssignments.filter((a) => a.role === VolunteerRole.AREA_GENERAL_COORDINATOR);
  }, [allAssignments]);

  const groupCoordinators = useMemo(() => {
    return allAssignments.filter((a) => a.role === VolunteerRole.GROUP_COORDINATOR);
  }, [allAssignments]);

  // Filtered teams
  const filteredCampusTeams = useMemo(() => {
    const areaIds = new Set(areas.map((a) => a.id));
    return availableTeams.filter((sag) => {
      if (!areaIds.has(sag.ministryAreaId)) return false;
      if (churchCampusId && sag.churchCampusId && sag.churchCampusId !== churchCampusId) return false;
      if (filterAreaId !== 'ALL' && sag.ministryAreaId !== filterAreaId) return false;
      if (filterGroupId !== 'ALL' && sag.ministryGroupConfigId !== filterGroupId) return false;

      if (filterCoverage !== 'ALL') {
        const hasSup = allAssignments.some(
          (a) => a.serviceAreaGroupId === sag.id && a.role === VolunteerRole.SUPERVISOR,
        );
        if (filterCoverage === 'COVERED' && !hasSup) return false;
        if (filterCoverage === 'UNCOVERED' && hasSup) return false;
      }
      return true;
    });
  }, [availableTeams, areas, churchCampusId, filterAreaId, filterGroupId, filterCoverage, allAssignments]);

  // Grouped organigram structure for the report
  const organigramAreas = useMemo(() => {
    return areas
      .filter((a) => filterAreaId === 'ALL' || a.id === filterAreaId)
      .map((area) => {
        const areaTeams = filteredCampusTeams.filter((t) => t.ministryAreaId === area.id);
        const mappedTeams = areaTeams.map((team) => {
          const group = groups.find((g) => g.id === team.ministryGroupConfigId);
          const teamAssignments = allAssignments.filter((a) => a.serviceAreaGroupId === team.id);
          const supervisors = teamAssignments.filter((a) => a.role === VolunteerRole.SUPERVISOR);
          const volunteers = teamAssignments.filter((a) => a.role === VolunteerRole.VOLUNTEER);
          return {
            team,
            group,
            supervisors,
            volunteers,
            hasSupervisor: supervisors.length > 0,
            totalCount: teamAssignments.length,
          };
        });

        const coords = areaCoordinators.filter((c) => c.ministryAreaId === area.id);
        return {
          area,
          coordinators: coords,
          teams: mappedTeams,
        };
      })
      .filter((oa) => oa.teams.length > 0 || oa.coordinators.length > 0);
  }, [areas, filterAreaId, filteredCampusTeams, groups, allAssignments, areaCoordinators]);

  // KPI statistics for the filtered selection
  const kpiStats = useMemo(() => {
    const totalTeams = filteredCampusTeams.length;
    let coveredTeams = 0;
    let teamsRequiringSupervisorCount = 0;
    const supervisorIds = new Set<string>();
    const volunteerIds = new Set<string>();

    filteredCampusTeams.forEach((team) => {
      const area = areas.find((a) => a.id === team.ministryAreaId) || team.ministryArea;
      const requiresSupervisor = (area?.requiresSupervisor ?? true) !== false;
      if (requiresSupervisor) teamsRequiringSupervisorCount++;

      const teamAssignments = allAssignments.filter((a) => a.serviceAreaGroupId === team.id);
      const sups = teamAssignments.filter((a) => a.role === VolunteerRole.SUPERVISOR);
      if (sups.length > 0) coveredTeams++;
      sups.forEach((s) => supervisorIds.add(s.churchMemberId || s.volunteerId || s.id));
      teamAssignments
        .filter((a) => a.role === VolunteerRole.VOLUNTEER)
        .forEach((v) => volunteerIds.add(v.churchMemberId || v.volunteerId || v.id));
    });

    const supervisorsCount = supervisorIds.size;
    const volunteersCount = volunteerIds.size;
    const totalMembersCount = supervisorsCount + volunteersCount;
    const effectiveTotalRequiring =
      teamsRequiringSupervisorCount > 0 ? teamsRequiringSupervisorCount : totalTeams;
    const coveragePct =
      effectiveTotalRequiring > 0 ? Math.round((coveredTeams / effectiveTotalRequiring) * 100) : 0;

    return {
      totalTeams,
      teamsRequiringSupervisorCount,
      coveredTeams,
      coveragePct,
      supervisorsCount,
      volunteersCount,
      totalMembersCount,
    };
  }, [filteredCampusTeams, allAssignments, areas]);

  // Active filter description string
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

  /**
   * Generates and downloads the executive PDF document.
   */
  const handleExportPDF = () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const primaryColor: [number, number, number] = [0, 57, 99]; // Official Navy Blue (#003963)
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
      const ministryTitle = (ministry?.name || 'MINISTERIO').toUpperCase();
      doc.text(`${ministryTitle} • REPORTE OFICIAL DE ESTRUCTURA Y ORGANIZACIÓN`, marginX, 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(
        `Ministerio: ${ministry?.name || 'General'} | Sede: ${campusName || 'General'} | Filtro: ${activeFilterTitle}`,
        marginX,
        17,
      );
      doc.text(`Generado: ${dateStr}`, 152, 17);

      if (maskSensitiveData) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(224, 231, 255);
        doc.text('[DATOS SENSIBLES ENMASCARADOS - DOCUMENTO Y TELÉFONO PROTEGIDOS]', marginX, 22.5);
      }

      let currentY = 32.5;

      // --- 1. RESUMEN EJECUTIVO Y ANÁLISIS ESTADÍSTICO ---
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('1. RESUMEN EJECUTIVO Y ANÁLISIS ESTADÍSTICO', marginX, currentY);
      currentY += 4;

      // 4 KPI Cards
      const cardGap = 3;
      const cardW = (contentWidth - cardGap * 3) / 4;
      const cardH = 16;

      // Card 1: Equipos
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(marginX, currentY, cardW, cardH, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('EQUIPOS', marginX + 3, currentY + 4.5);
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text(String(kpiStats.totalTeams), marginX + 3, currentY + 10.5);
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text(`En ${organigramAreas.length} área(s)`, marginX + 3, currentY + 14);

      // Card 2: Supervisores
      const card2X = marginX + cardW + cardGap;
      doc.setFillColor(238, 242, 255);
      doc.setDrawColor(199, 210, 254);
      doc.roundedRect(card2X, currentY, cardW, cardH, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(67, 56, 202);
      doc.text('SUPERVISORES', card2X + 3, currentY + 4.5);
      doc.setFontSize(13);
      doc.text(String(kpiStats.supervisorsCount), card2X + 3, currentY + 10.5);
      doc.setFontSize(6);
      doc.setTextColor(99, 102, 241);
      doc.text('Líderes de equipo', card2X + 3, currentY + 14);

      // Card 3: Servidores
      const card3X = marginX + (cardW + cardGap) * 2;
      doc.setFillColor(240, 253, 250);
      doc.setDrawColor(153, 246, 228);
      doc.roundedRect(card3X, currentY, cardW, cardH, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 118, 110);
      doc.text('SERVIDORES', card3X + 3, currentY + 4.5);
      doc.setFontSize(13);
      doc.text(String(kpiStats.volunteersCount), card3X + 3, currentY + 10.5);
      doc.setFontSize(6);
      doc.setTextColor(20, 184, 166);
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
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, chartsBoxY, contentWidth, chartsBoxH, 2, 2, 'FD');

      const colWidth = (contentWidth - 6) / 2;

      // Chart A: Cobertura
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

      const totalCoverTarget = kpiStats.teamsRequiringSupervisorCount || kpiStats.totalTeams || 1;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `(${kpiStats.coveredTeams} de ${totalCoverTarget} equipos con supervisor)`,
        chartAX + 15,
        chartsBoxY + 11.5,
      );

      const barWMax = colWidth - 8;
      const barH = 4.2;
      const barY = chartsBoxY + 14.5;

      doc.setFillColor(226, 232, 240);
      doc.roundedRect(chartAX, barY, barWMax, barH, 1.2, 1.2, 'F');

      const fillBarW = Math.max(1, (covPct / 100) * barWMax);
      doc.setFillColor(covColor[0], covColor[1], covColor[2]);
      doc.roundedRect(chartAX, barY, fillBarW, barH, 1.2, 1.2, 'F');

      // Chart B: Proporción
      const chartBX = marginX + colWidth + 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text('DISTRIBUCIÓN DEL PERSONAL EN EQUIPOS', chartBX, chartsBoxY + 5.5);

      const totalStaff = kpiStats.totalMembersCount || 1;
      const supPct = Math.round((kpiStats.supervisorsCount / totalStaff) * 100);
      const volPct = Math.max(0, 100 - supPct);

      const versusBarW = colWidth - 10;
      const versusBarH = 4.8;
      const versusBarY = chartsBoxY + 9;

      const supSegmentW = Math.max(0, (supPct / 100) * versusBarW);
      const volSegmentW = Math.max(0, versusBarW - supSegmentW);

      if (supSegmentW > 0) {
        doc.setFillColor(79, 70, 229);
        doc.roundedRect(chartBX, versusBarY, supSegmentW, versusBarH, 1.2, 1.2, 'F');
      }
      if (volSegmentW > 0) {
        doc.setFillColor(13, 148, 136);
        doc.roundedRect(chartBX + supSegmentW, versusBarY, volSegmentW, versusBarH, 1.2, 1.2, 'F');
      }

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

      // --- 2. LIDERAZGO ---
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
        groupCoordinators
          .filter((c) => c.ministryGroupConfigId === filterGroupId)
          .forEach((c) => {
            const d = getVolunteerDetails(c, maskSensitiveData);
            leadershipRows.push(['Coord. de Grupo', d.name, d.nationalId, `Grupo: ${targetGroup?.name}`, d.phone]);
          });
      }

      autoTable(doc, {
        startY: currentY,
        head: [['Rol de Liderazgo', 'Nombre Completo', 'Documento', 'Alcance Asignado', 'Teléfono']],
        body:
          leadershipRows.length > 0
            ? leadershipRows
            : [['Sin coordinadores asignados para este filtro', '-', '-', '-', '-']],
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

      // --- 3. MATRIZ DE EQUIPOS ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('3. MATRIZ DE EQUIPOS Y PLANTILLAS', marginX, currentY);
      currentY += 4;

      const teamRows: string[][] = [];
      organigramAreas.forEach((oa) => {
        oa.teams.forEach((t) => {
          const isSupRequired = oa.area.requiresSupervisor !== false;
          const supNames =
            t.supervisors.length > 0
              ? t.supervisors.map((s) => getVolunteerDetails(s, maskSensitiveData).name).join(', ')
              : isSupRequired
                ? 'SIN SUPERVISOR'
                : 'NO REQUERIDO';

          const status = t.hasSupervisor
            ? 'CUBIERTO'
            : isSupRequired
              ? 'PENDIENTE'
              : 'OPCIONAL';

          teamRows.push([
            oa.area.name,
            t.group?.name || 'Grupo',
            supNames,
            `${t.volunteers.length} serv.`,
            `${t.totalCount} miembros`,
            status,
          ]);
        });
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Área', 'Grupo', 'Supervisor(es)', 'Servidores', 'Total', 'Estado']],
        body:
          teamRows.length > 0
            ? teamRows
            : [['No hay equipos con los filtros seleccionados', '-', '-', '-', '-', '-']],
        theme: 'grid',
        headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: darkColor },
        margin: { left: marginX, right: marginX },
      });

      // @ts-expect-error - jspdf-autotable attaches lastAutoTable
      currentY = doc.lastAutoTable.finalY + 6;

      // --- 4. LISTADOS DETALLADOS POR GRUPO ---
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
        doc.text('4. PLANTILLAS DETALLADAS POR GRUPO', marginX, currentY);
        currentY += 5;

        allReportTeams.forEach((t) => {
          if (currentY > 230) {
            doc.addPage();
            currentY = 20;
          }

          const sups = [...t.supervisors].sort((a, b) => {
            const nameA = getVolunteerDetails(a, maskSensitiveData).name;
            const nameB = getVolunteerDetails(b, maskSensitiveData).name;
            return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
          });

          const vols = [...t.volunteers].sort((a, b) => {
            const nameA = getVolunteerDetails(a, maskSensitiveData).name;
            const nameB = getVolunteerDetails(b, maskSensitiveData).name;
            return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
          });

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.text(
            `GRUPO: ${t.groupName.toUpperCase()} - ${t.areaName.toUpperCase()} (${t.totalCount} integrantes: ${sups.length} supervisores, ${vols.length} servidores)`,
            marginX,
            currentY,
          );
          currentY += 3.5;

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
              fillColor: [67, 56, 202],
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 7.5,
            },
            bodyStyles: {
              fontSize: 7.5,
              textColor: darkColor,
            },
            columnStyles: {
              0: { cellWidth: 10, halign: 'center' },
              1: { cellWidth: 36, halign: 'center' },
              2: { cellWidth: 66 },
              3: { cellWidth: 35, halign: 'center' },
              4: { cellWidth: 35, halign: 'center' },
            },
            margin: { left: marginX, right: marginX },
            didParseCell: (data) => {
              if (data.section === 'body' && memberRows.length > 0) {
                const member = membersList[data.row.index];
                if (member?.isSupervisor) {
                  data.cell.styles.fillColor = [238, 242, 255];
                  data.cell.styles.fontStyle = 'bold';
                  if (data.column.index === 1) {
                    data.cell.styles.textColor = [67, 56, 202];
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

      // Page numbers footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        const privacyText = maskSensitiveData ? ' • [Datos personales protegidos]' : '';
        doc.text(
          `${ministry?.name || 'Ministerio'} • Reporte: ${activeFilterTitle}${privacyText} • Página ${i} de ${pageCount}`,
          105,
          290,
          { align: 'center' },
        );
      }

      const safeMinistry = (ministry?.name || 'Ministerio').replace(/\s+/g, '_');
      const safeFilter = activeFilterTitle.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      const privacySuffix = maskSensitiveData ? '_Protegido' : '';
      doc.save(`Organizacion_${safeMinistry}_${safeFilter}${privacySuffix}.pdf`);

      toast.success(t('export_pdf_modal.success_toast'));
      onOpenChange(false);
    } catch {
      toast.error(t('export_pdf_modal.error_toast'));
    } finally {
      setIsExporting(false);
    }
  };

  const areaOptions = useMemo(() => {
    return [
      { id: 'ALL', name: t('export_pdf_modal.all_areas', { count: areas.length }) },
      ...areas.map((a) => ({ id: a.id, name: a.name })),
    ];
  }, [areas, t]);

  const groupOptions = useMemo(() => {
    return [
      { id: 'ALL', name: t('export_pdf_modal.all_groups', { count: groups.length }) },
      ...groups.map((g) => ({ id: g.id, name: g.name })),
    ];
  }, [groups, t]);

  const coverageOptions = useMemo(() => {
    return [
      { id: 'ALL', label: t('export_pdf_modal.all_teams') },
      { id: 'COVERED', label: t('export_pdf_modal.covered_only') },
      { id: 'UNCOVERED', label: t('export_pdf_modal.uncovered_only') },
    ];
  }, [t]);

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={t('export_pdf_modal.title')}
      contentClassName="max-w-lg mx-auto"
    >
      <div className="p-4 flex flex-col gap-4">
        <p className="text-xs text-gray-500 leading-relaxed -mt-1">
          {t('export_pdf_modal.subtitle')}
        </p>

        {/* Privacy toggle card */}
        <label className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl cursor-pointer hover:bg-slate-100/70 transition-colors">
          <input
            type="checkbox"
            checked={maskSensitiveData}
            onChange={(e) => setMaskSensitiveData(e.target.checked)}
            className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
          />
          <div className="flex-1">
            <span className="text-xs font-extrabold text-gray-900 block flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" />
              {t('export_pdf_modal.privacy_label')}
            </span>
            <span className="text-[11px] text-gray-500 mt-0.5 block leading-tight">
              {t('export_pdf_modal.privacy_subtitle')}
            </span>
          </div>
        </label>

        {/* Filter selection fields */}
        <div className="flex flex-col gap-3">
          <SelectSearch
            label={t('export_pdf_modal.area_filter_label')}
            value={filterAreaId}
            onChange={setFilterAreaId}
            options={areaOptions}
            searchable={false}
          />

          <SelectSearch
            label={t('export_pdf_modal.group_filter_label')}
            value={filterGroupId}
            onChange={setFilterGroupId}
            options={groupOptions}
            searchable={false}
          />

          <Select
            label={t('export_pdf_modal.coverage_filter_label')}
            value={filterCoverage}
            onChange={(e) => setFilterCoverage(e.target.value as CoverageFilter)}
          >
            {coverageOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 font-bold cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t('export_pdf_modal.generating')}</span>
              </>
            ) : (
              <>
                <FileDown size={16} />
                <span>{t('export_pdf_modal.download_btn')}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </AppDrawer>
  );
};

export default ExportOrganizationPdfModal;
