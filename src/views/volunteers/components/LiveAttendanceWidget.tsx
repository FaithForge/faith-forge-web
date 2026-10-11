import React from 'react';
import { ClipboardCheck, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LiveAttendanceWidgetProps {
  meetingName: string;
  attendanceSummary: {
    total: number;
    counts: {
      taken: number;
      pending: number;
      attended: number;
    };
  };
  onClick: () => void;
}

/**
 * Notice banner displayed on top of the Team Directory when a church service is active.
 * Shows registration progress and offers a direct 1-tap entry to volunteer attendance check.
 */
export const LiveAttendanceWidget: React.FC<LiveAttendanceWidgetProps> = ({
  meetingName,
  attendanceSummary,
  onClick,
}) => {
  const { t } = useTranslation(['kidChurch']);

  return (
    <div
      onClick={onClick}
      className="bg-amber-50 hover:bg-amber-100/70 border border-amber-200/90 rounded-2xl p-2.5 px-3.5 flex items-center justify-between gap-3 shadow-2xs cursor-pointer transition-all active:scale-[0.99]"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8.5 h-8.5 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <ClipboardCheck className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-amber-950 leading-tight">
            {meetingName}
          </h4>

          <p className="text-[11px] text-amber-900 font-medium leading-tight mt-0.5">
            {t('supervisor_team.attendance_widget.registered_count', {
              taken: attendanceSummary.counts.taken,
              total: attendanceSummary.total,
            })}
          </p>

          <p className="text-[11px] text-amber-800 font-medium leading-tight mt-0.5">
            {attendanceSummary.counts.pending === 0
              ? t('supervisor_team.attendance_widget.completed_no_missing')
              : t('supervisor_team.attendance_widget.pending_missing', {
                  pending: attendanceSummary.counts.pending,
                })}
          </p>
        </div>
      </div>

      <div className="bg-primary hover:bg-primary-dark text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shrink-0 shadow-2xs whitespace-nowrap">
        <span>
          {attendanceSummary.counts.pending === 0
            ? t('supervisor_team.attendance_widget.view_action')
            : t('supervisor_team.attendance_widget.take_action')}
        </span>
        <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};
