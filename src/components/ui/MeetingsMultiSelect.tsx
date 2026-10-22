import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useTranslation } from 'react-i18next';
import { CalendarClock, Check, ChevronDown, CheckSquare, Square } from 'lucide-react';
import clsx from 'clsx';
import { IChurchMeeting } from '@/libs/models/Church';
import { useChurchTerm } from '@/libs/hooks/useTerm';

interface MeetingsMultiSelectProps {
  meetings: IChurchMeeting[];
  selectedMeetingIds: string[];
  onChange: (meetingIds: string[]) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Multi-select dropdown for church meetings and services.
 * Allows selecting "All services" (panoramic view) or choosing specific individual/grouped services.
 *
 * @param {MeetingsMultiSelectProps} props - Component properties.
 * @returns {JSX.Element} Dropdown selector with multi-checkbox capabilities.
 */
export const MeetingsMultiSelect: React.FC<MeetingsMultiSelectProps> = ({
  meetings,
  selectedMeetingIds,
  onChange,
  className = '',
  disabled = false,
}) => {
  const { t } = useTranslation(['common', 'hub']);
  const meetingsTerm = useChurchTerm('meetings');
  const meetingTerm = useChurchTerm('meeting');

  const isAllSelected = selectedMeetingIds.length === 0;

  const handleToggleMeeting = (meetingId: string) => {
    if (selectedMeetingIds.includes(meetingId)) {
      const next = selectedMeetingIds.filter((id) => id !== meetingId);
      onChange(next);
    } else {
      onChange([...selectedMeetingIds, meetingId]);
    }
  };

  const handleSelectAll = () => {
    onChange([]);
  };

  const isFeminine =
    meetingsTerm.toLowerCase().endsWith('a') ||
    meetingsTerm.toLowerCase().endsWith('as') ||
    meetingsTerm.toLowerCase().includes('reuni');

  const getTriggerText = () => {
    if (meetings.length === 0) {
      return t('common:no_meetings_for_day', {
        defaultValue: `Sin ${meetingsTerm.toLowerCase()} este día`,
      });
    }
    if (isAllSelected) {
      const prefix = isFeminine ? 'Todas las' : 'Todos los';
      return t('common:all_services_panoramic', {
        defaultValue: `${prefix} ${meetingsTerm.toLowerCase()} (Panorama)`,
      });
    }
    if (selectedMeetingIds.length === 1) {
      const match = meetings.find((m) => m.id === selectedMeetingIds[0]);
      return match ? match.name : `1 ${meetingTerm.toLowerCase()}`;
    }
    return `${selectedMeetingIds.length} ${meetingsTerm.toLowerCase()} seleccionados`;
  };

  const isDisabled = disabled || meetings.length === 0;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild disabled={isDisabled}>
        <button
          type="button"
          disabled={isDisabled}
          className={clsx(
            'flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl border-2 transition-all text-xs font-semibold outline-hidden',
            meetings.length === 0
              ? 'border-slate-200 bg-slate-50/80 text-slate-400 cursor-not-allowed'
              : isAllSelected
              ? 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 shadow-2xs'
              : 'border-[#0284c7] bg-sky-50/60 text-[#0284c7] shadow-xs',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <CalendarClock
              className={clsx(
                'w-4 h-4 shrink-0',
                meetings.length === 0
                  ? 'text-slate-300'
                  : isAllSelected
                  ? 'text-slate-400'
                  : 'text-[#0284c7]'
              )}
            />
            <span className="truncate">{getTriggerText()}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-[300] space-y-1 animate-in fade-in-80 zoom-in-95"
        >
          {/* Header Action: Todos los servicios */}
          <button
            type="button"
            onClick={handleSelectAll}
            className={clsx(
              'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors text-left',
              isAllSelected
                ? 'bg-sky-50 text-[#0284c7]'
                : 'text-slate-700 hover:bg-slate-50'
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className={clsx(
                  'w-4 h-4 rounded-md border flex items-center justify-center',
                  isAllSelected ? 'border-[#0284c7] bg-[#0284c7] text-white' : 'border-slate-300'
                )}
              >
                {isAllSelected && <Check className="w-3 h-3" strokeWidth={3} />}
              </div>
              <span>
                {t('common:all_services', {
                  defaultValue: `${isFeminine ? 'Todas las' : 'Todos los'} ${meetingsTerm.toLowerCase()}`,
                })}
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {t('common:panoramic', { defaultValue: 'Panorama' })}
            </span>
          </button>

          <DropdownMenu.Separator className="h-px bg-slate-100 my-1" />

          {/* List of individual meetings */}
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
            {meetings.length === 0 ? (
              <div className="py-6 px-3 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-600">
                  {t('common:empty.no_meetings_scheduled', {
                    defaultValue: `No hay ${meetingsTerm.toLowerCase()} programadas para esta fecha.`,
                  })}
                </p>
                <p className="text-[11px] text-slate-400">
                  Selecciona otro día o rango para consultar reuniones.
                </p>
              </div>
            ) : (
              meetings.map((meeting) => {
                const isChecked = selectedMeetingIds.includes(meeting.id);
                return (
                  <button
                    key={meeting.id}
                    type="button"
                    onClick={() => handleToggleMeeting(meeting.id)}
                    className={clsx(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left',
                      isChecked
                        ? 'bg-sky-50/70 text-slate-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50 font-normal'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <div
                        className={clsx(
                          'w-4 h-4 rounded-md border flex items-center justify-center shrink-0',
                          isChecked
                            ? 'border-[#0284c7] bg-[#0284c7] text-white'
                            : 'border-slate-300 bg-white'
                        )}
                      >
                        {isChecked && <Check className="w-3 h-3" strokeWidth={3} />}
                      </div>
                      <span className="truncate">{meeting.name}</span>
                    </div>

                    {meeting.initialHour && (
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {meeting.initialHour}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default MeetingsMultiSelect;
