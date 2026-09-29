import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle2, AlertCircle, Clock, XCircle, MinusCircle, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetVolunteerAssignments } from '@/libs/state/redux/thunks/church/volunteer.thunk';
import {
  useGetVolunteerAttendanceQuery,
  useRecordVolunteerAttendanceMutation,
} from '@/libs/state/redux/api/churchApi';
import {
  EntityState,
  IVolunteerAssignment,
  VolunteerAttendanceStatus,
  VolunteerRole,
} from '@/libs/models';
import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';
import { usePermissions } from '@/libs/hooks/usePermissions';
import { useVolunteerAttendanceLiveSync } from '@/libs/hooks/useVolunteerAttendanceLiveSync';
import { isFeatureEnabled } from '@/config/features';
import { APP_ROUTES } from '@/config/routes';
import { capitalizeWords } from '@/libs/utils/text';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';

const EMPTY_ASSIGNMENTS: IVolunteerAssignment[] = [];

type AttendanceStatusKey =
  | 'volunteer_attendance.status.ATTENDED'
  | 'volunteer_attendance.status.EXCUSED'
  | 'volunteer_attendance.status.UNEXCUSED'
  | 'volunteer_attendance.status.EXEMPT';

interface StatusOption {
  status: VolunteerAttendanceStatus;
  labelKey: AttendanceStatusKey;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
  inactiveClass: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    status: VolunteerAttendanceStatus.ATTENDED,
    labelKey: 'volunteer_attendance.status.ATTENDED',
    icon: CheckCircle2,
    activeClass: 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600',
    inactiveClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100',
  },
  {
    status: VolunteerAttendanceStatus.EXCUSED,
    labelKey: 'volunteer_attendance.status.EXCUSED',
    icon: Clock,
    activeClass: 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-600',
    inactiveClass: 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100',
  },
  {
    status: VolunteerAttendanceStatus.UNEXCUSED,
    labelKey: 'volunteer_attendance.status.UNEXCUSED',
    icon: XCircle,
    activeClass: 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600',
    inactiveClass: 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100',
  },
  {
    status: VolunteerAttendanceStatus.EXEMPT,
    labelKey: 'volunteer_attendance.status.EXEMPT',
    icon: MinusCircle,
    activeClass: 'bg-slate-700 text-white shadow-sm ring-2 ring-slate-700',
    inactiveClass: 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200',
  },
];

/**
 * Mobile-first screen enabling group coordinators to record and update
 * volunteer attendance for their assigned team during an active church meeting.
 *
 * @returns {JSX.Element} Rendered volunteer attendance screen.
 */
