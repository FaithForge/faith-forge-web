import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Plus,
  RefreshCw,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import dayjs from 'dayjs';
import clsx from 'clsx';
import Button from '@/components/ui/Button';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';
import {
  useGetChurchReportsQuery,
  useGetVolunteerAttendanceQuery,
} from '@/libs/state/redux/api/churchApi';
import {
  useGetKidGroupAttendanceQuery,
  useGetKidsQuery,
} from '@/libs/state/redux/api/kidChurchApi';
import { IKid, IKidGuardian } from '@/libs/models';
import {
  IChildIncidentReportDetails,
  IChurchReport,
  IGuardianCallReportDetails,
  MedicalAttentionType,
  ReportHistoryAction,
  ReportPriority,
  ReportStatus,
  ReportType,
} from '@/libs/models/ChurchReport';
import { CreateChurchReportModal } from '@/components/reports/CreateChurchReportModal';
import { CloseChurchReportModal } from './CloseChurchReportModal';
import { AddChurchReportNoteModal } from './AddChurchReportNoteModal';
import { ChurchReportDetailDrawer } from './ChurchReportDetailDrawer';
import { isFeatureEnabled } from '@/config/features';
import { APP_ROUTES } from '@/config/routes';
import { usePermissions } from '@/libs/hooks/usePermissions';
import { formatPersonShortName } from '@/libs/utils/text';


type FilterStatusType = 'ALL' | ReportStatus;

/**
 * Church operational reports and service log view ("Novedades").
 * Displays a single unified list showing today's service reports first,
 * followed by unresolved backlog reports from previous services.
 *
 * @returns {JSX.Element} Rendered reports view.
 */
