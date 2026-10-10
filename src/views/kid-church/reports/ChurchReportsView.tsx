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
import { useGetKidsQuery } from '@/libs/state/redux/api/kidChurchApi';
import {
  IChildIncidentReportDetails,
  IChurchReport,
  IGuardianCallReportDetails,
  ReportHistoryAction,
  ReportPriority,
  ReportStatus,
  ReportType,
} from '@/libs/models/ChurchReport';
import { CreateChurchReportModal } from '@/components/reports/CreateChurchReportModal';
import { CloseChurchReportModal } from './CloseChurchReportModal';
import { AddChurchReportNoteModal } from './AddChurchReportNoteModal';
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
  const { canManageChurchReports } = usePermissions();

  useEffect(() => {
    if (!isFeatureEnabled('churchReports') || !canManageChurchReports) {
      navigate(APP_ROUTES.kidChurch.root, { replace: true });
    }
  }, [navigate, canManageChurchReports]);

  const { currentMeeting, currentCampus } = useChurchMeetingStatus();
  const { activeCampusId, activeGroupConfigId } = useAppSelector(
    (state) => state.volunteerContextSlice,
  );

  const effectiveCampusId = activeCampusId || currentCampus?.id || '';
  const effectiveGroupId =
    activeGroupConfigId && activeGroupConfigId !== 'ADMIN_GROUP'
      ? activeGroupConfigId
      : undefined;

  const todayStr = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<FilterStatusType>('ALL');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [closingReportId, setClosingReportId] = useState<string | null>(null);
  const [notingReportId, setNotingReportId] = useState<string | null>(null);

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
      serviceAreaGroupId: effectiveGroupId,
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
    return map;
  }, [kidsResponse]);

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

  const renderReportCard = (report: IChurchReport) => {
    const isHistoryExpanded = expandedNotes[report.id] ?? false;
    const historyCount = report.history?.length || 0;

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

    const description = incidentDetails?.description || '';
    const medicalAttentionType = incidentDetails?.medicalAttentionType || '';
    const attendingDoctor = incidentDetails?.attendingDoctorVolunteerId
      ? volunteerNameMap[incidentDetails.attendingDoctorVolunteerId] || 'Voluntario Médico'
      : '';
    const guardianExplanation = incidentDetails?.guardianExplanationResponse || '';
    const photos = incidentDetails?.photos || [];

    const targetKid = targetKidId
      ? kidsResponse?.data?.find((k) => k.id === targetKidId)
      : null;
    const matchedGuardian = callDetails?.guardianId
      ? targetKid?.relations?.find((g) => g.id === callDetails.guardianId)
      : null;
    const guardianName = matchedGuardian
      ? formatPersonShortName(`${matchedGuardian.firstName} ${matchedGuardian.lastName}`)
      : t('reports.guardian_call_fields.registered_guardian', {
          ns: 'kidChurch',
          defaultValue: 'Acudiente registrado',
        });
    const guardianPhone = matchedGuardian?.phone || '';
    const guardianRel = callDetails?.guardianRelationship || (matchedGuardian ? matchedGuardian.relation : '');
    const callReason = callDetails?.reason || '';

    return (
      <div
        key={report.id}
        className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-4 sm:p-5 transition-shadow hover:shadow-xs space-y-3.5"
      >
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
                {resolvedKidName || (t(`reports.types.${report.type}` as any) || report.type)}
              </h3>
              {getStatusBadge(report.status)}
              {getPriorityBadge(report.priority)}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {dayjs(report.date).format('DD MMM YYYY')}
              </span>
              <span className="text-gray-400">•</span>
              <span className="font-semibold text-gray-600">
                {t(`reports.types.${report.type}` as any)}
              </span>
            </div>
          </div>
        </div>

        {/* Details based on report type */}
        {report.type === ReportType.GUARDIAN_CALL ? (
          <div className="text-xs text-gray-700 leading-relaxed bg-blue-50/50 p-3 rounded-xl border border-blue-100 space-y-2">
            <div>
              <span className="font-bold text-gray-800">
                {t('reports.guardian_call_fields.guardian_label', { ns: 'kidChurch' })}:{' '}
              </span>
              <span className="font-semibold text-blue-900">{guardianName}</span>
              {(guardianRel || guardianPhone) && (
                <span className="text-gray-600">
                  {' '}
                  ({[guardianRel, guardianPhone].filter(Boolean).join(' • ')})
                </span>
              )}
            </div>

            {callReason && (
              <div>
                <span className="font-bold text-gray-800">
                  {t('reports.guardian_call_fields.reason', { ns: 'kidChurch' })}:{' '}
                </span>
                <span>{callReason}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-700 leading-relaxed bg-gray-50/70 p-3 rounded-xl border border-gray-100 space-y-2">
            {description && (
              <div>
                <span className="font-bold text-gray-800">
                  {t('reports.child_fields.description', { ns: 'kidChurch' })}:{' '}
                </span>
                <span>{description}</span>
              </div>
            )}

            {medicalAttentionType && (
              <div>
                <span className="font-bold text-gray-800">
                  {t('reports.child_fields.medical_attention_label', { ns: 'kidChurch' })}:{' '}
                </span>
                <span className="text-gray-700">
                  {t(`reports.child_fields.medical_options.${medicalAttentionType}` as any)}
                </span>
                {attendingDoctor && (
                  <span className="text-amber-800 font-semibold"> — {attendingDoctor}</span>
                )}
              </div>
            )}

            {guardianExplanation && (
              <div className="pt-1 border-t border-gray-200/50">
                <span className="font-bold text-gray-800">
                  {t('reports.child_fields.guardian_explanation_label', { ns: 'kidChurch' })}:{' '}
                </span>
                <span className="font-semibold text-gray-700">
                  {t(`reports.child_fields.guardian_options.${guardianExplanation}` as any)}
                </span>
              </div>
            )}

            {/* Photos attached */}
            {photos.length > 0 && (
              <div className="pt-1.5 border-t border-gray-200/50">
                <p className="font-bold text-gray-800 mb-1.5">
                  {t('reports.child_fields.photos_label', { ns: 'kidChurch' })} ({photos.length}):
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {photos.map((src, idx) => (
                    <img
                      key={idx}
                      src={src}
                      alt={`Evidence ${idx + 1}`}
                      className="w-14 h-14 rounded-xl object-cover border border-gray-200 shadow-2xs shrink-0"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Timeline Accordion */}
        {historyCount > 0 && (
          <div className="border-t border-gray-100 pt-2">
            <button
              type="button"
              onClick={() => toggleNotes(report.id)}
              className="flex items-center justify-between w-full text-xs font-bold text-gray-600 hover:text-gray-900 py-1 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                {t('reports.notes_history', { count: historyCount, ns: 'kidChurch' })}
              </span>
              {isHistoryExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isHistoryExpanded && (
              <div className="mt-2 space-y-2.5 pl-2 border-l-2 border-primary/30">
                {report.history?.map((entry) => {
                  const isCreated = entry.action === ReportHistoryAction.CREATED;
                  const isClosed = entry.action === ReportHistoryAction.CLOSED;
                  const isUpdate = entry.action === ReportHistoryAction.UPDATE;

                  return (
                    <div
                      key={entry.id}
                      className={clsx(
                        'text-xs p-2.5 rounded-xl space-y-1',
                        isClosed && 'bg-emerald-50/70 border border-emerald-200/60 text-emerald-950',
                        isCreated && 'bg-blue-50/60 border border-blue-200/60 text-blue-950',
                        isUpdate && 'bg-gray-50 border border-gray-100 text-gray-800',
                      )}
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          {isClosed && <CheckCircle2 size={12} className="text-emerald-600" />}
                          {isCreated && <Info size={12} className="text-blue-600" />}
                          {isUpdate && <MessageSquare size={12} className="text-primary" />}
                          <span
                            className={clsx(
                              'uppercase font-bold tracking-wider text-[10px]',
                              isClosed && 'text-emerald-700',
                              isCreated && 'text-blue-700',
                              isUpdate && 'text-gray-700',
                            )}
                          >
                            {t(`reports.history_actions.${entry.action}` as any) || entry.action}
                          </span>
                        </span>
                        <span className="text-gray-500 font-normal">
                          {dayjs(entry.createdAt).format('DD/MM/YYYY HH:mm')}
                        </span>
                      </div>
                      {entry.note && (
                        <p
                          className={clsx(
                            'leading-relaxed',
                            isClosed ? 'text-emerald-900 font-medium' : 'text-gray-700',
                          )}
                        >
                          {entry.note}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons for OPEN reports */}
        {report.status === ReportStatus.OPEN && (
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setNotingReportId(report.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              {t('reports.actions.add_note', { ns: 'kidChurch' })}
            </button>
            <button
              type="button"
              onClick={() => setClosingReportId(report.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors cursor-pointer"
            >
              {t('reports.actions.close_case', { ns: 'kidChurch' })}
            </button>
          </div>
        )}
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
        serviceAreaGroupId={effectiveGroupId}
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
    </div>
  );
};

export default ChurchReportsView;
