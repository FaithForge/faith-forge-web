import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Check,
  FileText,
  Minus,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import {
  IVolunteerAssignment,
  MinistryType,
  VolunteerAttendanceStatus,
  VolunteerRole,
} from '@/libs/models';
import { getVolunteerRoleLabel, useKidsTerm } from '@/libs/hooks/useTerm';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { capitalizeWords } from '@/libs/utils/text';
import { RootState } from '@/libs/state/redux/store';
import Button from '@/components/ui/Button';

type AttendanceStatusKey =
  | 'volunteer_attendance.short_status.ATTENDED'
  | 'volunteer_attendance.short_status.EXCUSED'
  | 'volunteer_attendance.short_status.UNEXCUSED'
  | 'volunteer_attendance.short_status.EXEMPT';

interface StatusOption {
  status: VolunteerAttendanceStatus;
  labelKey: AttendanceStatusKey;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  selectedClass: string;
  unselectedClass: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    status: VolunteerAttendanceStatus.ATTENDED,
    labelKey: 'volunteer_attendance.short_status.ATTENDED',
    icon: Check,
    iconColor: 'text-emerald-600',
    selectedClass:
      'bg-emerald-600 text-white font-bold shadow-xs border-emerald-600 ring-2 ring-emerald-600/30 scale-[1.02]',
    unselectedClass:
      'bg-slate-50/90 text-slate-700 border-slate-200/90 hover:bg-emerald-50/70 hover:text-emerald-800 hover:border-emerald-300',
  },
  {
    status: VolunteerAttendanceStatus.EXCUSED,
    labelKey: 'volunteer_attendance.short_status.EXCUSED',
    icon: FileText,
    iconColor: 'text-amber-600',
    selectedClass:
      'bg-amber-500 text-white font-bold shadow-xs border-amber-500 ring-2 ring-amber-500/30 scale-[1.02]',
    unselectedClass:
      'bg-slate-50/90 text-slate-700 border-slate-200/90 hover:bg-amber-50/70 hover:text-amber-800 hover:border-amber-200',
  },
  {
    status: VolunteerAttendanceStatus.UNEXCUSED,
    labelKey: 'volunteer_attendance.short_status.UNEXCUSED',
    icon: X,
    iconColor: 'text-rose-600',
    selectedClass:
      'bg-rose-600 text-white font-bold shadow-xs border-rose-600 ring-2 ring-rose-600/30 scale-[1.02]',
    unselectedClass:
      'bg-slate-50/90 text-slate-700 border-slate-200/90 hover:bg-rose-50/70 hover:text-rose-800 hover:border-rose-200',
  },
  {
    status: VolunteerAttendanceStatus.EXEMPT,
    labelKey: 'volunteer_attendance.short_status.EXEMPT',
    icon: Minus,
    iconColor: 'text-slate-500',
    selectedClass:
      'bg-slate-700 text-white font-bold shadow-xs border-slate-700 ring-2 ring-slate-700/30 scale-[1.02]',
    unselectedClass:
      'bg-slate-50/90 text-slate-700 border-slate-200/90 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300',
  },
];

/**
 * Resolves the styling classes for the volunteer attendance status badge.
 *
 * @param {VolunteerAttendanceStatus} [status] - Current attendance status.
 * @returns {string} Tailwind CSS class string.
 */
const getStatusBadgeClass = (status?: VolunteerAttendanceStatus): string => {
  switch (status) {
    case VolunteerAttendanceStatus.ATTENDED:
      return 'bg-emerald-50 text-emerald-800 border-emerald-200/90 font-bold';
    case VolunteerAttendanceStatus.EXCUSED:
      return 'bg-amber-50 text-amber-800 border-amber-200/90 font-bold';
    case VolunteerAttendanceStatus.UNEXCUSED:
      return 'bg-rose-50 text-rose-800 border-rose-200/90 font-bold';
    case VolunteerAttendanceStatus.EXEMPT:
      return 'bg-slate-100 text-slate-700 border-slate-200 font-bold';
    default:
      return 'bg-amber-100/90 text-amber-900 border-amber-300 font-extrabold';
  }
};

/**
 * Determines whether a volunteer assignment belongs to a supervisory or leadership role.
 *
 * @param {VolunteerRole} [role] - The volunteer assignment role.
 * @returns {boolean} True if the role is supervisory or coordinating, false otherwise.
 */
export const isSupervisorRole = (role?: VolunteerRole): boolean => {
  return (
    role === VolunteerRole.SUPERVISOR ||
    role === VolunteerRole.GROUP_COORDINATOR ||
    role === VolunteerRole.AREA_GENERAL_COORDINATOR ||
    role === VolunteerRole.MINISTRY_GENERAL_COORDINATOR
  );
};