export const VolunteerAttendanceView: React.FC = () => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Guard: Feature flag gating
  useEffect(() => {
    if (!isFeatureEnabled('volunteerAttendance')) {
      navigate(APP_ROUTES.kidChurch.root, { replace: true });
    }
  }, [navigate]);

  const { currentMeeting, currentCampus } = useChurchMeetingStatus();
  const { isSupervisor, isGroupCoordinator, isAreaCoordinator } = usePermissions();

  const {
    activeCampusId,
    activeGroupConfigId,
    activeGroupConfigName,
  } = useAppSelector((state) => state.volunteerContextSlice);

  const effectiveCampusId = activeCampusId || currentCampus?.id;
  const effectiveGroupId =
    activeGroupConfigId && activeGroupConfigId !== 'ADMIN_GROUP'
      ? activeGroupConfigId
      : undefined;

  const partitionKey = `attendance-team-${effectiveCampusId}-${effectiveGroupId || 'all'}`;

  const assignments =
    useAppSelector(
      (state) => state.volunteerSlice.assignmentsByPartition[partitionKey],
    ) ?? EMPTY_ASSIGNMENTS;

  const isLoadingAssignments = useAppSelector(
    (state) => state.volunteerSlice.loadingByPartition[partitionKey] || false,
  );

  const [savingAssignmentId, setSavingAssignmentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch active team assignments for this coordinator's group
  const loadTeamData = React.useCallback(() => {
    if (!effectiveCampusId) return;

    dispatch(
      GetVolunteerAssignments({
        churchCampusId: effectiveCampusId,
        ministryGroupConfigId: effectiveGroupId,
        state: EntityState.ACTIVE,
        partitionKey,
        force: true,
      }),
    );
  }, [dispatch, effectiveCampusId, effectiveGroupId, partitionKey]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  const todayIso = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

  // RTK Query: Recorded attendances for this meeting and group
  const {
    data: recordedAttendances = [],
    isLoading: isLoadingAttendance,
    refetch: refetchAttendance,
  } = useGetVolunteerAttendanceQuery(
    {
      churchMeetingId: currentMeeting?.id,
      ministryGroupConfigId: effectiveGroupId,
      attendanceDate: todayIso,
    },
    {
      skip: !currentMeeting?.id,
    },
  );

  // Realtime Live Sync: Receives SSE events and auto-invalidates RTK Query cache
  useVolunteerAttendanceLiveSync({
    churchMeetingId: currentMeeting?.id,
    enabled: Boolean(currentMeeting?.id),
  });

  // Mutation: Record or update volunteer attendance
  const [recordAttendanceMutation] = useRecordVolunteerAttendanceMutation();

  // Map of volunteerAssignmentId -> recorded attendance
  const attendanceMap = useMemo(() => {
    const map = new Map<string, (typeof recordedAttendances)[0]>();
    for (const att of recordedAttendances) {
      if (att.volunteerAssignmentId) {
        map.set(att.volunteerAssignmentId, att);
      }
    }
    return map;
  }, [recordedAttendances]);

  // Filter assignments by search term and role (exclude general coordinators)
  const filteredAssignments = useMemo(() => {
    return assignments.filter((asg) => {
      // Don't take attendance for higher leadership roles if listed
      if (asg.role === VolunteerRole.MINISTRY_GENERAL_COORDINATOR) return false;

      if (!searchTerm.trim()) return true;

      const user = asg.churchMember?.user || asg.user;
      const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.toLowerCase();
      const nationalId = (user?.nationalId || '').toLowerCase();
      const query = searchTerm.toLowerCase().trim();

      return fullName.includes(query) || nationalId.includes(query);
    });
  }, [assignments, searchTerm]);

  // Metrics
  const totalVolunteers = filteredAssignments.length;
  const takenCount = useMemo(() => {
    let count = 0;
    for (const asg of filteredAssignments) {
      if (attendanceMap.has(asg.id)) count++;
    }
    return count;
  }, [filteredAssignments, attendanceMap]);

  const pendingCount = Math.max(0, totalVolunteers - takenCount);

  // Handle status selection
  const handleSelectStatus = async (
    assignmentId: string,
    status: VolunteerAttendanceStatus,
  ) => {
    if (!currentMeeting?.id) {
      toast.error(t('dashboard.missing_config_desc'));
      return;
    }

    setSavingAssignmentId(assignmentId);
    try {
      await recordAttendanceMutation({
        churchMeetingId: currentMeeting.id,
        volunteerAssignmentId: assignmentId,
        attendanceDate: todayIso,
        attendanceStatus: status,
      }).unwrap();

      toast.success(t('volunteer_attendance.save_success'));
    } catch {
      toast.error(t('volunteer_attendance.save_error'));
    } finally {
      setSavingAssignmentId(null);
    }
  };

  const isLoading = isLoadingAssignments || (isLoadingAttendance && recordedAttendances.length === 0);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between gap-2 max-w-3xl mx-auto">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
              aria-label={t('common:actions.back')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                {t('volunteer_attendance.title')}
              </h1>
              <p className="text-xs text-slate-500 font-medium leading-none mt-0.5">
                {activeGroupConfigName || currentCampus?.name || t('volunteer_attendance.subtitle')}
                {currentMeeting?.name ? ` • ${currentMeeting.name}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              loadTeamData();
              refetchAttendance();
            }}
            disabled={isLoading}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
            title={t('common:actions.refresh')}
          >
            <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin text-primary')} />
          </button>
        </div>
      </header>

      {/* Progress & Summary Bar */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-3 shadow-2xs">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-slate-600">
              {t('volunteer_attendance.progress', { taken: takenCount, total: totalVolunteers })}
            </span>
            <span
              className={clsx(
                'font-bold px-2 py-0.5 rounded-full text-[11px]',
                pendingCount === 0 && totalVolunteers > 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800',
              )}
            >
              {pendingCount === 0 && totalVolunteers > 0
                ? t('volunteer_attendance.completed_alert')
                : t('volunteer_attendance.partial_alert', { count: pendingCount })}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full transition-all duration-300 rounded-full',
                pendingCount === 0 && totalVolunteers > 0 ? 'bg-emerald-500' : 'bg-primary',
              )}
              style={{
                width: `${totalVolunteers > 0 ? (takenCount / totalVolunteers) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2.5 max-w-3xl mx-auto w-full">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('volunteer_attendance.search_placeholder')}
          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
        />
      </div>

      {/* Team Volunteer List */}
      <main className="flex-1 px-4 max-w-3xl mx-auto w-full">
        <PullToRefresh
          onRefresh={async () => {
            loadTeamData();
            await refetchAttendance();
          }}
        >
          {isLoading && filteredAssignments.length === 0 ? (
            <div className="mt-4">
              <CellListSkeleton count={4} />
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Users className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {t('volunteer_attendance.no_volunteers')}
              </p>
            </div>
          ) : (
            <div className="space-y-3 mt-1">
              {filteredAssignments.map((assignment) => {
                const user = assignment.churchMember?.user || assignment.user;
                const recorded = attendanceMap.get(assignment.id);
                const currentStatus = recorded?.attendanceStatus;
                const isSaving = savingAssignmentId === assignment.id;
                const firstName = user?.firstName || '';
                const lastName = user?.lastName || '';
                const fullName = capitalizeWords(`${firstName} ${lastName}`.trim()) || 'Servidor(a)';
                const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'SV';

                return (
                  <div
                    key={assignment.id}
                    className={clsx(
                      'bg-white rounded-2xl p-4 border transition-all shadow-2xs',
                      currentStatus
                        ? 'border-slate-200'
                        : 'border-amber-200/80 ring-1 ring-amber-300/40 bg-amber-50/10',
                    )}
                  >
                    {/* Server Info Header */}
                    <div className="flex items-center gap-3 mb-3">
                      {user?.photoUrl ? (
                        <img
                          src={user.photoUrl}
                          alt={fullName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs border border-primary/20 shrink-0">
                          {initials}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="text-sm font-bold text-slate-900 truncate">
                            {fullName}
                          </h2>
                          <span
                            className={clsx(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                              currentStatus
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-amber-100 text-amber-800 font-bold',
                            )}
                          >
                            {currentStatus
                              ? t(`volunteer_attendance.status.${currentStatus}` as AttendanceStatusKey)
                              : t('volunteer_attendance.unmarked')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {assignment.serviceAreaGroup?.ministryArea?.name || assignment.ministryArea?.name || 'Servidor'}
                          {user?.nationalId ? ` • CC ${user.nationalId}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Status Action Buttons (Pills) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                      {STATUS_OPTIONS.map((opt) => {
                        const isSelected = currentStatus === opt.status;
                        const Icon = opt.icon;

                        return (
                          <button
                            key={opt.status}
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleSelectStatus(assignment.id, opt.status)}
                            className={clsx(
                              'flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer',
                              isSelected ? opt.activeClass : opt.inactiveClass,
                            )}
                          >
                            <Icon className={clsx('w-3.5 h-3.5 shrink-0', isSelected ? 'text-white' : 'opacity-80')} />
                            <span className="truncate">{t(opt.labelKey)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </PullToRefresh>
      </main>
    </div>
  );
};

export default VolunteerAttendanceView;