export const ChurchReportsView: React.FC = () => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const navigate = useNavigate();
  const { can } = usePermissions();

  useEffect(() => {
    if (!isFeatureEnabled('churchReports') || !can('reports:manage')) {
      navigate(APP_ROUTES.kidChurch.root, { replace: true });
    }
  }, [navigate, can]);

  const { currentMeeting, currentCampus } = useChurchMeetingStatus();
  const { activeCampusId, activeGroupConfigId, campuses } = useAppSelector(
    (state) => state.volunteerContextSlice,
  );

  const effectiveCampusId = activeCampusId || currentCampus?.id || '';
  const currentVolunteerCampus = campuses?.find((c) => c.id === effectiveCampusId);
  const currentGroupContext = currentVolunteerCampus?.groups?.find(
    (g) => g.id === activeGroupConfigId,
  );
  const effectiveServiceAreaGroupId =
    currentGroupContext?.areas?.find((a) => a.serviceAreaGroupId)?.serviceAreaGroupId || undefined;

  const todayStr = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<FilterStatusType>('ALL');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [closingReportId, setClosingReportId] = useState<string | null>(null);
  const [notingReportId, setNotingReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<IChurchReport | null>(null);

  // Expanded notes state per report
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  // Fetch reports
  const {
    data: reports = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetChurchReportsQuery(
    {
      churchCampusId: effectiveCampusId || undefined,
      churchMeetingId: currentMeeting?.id || undefined,
    },
    { skip: !effectiveCampusId },
  );

  const toggleNotes = (id: string) => {
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter reports by status
  const filteredReports = useMemo(() => {
    if (filterStatus === 'ALL') return reports;
    return reports.filter((r) => r.status === filterStatus);
  }, [reports, filterStatus]);

  // Split into today's reports and previous unresolved backlog reports
  const { todayReports, backlogReports } = useMemo(() => {
    const todayList: IChurchReport[] = [];
    const backlogList: IChurchReport[] = [];

    filteredReports.forEach((report) => {
      const isToday =
        report.date === todayStr ||
        (currentMeeting?.id && report.churchMeetingId === currentMeeting.id);

      if (isToday) todayList.push(report);
      else if (report.status === ReportStatus.OPEN) backlogList.push(report);
      else if (filterStatus === 'CLOSED' || filterStatus === 'INFORMATIVE') backlogList.push(report);
    });

    return {
      todayReports: todayList,
      backlogReports: backlogList,
    };
  }, [filteredReports, todayStr, currentMeeting, filterStatus]);

  const getPriorityBadge = (priority: ReportPriority) => {
    if (priority === ReportPriority.HIGH) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
          <ShieldAlert size={11} />
          {t(`reports.priorities.${priority}` as any)}
        </span>
      );
    }
    if (priority === ReportPriority.MEDIUM) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
          {t(`reports.priorities.${priority}` as any)}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
        {t(`reports.priorities.${priority}` as any)}
      </span>
    );
  };

  const getStatusBadge = (status: ReportStatus) => {
    if (status === ReportStatus.OPEN) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
          <AlertTriangle size={11} />
          {t(`reports.statuses.${status}` as any)}
        </span>
      );
    }
    if (status === ReportStatus.CLOSED) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
          <CheckCircle2 size={11} />
          {t(`reports.statuses.${status}` as any)}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
        <Info size={11} />
        {t(`reports.statuses.${status}` as any)}
      </span>
    );
  };

  // Fetch kids and volunteers to display names resolved from IDs
  const { data: kidsResponse } = useGetKidsQuery(
    { registrationChurchMeetingId: currentMeeting?.id, limit: 100 },
    { skip: !currentMeeting?.id },
  );

  const { data: rawAttendanceKids = [] } = useGetKidGroupAttendanceQuery(
    {
      date: todayStr,
      churchMeetingId: currentMeeting?.id,
    },
    { skip: !currentMeeting?.id },
  );

  const attendanceKids = useMemo<IKid[]>(() => {
    if (!rawAttendanceKids) return [];
    if (Array.isArray(rawAttendanceKids)) return rawAttendanceKids;
    if (typeof rawAttendanceKids === 'string') {
      try {
        return JSON.parse(rawAttendanceKids);
      } catch {
        return [];
      }
    }
    return [];
  }, [rawAttendanceKids]);

  const guardiansMap = useMemo<Record<string, IKidGuardian>>(() => {
    const map: Record<string, IKidGuardian> = {};
    attendanceKids.forEach((k) => {
      (k.relations || []).forEach((g) => {
        map[g.id] = g;
      });
    });
    return map;
  }, [attendanceKids]);

  const { data: volunteerAttendances = [] } = useGetVolunteerAttendanceQuery(
    { churchMeetingId: currentMeeting?.id, limit: 100 },
    { skip: !currentMeeting?.id },
  );

  const kidNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (kidsResponse?.data) {
      kidsResponse.data.forEach((k) => {
        map[k.id] = formatPersonShortName(`${k.firstName} ${k.lastName}`);
      });
    }
    attendanceKids.forEach((k) => {
      map[k.id] = formatPersonShortName(`${k.firstName} ${k.lastName}`);
    });
    return map;
  }, [kidsResponse, attendanceKids]);

  const volunteerNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    volunteerAttendances.forEach((att) => {
      const u = att.volunteerAssignment?.user;
      if (u) {
        map[att.volunteerAssignmentId || att.id] = formatPersonShortName(
          `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        );
      }
    });
    return map;
  }, [volunteerAttendances]);

  // Keep selected report updated when reports list refetches
  useEffect(() => {
    if (selectedReport) {
      const updated = reports.find((r) => r.id === selectedReport.id);
      if (updated) setSelectedReport(updated);
    }
  }, [reports, selectedReport]);

  const renderReportCard = (report: IChurchReport) => {
    const isIncident = report.type === ReportType.CHILD_INCIDENT;
    const isGuardianCall = report.type === ReportType.GUARDIAN_CALL;
    const incidentDetails = isIncident
      ? (report.details as IChildIncidentReportDetails)
      : null;
    const callDetails = isGuardianCall
      ? (report.details as IGuardianCallReportDetails)
      : null;

    const targetKidId = incidentDetails?.kidId || callDetails?.kidId;
    const resolvedKidName = targetKidId ? kidNameMap[targetKidId] : '';

    const matchedGuardian = callDetails?.guardianId ? guardiansMap[callDetails.guardianId] : null;
    const guardianName = matchedGuardian
      ? formatPersonShortName(`${matchedGuardian.firstName} ${matchedGuardian.lastName}`.trim())
      : null;
    const guardianRel = callDetails?.guardianRelationship || (matchedGuardian ? matchedGuardian.relation : '');

    const historyCount = report.history?.length || 0;
    const photoCount = incidentDetails?.photos?.length || 0;

    return (
      <div
        key={report.id}
        onClick={() => setSelectedReport(report)}
        className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-3.5 sm:p-4 transition-all hover:border-primary/40 hover:shadow-xs active:scale-[0.99] cursor-pointer group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Top row: Novedad resaltada (Título principal) + Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight group-hover:text-primary transition-colors truncate">
                {t(`reports.types.${report.type}` as any, { defaultValue: report.type })}
              </h3>
              {getStatusBadge(report.status)}
              {getPriorityBadge(report.priority)}
            </div>

            {/* Subtítulo: De quién fue la novedad en letras pequeñas */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-normal flex-wrap">
              <span className="text-gray-400 font-normal">Niño:</span>
              <span className="font-semibold text-gray-700">
                {resolvedKidName || t('common.unassigned', { ns: 'common', defaultValue: 'Sin asignar' })}
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Calendar size={11} className="text-gray-400" />
                {dayjs(report.date).format('DD MMM YYYY')}
              </span>
            </div>

            {/* Contenido / Detalle de la novedad */}
            {isIncident && incidentDetails && (
              <div className="flex items-center gap-2 text-xs pt-0.5">
                {incidentDetails.description && (
                  <p className="font-medium text-gray-800 truncate flex-1">
                    {incidentDetails.description}
                  </p>
                )}
                {photoCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 shrink-0">
                    📸 {photoCount}
                  </span>
                )}
                {incidentDetails.medicalAttentionType === MedicalAttentionType.DOCTOR_ATTENDED && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 shrink-0 border border-amber-200/50">
                    🩺 Médico
                  </span>
                )}
              </div>
            )}

            {isGuardianCall && (
              <div className="text-xs pt-0.5 truncate">
                {callDetails?.reason ? (
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-medium text-gray-800 truncate">
                      {callDetails.reason}
                    </span>
                    <span className="text-gray-400 font-normal shrink-0">—</span>
                    <span className="text-gray-500 text-[11px] truncate shrink-0">
                      {guardianName ? `${guardianName}${guardianRel ? ` (${guardianRel})` : ''}` : guardianRel ? `(${guardianRel})` : 'Acudiente'}
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-600 text-xs">
                    <span className="text-gray-400">Acudiente: </span>
                    <span className="font-medium text-gray-700">
                      {guardianName ? `${guardianName}${guardianRel ? ` (${guardianRel})` : ''}` : guardianRel ? `(${guardianRel})` : 'Acudiente registrado'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Chevron & history pill */}
          <div className="flex flex-col items-end justify-between self-stretch shrink-0 pl-1">
            <ChevronRight
              size={18}
              className="text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
            />
            {historyCount > 0 && (
              <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100">
                {historyCount} {historyCount === 1 ? 'nota' : 'notas'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (

    <div className="flex-1 flex flex-col p-3.5 sm:p-6 max-w-4xl mx-auto w-full space-y-4 pb-28 sm:pb-32">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="min-w-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {t('reports.title', { ns: 'kidChurch' })}
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              {t('reports.subtitle', { ns: 'kidChurch' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-xl text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 shadow-2xs transition-colors cursor-pointer"
            title={t('common.refresh', 'Actualizar')}
          >
            <RefreshCw size={14} className={clsx(isFetching && 'animate-spin text-primary')} />
          </button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">
              {t('reports.new_report', { ns: 'kidChurch' })}
            </span>
            <span className="sm:hidden">{t('reports.new_report', { ns: 'kidChurch' })}</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {(
          [
            'ALL',
            ReportStatus.OPEN,
            ReportStatus.INFORMATIVE,
            ReportStatus.CLOSED,
          ] as FilterStatusType[]
        ).map((st) => {
          const count =
            st === 'ALL'
              ? reports.length
              : reports.filter((r) => r.status === st).length;

          return (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5',
                filterStatus === st
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80',
              )}
            >
              <span>{t(`reports.filters.${st.toLowerCase()}` as any)}</span>
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-black',
                  filterStatus === st ? 'bg-black/20 text-white' : 'bg-gray-100 text-gray-600',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-3 pt-2">
          <div className="h-28 bg-gray-100 animate-pulse rounded-2xl" />
          <div className="h-28 bg-gray-100 animate-pulse rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-6 pt-1">
          {/* Section 1: Today's Reports */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-gray-500">
                {t('reports.today_section_title', { ns: 'kidChurch' })}
              </h2>
              <span className="text-xs font-bold text-gray-400">
                {todayReports.length}
              </span>
            </div>

            {todayReports.length === 0 ? (
              <div className="bg-gray-50/70 border border-dashed border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-500">
                {t('reports.empty_today', { ns: 'kidChurch' })}
              </div>
            ) : (
              <div className="space-y-3">
                {todayReports.map(renderReportCard)}
              </div>
            )}
          </section>

          {/* Section 2: Previous Unresolved Backlog Reports */}
          {(backlogReports.length > 0 || filterStatus !== 'ALL') && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-gray-500">
                  {t('reports.backlog_section_title', { ns: 'kidChurch' })}
                </h2>
                <span className="text-xs font-bold text-gray-400">
                  {backlogReports.length}
                </span>
              </div>

              {backlogReports.length === 0 ? (
                <div className="bg-gray-50/70 border border-dashed border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-500">
                  {t('reports.empty_backlog', { ns: 'kidChurch' })}
                </div>
              ) : (
                <div className="space-y-3">
                  {backlogReports.map(renderReportCard)}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateChurchReportModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        churchCampusId={effectiveCampusId}
        churchMeetingId={currentMeeting?.id}
        serviceAreaGroupId={effectiveServiceAreaGroupId}
        date={todayStr}
        onSuccess={() => refetch()}
      />

      <CloseChurchReportModal
        open={Boolean(closingReportId)}
        onClose={() => setClosingReportId(null)}
        reportId={closingReportId || ''}
        onSuccess={() => refetch()}
      />

      <AddChurchReportNoteModal
        open={Boolean(notingReportId)}
        onClose={() => setNotingReportId(null)}
        reportId={notingReportId || ''}
        churchMeetingId={currentMeeting?.id}
        date={todayStr}
        onSuccess={() => refetch()}
      />

      {/* Detail Drawer */}
      <ChurchReportDetailDrawer
        report={selectedReport}
        open={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        kidNameMap={kidNameMap}
        volunteerNameMap={volunteerNameMap}
        guardiansMap={guardiansMap}
        onAddNote={(id) => setNotingReportId(id)}
        onCloseReport={(id) => setClosingReportId(id)}
      />
    </div>
  );
};


export default ChurchReportsView;
