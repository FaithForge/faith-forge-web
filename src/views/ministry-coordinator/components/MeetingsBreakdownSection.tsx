import { useChurchTerm, useKidsTerm } from '@/libs/hooks/useTerm';
import {
  IMinistryGroupConfig,
  IMinistryMeetingStatBreakdown,
} from '@/libs/models/Ministry';
import clsx from 'clsx';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  HelpCircle,
  Users,
} from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChild } from 'react-icons/fa6';

interface MeetingsBreakdownSectionProps {
  meetingsBreakdown: IMinistryMeetingStatBreakdown[];
  groups?: IMinistryGroupConfig[];
  isKidsMinistry?: boolean;
  onSelectMeeting?: (meetingId: string) => void;
}

/**
 * Section displaying the analytical breakdown by meeting/service across dates.
 * Highlights the scheduled groups for each meeting, volunteer attendance,
 * and children counts.
 *
 * @param {MeetingsBreakdownSectionProps} props - Section properties.
 * @returns {JSX.Element} Rendered meetings breakdown cards.
 */
export const MeetingsBreakdownSection: React.FC<
  MeetingsBreakdownSectionProps
> = ({
  meetingsBreakdown,
  groups = [],
  isKidsMinistry = false,
  onSelectMeeting,
}) => {
  const { t } = useTranslation(['hub', 'common', 'kidChurch']);
  const meetingsTerm = useChurchTerm('meetings');
  const meetingTerm = useChurchTerm('meeting');
  const volunteersTerm = useChurchTerm('volunteers');
  const kidsModuleName = useKidsTerm('module_alias');

  const groupNameMap = useMemo(() => {
    const map = new Map<string, string>();
    groups.forEach((g) => map.set(g.id, g.name));
    return map;
  }, [groups]);

  if (!meetingsBreakdown || meetingsBreakdown.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-[#0284c7]" />
            <span>
              {t('hub:breakdown_by_meetings_title', {
                defaultValue: `Estadística por cada ${meetingTerm}`,
              })}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('hub:breakdown_by_meetings_subtitle', {
              defaultValue: `Desglose de asistencia de servidores, grupos asignados y métricas por servicio`,
            })}
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
          {meetingsBreakdown.length}{' '}
          {meetingsBreakdown.length === 1
            ? meetingTerm.toLowerCase()
            : meetingsTerm.toLowerCase()}{' '}
          registradas
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {meetingsBreakdown.map((item) => {
          const scheduledNames = (item.scheduledGroupIds || [])
            .map((id) => groupNameMap.get(id))
            .filter(Boolean);

          const totalAssigned = item.volunteers.totalAssigned || 0;
          const attended = item.volunteers.attended || 0;
          const pct = item.volunteers.attendancePercent || 0;

          // Format service date: "Viernes, 24 Octubre 2026"
          const formattedDate = dayjs(item.serviceDate)
            .locale('es')
            .format('dddd, D [de] MMMM');
          const capitalizedDate =
            formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

          return (
            <div
              key={`${item.meetingId}_${item.serviceDate}`}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all shadow-2xs space-y-4"
            >
              {/* Card Header: Meeting Name, Date, Time */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-slate-900 truncate">
                    {item.meetingName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {capitalizedDate}
                    {item.initialHour && ` • ${item.initialHour}`}
                  </p>
                </div>

                {onSelectMeeting && (
                  <button
                    type="button"
                    onClick={() => onSelectMeeting(item.meetingId)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-[#0284c7] bg-sky-50 hover:bg-sky-100 transition-colors shrink-0"
                    title={`Ver solo ${item.meetingName}`}
                  >
                    <span>Ver servicio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Scheduled Group(s) badge */}
              {scheduledNames.length > 0 && (
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-sky-50 text-[11px] font-semibold text-sky-900 border border-sky-200/60">
                  <CalendarCheck className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                  <span className="font-bold">
                    {scheduledNames.length === 1
                      ? 'Grupo asignado:'
                      : 'Grupos asignados:'}
                  </span>
                  <span className="text-[#0284c7] font-extrabold">
                    {scheduledNames.join(', ')}
                  </span>
                </div>
              )}

              {/* Volunteer attendance row */}
              <div className="space-y-2 pt-2 border-t border-slate-200/70">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#0284c7]" />
                    {volunteersTerm}: {attended} / {totalAssigned}
                  </span>
                  <span className="font-black text-emerald-600">{pct}%</span>
                </div>

                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className={clsx(
                      'h-full rounded-full transition-all',
                      pct >= 75
                        ? 'bg-emerald-500'
                        : pct >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500',
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-1">
                  <div className="bg-emerald-50 text-emerald-800 p-1 rounded-lg font-semibold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{attended} asistieron</span>
                  </div>
                  <div className="bg-sky-50 text-sky-800 p-1 rounded-lg font-semibold flex items-center justify-center gap-1">
                    <HelpCircle className="w-3 h-3 text-sky-600 shrink-0" />
                    <span>{item.volunteers.excused} excusados</span>
                  </div>
                  <div className="bg-rose-50 text-rose-800 p-1 rounded-lg font-semibold flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                    <span>{item.volunteers.unexcused} inasist.</span>
                  </div>
                </div>
              </div>

              {/* Kids attendance row if ministry is KIDS */}
              {isKidsMinistry && item.kids && (
                <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <FaChild className="w-3.5 h-3.5 text-indigo-500" />
                      {kidsModuleName}: {item.kids.totalKids} niños
                    </span>
                    {item.kids.newKids !== undefined &&
                      item.kids.newKids > 0 && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          +{item.kids.newKids} nuevos
                        </span>
                      )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>Niños: {item.kids.boys}</span>
                    <span>Niñas: {item.kids.girls}</span>
                    <span>{item.kids.byClassroom?.length || 0} salones</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MeetingsBreakdownSection;