export interface AreaAttendanceDrawerProps {
  open: boolean;
  onClose: () => void;
  areaName: string;
  assignments: IVolunteerAssignment[];
  onSelectStatus: (
    assignmentId: string,
    status: VolunteerAttendanceStatus,
  ) => Promise<void>;
  savingAssignmentIds: Record<string, boolean>;
  optimisticStatusMap: Record<string, VolunteerAttendanceStatus>;
  attendanceMap: Map<string, { attendanceStatus: VolunteerAttendanceStatus }>;
  churchOverrides?: Record<string, string>;
}

/**
 * Slide-over lateral sheet for recording volunteer attendance for a specific area.
 *
 * @param {AreaAttendanceDrawerProps} props - Component props.
 * @returns {JSX.Element | null} Rendered slide-over drawer or null if closed.
 */
export const AreaAttendanceDrawer: React.FC<AreaAttendanceDrawerProps> = ({
  open,
  onClose,
  areaName,
  assignments,
  onSelectStatus,
  savingAssignmentIds,
  optimisticStatusMap,
  attendanceMap,
  churchOverrides,
}) => {
  const { t } = useTranslation(['kidChurch', 'common']);
  useModalBackClose(open, onClose);

  const classroomTerm = useKidsTerm('classroom');
  const teacherTerm = useKidsTerm('teacher');
  const teachersTerm = useKidsTerm('teachers');

  const [searchTerm, setSearchTerm] = useState('');

  // Calculate live counts for this specific area
  const totalCount = assignments.length;
  const takenCount = useMemo(() => {
    let count = 0;
    for (const asg of assignments) {
      const hasStatus =
        optimisticStatusMap[asg.id] ?? attendanceMap.get(asg.id)?.attendanceStatus;
      if (hasStatus) count++;
    }
    return count;
  }, [assignments, optimisticStatusMap, attendanceMap]);

  const pendingCount = Math.max(0, totalCount - takenCount);
  const percentComplete =
    totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;
  const isComplete = totalCount > 0 && pendingCount === 0;

  const isCoordinatorsArea = useMemo(() => {
    const isNamedCoordinators = areaName.toLowerCase().includes('coordinador');
    const allAreCoordinators =
      assignments.length > 0 &&
      assignments.every(
        (asg) =>
          asg.role === VolunteerRole.GROUP_COORDINATOR ||
          asg.role === VolunteerRole.AREA_GENERAL_COORDINATOR ||
          asg.role === VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
      );
    return isNamedCoordinators || allAreCoordinators;
  }, [areaName, assignments]);

  const kidsMinistryOverrides = useSelector(
    (state: RootState) =>
      state.churchCampusSlice.ministryTerminologyOverrides?.[MinistryType.KIDS] ||
      state.churchCampusSlice.church?.ministryTerminologyOverrides?.[MinistryType.KIDS],
  );

  const supervisorsLabel = useMemo(() => {
    return getVolunteerRoleLabel(VolunteerRole.SUPERVISOR, {
      ministryType: MinistryType.KIDS,
      churchOverrides,
      ministryOverrides: kidsMinistryOverrides,
      plural: true,
      short: true,
    });
  }, [churchOverrides, kidsMinistryOverrides]);

  // Filter and split into Supervisors and Volunteers, each sorted alphabetically by full name
  const { supervisorAssignments, volunteerAssignments, hasAnyResults } = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    const matchesQuery = (asg: IVolunteerAssignment) => {
      if (!query) return true;
      const user = asg.churchMember?.user || asg.user;
      const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.toLowerCase();
      const nationalId = (user?.nationalId || '').toLowerCase();
      return fullName.includes(query) || nationalId.includes(query);
    };

    const sortByName = (a: IVolunteerAssignment, b: IVolunteerAssignment) => {
      const userA = a.churchMember?.user || a.user;
      const userB = b.churchMember?.user || b.user;
      const nameA = `${userA?.firstName || ''} ${userA?.lastName || ''}`.trim();
      const nameB = `${userB?.firstName || ''} ${userB?.lastName || ''}`.trim();
      return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
    };

    const supervisors: IVolunteerAssignment[] = [];
    const volunteers: IVolunteerAssignment[] = [];

    for (const asg of assignments) {
      if (!matchesQuery(asg)) continue;

      if (isSupervisorRole(asg.role)) {
        supervisors.push(asg);
      } else {
        volunteers.push(asg);
      }
    }

    supervisors.sort(sortByName);
    volunteers.sort(sortByName);

    return {
      supervisorAssignments: supervisors,
      volunteerAssignments: volunteers,
      hasAnyResults: supervisors.length > 0 || volunteers.length > 0,
    };
  }, [assignments, searchTerm]);

  const leadershipTitle = useMemo(() => {
    if (supervisorAssignments.length === 0) return supervisorsLabel;

    const hasSupervisors = supervisorAssignments.some(
      (asg) => asg.role === VolunteerRole.SUPERVISOR,
    );
    const hasCoordinators = supervisorAssignments.some(
      (asg) =>
        asg.role === VolunteerRole.GROUP_COORDINATOR ||
        asg.role === VolunteerRole.AREA_GENERAL_COORDINATOR ||
        asg.role === VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
    );

    if (hasCoordinators && !hasSupervisors) {
      return getVolunteerRoleLabel(VolunteerRole.GROUP_COORDINATOR, {
        ministryType: MinistryType.KIDS,
        churchOverrides,
        ministryOverrides: kidsMinistryOverrides,
        plural: true,
        short: true,
      });
    }

    return supervisorsLabel;
  }, [supervisorAssignments, supervisorsLabel, churchOverrides, kidsMinistryOverrides]);

  const showLeadershipHeader =
    !isCoordinatorsArea &&
    (volunteerAssignments.length > 0 ||
      supervisorAssignments.some((asg) => asg.role === VolunteerRole.SUPERVISOR));

  const showVolunteersHeader =
    !isCoordinatorsArea && supervisorAssignments.length > 0;

  const searchPlaceholder = useMemo(() => {
    if (isCoordinatorsArea) {
      return `Buscar coordinador(a) en ${areaName}...`;
    }
    return t('volunteer_attendance.area_drawer_search_placeholder', {
      area: areaName,
      teacher: (teacherTerm || 'servidor').toLowerCase(),
    });
  }, [isCoordinatorsArea, areaName, teacherTerm, t]);

  const [topOffset, setTopOffset] = useState<number>(52);

  useEffect(() => {
    if (!open) return;
    const updateOffset = () => {
      const topBarEl = document.querySelector('header.bg-primary');
      if (topBarEl) {
        setTopOffset(topBarEl.getBoundingClientRect().height);
      }
    };
    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, [open]);

  if (!open) return null;

  /**
   * Renders the individual attendance card for a volunteer assignment.
   *
   * @param {IVolunteerAssignment} assignment - Volunteer assignment record.
   * @returns {JSX.Element} Attendance card item.
   */
  const renderAssignmentCard = (assignment: IVolunteerAssignment): JSX.Element => {
    const user = assignment.churchMember?.user || assignment.user;
    const recorded = attendanceMap.get(assignment.id);
    const currentStatus =
      optimisticStatusMap[assignment.id] ?? recorded?.attendanceStatus;
    const isSaving = Boolean(savingAssignmentIds[assignment.id]);
    const firstName = user?.firstName || '';
    const lastName = user?.lastName || '';
    const fullName =
      capitalizeWords(`${firstName} ${lastName}`.trim()) || 'Servidor(a)';
    const initials =
      `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'SV';
    const isSupervisor = isSupervisorRole(assignment.role);
    const roleLabel = getVolunteerRoleLabel(assignment.role, {
      ministryType: MinistryType.KIDS,
      churchOverrides,
      ministryOverrides: {
        ...kidsMinistryOverrides,
        ...assignment.ministry?.terminologyOverrides,
      },
      short: true,
    });

    return (
      <div
        key={assignment.id}
        className={clsx(
          'bg-white rounded-2xl p-3 sm:p-3.5 border transition-all shadow-2xs hover:shadow-xs',
          currentStatus
            ? 'border-slate-200/90'
            : 'border-amber-300/80 ring-1 ring-amber-300/40 bg-amber-50/15',
        )}
      >
        {/* Top: Avatar + Full Name & Subtitle on Left, Status Badge on Right */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {user?.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={fullName}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div
                className={clsx(
                  'w-10 h-10 rounded-full font-bold flex items-center justify-center text-xs shrink-0 border',
                  isSupervisor
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-primary/10 text-primary border-primary/20',
                )}
              >
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug break-words">
                {fullName}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap mt-0.5">
                <span className="font-medium text-slate-700">
                  {assignment.serviceAreaGroup?.ministryArea?.name ||
                    assignment.ministryArea?.name ||
                    t('volunteer_attendance.other_areas')}
                </span>
                <span className="text-slate-300">•</span>
                <span
                  className={clsx(
                    'font-medium',
                    isSupervisor ? 'text-primary font-bold' : 'text-slate-600',
                  )}
                >
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Top Right Status Badge */}
          <span
            className={clsx(
              'px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 border whitespace-nowrap shadow-2xs',
              getStatusBadgeClass(currentStatus),
            )}
          >
            {currentStatus
              ? t(
                  `volunteer_attendance.short_status.${currentStatus}` as AttendanceStatusKey,
                )
              : t('volunteer_attendance.unmarked')}
          </span>
        </div>

        {/* 4 Segmented Status Buttons */}
        <div
          className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-3 pt-2.5 border-t border-slate-100"
          role="group"
          aria-label={fullName}
        >
          {STATUS_OPTIONS.map((opt) => {
            const isSelected = currentStatus === opt.status;
            const Icon = opt.icon;
            const label = t(opt.labelKey);

            return (
              <button
                key={opt.status}
                type="button"
                disabled={isSaving}
                title={label}
                aria-label={`${fullName}: ${label}`}
                aria-pressed={isSelected}
                onClick={() => onSelectStatus(assignment.id, opt.status)}
                className={clsx(
                  'flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-2 rounded-xl transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50 border',
                  isSelected ? opt.selectedClass : opt.unselectedClass,
                )}
              >
                <Icon
                  className={clsx(
                    'w-4 h-4 shrink-0 stroke-[2.5]',
                    isSelected ? 'text-white' : opt.iconColor,
                  )}
                />
                <span className="text-[10px] sm:text-xs font-semibold leading-tight text-center">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[190] overflow-hidden"
      style={{ top: `${topOffset}px` }}
      role="dialog"
      aria-modal="true"
      aria-label={areaName}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-2xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Lateral Sheet Panel */}
      <div className="absolute inset-y-0 right-0 w-full sm:max-w-xl md:max-w-2xl bg-slate-50 flex flex-col shadow-2xl z-10 border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Sticky Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition-all shrink-0 cursor-pointer"
                aria-label={t('common:actions.back')}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 leading-tight truncate">
                  {t('volunteer_attendance.area_drawer_title', { area: areaName })}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-slate-500 font-medium">
                    {t('volunteer_attendance.progress_count', {
                      taken: takenCount,
                      total: totalCount,
                    })}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span
                    className={clsx(
                      'text-[11px] font-bold px-2 py-0.2 rounded-full border',
                      isComplete
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border-amber-200',
                    )}
                  >
                    {isComplete
                      ? t('volunteer_attendance.area_complete')
                      : t('volunteer_attendance.area_pending', { count: pendingCount })}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-bold text-slate-600">
                    {percentComplete}%
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onClose}
              className="shrink-0 font-bold"
            >
              {t('volunteer_attendance.area_drawer_done')}
            </Button>
          </div>

          {/* Animated Live Progress Bar */}
          <div className="mt-2.5">
            <div className="w-full bg-slate-100 h-1.5 sm:h-2 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full transition-all duration-300 rounded-full',
                  isComplete ? 'bg-emerald-500' : 'bg-primary',
                )}
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <div className="px-4 pt-3 pb-2 bg-white/80 border-b border-slate-200/70">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-9 py-2 text-sm text-slate-800 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                aria-label={t('volunteer_attendance.clear_filters')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Volunteer List */}
        <main className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {!hasAnyResults ? (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Users className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {assignments.length === 0
                  ? t('volunteer_attendance.area_drawer_empty_classroom', {
                      classroom: classroomTerm.toLowerCase(),
                      teachers: teachersTerm.toLowerCase(),
                    })
                  : t('volunteer_attendance.area_drawer_empty_search', {
                      teachers: teachersTerm.toLowerCase(),
                    })}
              </p>
              {assignments.length > 0 && searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="mt-3 text-xs font-bold text-primary hover:text-primary-dark underline cursor-pointer"
                >
                  {t('volunteer_attendance.clear_filters')}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Supervisors / Coordinators Section */}
              {supervisorAssignments.length > 0 && (
                <section className="space-y-2.5" aria-label={leadershipTitle}>
                  {showLeadershipHeader && (
                    <div className="flex items-center gap-2 pt-1 pb-0.5 px-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{leadershipTitle}</span>
                        <span className="text-[11px] font-bold text-slate-400">
                          ({supervisorAssignments.length})
                        </span>
                      </div>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                  )}

                  {supervisorAssignments.map(renderAssignmentCard)}
                </section>
              )}

              {/* Servidores / Maestros Section */}
              {volunteerAssignments.length > 0 && (
                <section className="space-y-2.5" aria-label={teachersTerm}>
                  {showVolunteersHeader && (
                    <div className="flex items-center gap-2 pt-2 pb-0.5 px-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
                        <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{teachersTerm}</span>
                        <span className="text-[11px] font-bold text-slate-400">
                          ({volunteerAssignments.length})
                        </span>
                      </div>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                  )}

                  {volunteerAssignments.map(renderAssignmentCard)}
                </section>
              )}
            </>
          )}

          {/* Bottom spacer for comfortable scrolling */}
          <div className="h-16 shrink-0" aria-hidden="true" />
        </main>

        {/* Bottom Bar: Action to return to dashboard */}
        <footer className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3 shadow-lg z-20">
          <Button
            type="button"
            variant="primary"
            onClick={onClose}
            className="w-full font-bold flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{t('volunteer_attendance.area_drawer_done')}</span>
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default AreaAttendanceDrawer;
