import * as Popover from '@radix-ui/react-popover';
import clsx from 'clsx';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DATE_FORMAT_ISO } from '@/libs/common-types/constants';

export type DateCalendarPickerProps = {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  allowedDaysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  allowedDates?: string[]; // exact YYYY-MM-DD dates that are allowed
  label?: string;
  helpText?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  popoverZIndex?: string;
};

type CalendarCell = {
  date: string;
  day: number;
  isDisabled: boolean;
  isAllowedMeetingDay: boolean;
  isSelected: boolean;
  isToday: boolean;
};

/**
 * Modern custom calendar date picker aligned with the app design system.
 * Supports day-of-week and exact-date restrictions (e.g. enabling only dates with church meetings).
 * Operates as an anchored, responsive popover tailored for desktop and mobile without disruptive full-screen modal overlays.
 * Dynamically inherits active profile / role theme colors (`primary`, `primary-foreground`).
 *
 * @param {DateCalendarPickerProps} props - Value, date limits, allowed days/dates, label, callback, and disabled state.
 * @returns {JSX.Element} Rendered date calendar picker.
 */
export const DateCalendarPicker: React.FC<DateCalendarPickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  allowedDaysOfWeek,
  allowedDates,
  label,
  helpText,
  placeholder,
  disabled = false,
  className = '',
  align = 'start',
  side,
  popoverZIndex = 'z-[10050]',
}) => {
  const { t } = useTranslation(['common', 'hub', 'kidChurch']);
  const [isOpen, setIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const [viewMonth, setViewMonth] = useState(
    dayjs(value || maxDate || undefined).startOf('month'),
  );

  useEffect(() => {
    setDraftValue(value);
    setViewMonth(dayjs(value || maxDate || undefined).startOf('month'));
  }, [maxDate, value]);

  const normalizedMinDate = useMemo(
    () => (minDate ? dayjs(minDate).startOf('day') : null),
    [minDate],
  );
  const normalizedMaxDate = useMemo(
    () => (maxDate ? dayjs(maxDate).startOf('day') : null),
    [maxDate],
  );
  const todayStr = useMemo(() => dayjs().format(DATE_FORMAT_ISO), []);

  const weekDays = useMemo(() => ['L', 'M', 'X', 'J', 'V', 'S', 'D'], []);

  const monthCells = useMemo(() => {
    const startOfMonth = viewMonth.startOf('month');
    const daysInMonth = viewMonth.daysInMonth();
    const monthStartOffset = (startOfMonth.day() + 6) % 7;
    const totalCells = Math.ceil((monthStartOffset + daysInMonth) / 7) * 7;
    const currentSelection = draftValue
      ? dayjs(draftValue).startOf('day')
      : null;

    const cells: Array<CalendarCell | null> = [];

    for (let index = 0; index < totalCells; index += 1) {
      const dayNumber = index - monthStartOffset + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        cells.push(null);
        continue;
      }

      const cellDate = startOfMonth.date(dayNumber).format(DATE_FORMAT_ISO);
      const currentDate = dayjs(cellDate).startOf('day');

      const isDayOfWeekAllowed =
        allowedDaysOfWeek && allowedDaysOfWeek.length > 0
          ? allowedDaysOfWeek.includes(currentDate.day())
          : true;

      const isDateAllowed =
        allowedDates && allowedDates.length > 0
          ? allowedDates.includes(cellDate)
          : true;

      // If exact dates with stats exist, use them; otherwise fallback to allowed days of week
      const isAllowedMeetingDay =
        allowedDates && allowedDates.length > 0
          ? isDateAllowed
          : isDayOfWeekAllowed;

      const isDisabled =
        !isAllowedMeetingDay ||
        (normalizedMinDate
          ? currentDate.isBefore(normalizedMinDate, 'day')
          : false) ||
        (normalizedMaxDate
          ? currentDate.isAfter(normalizedMaxDate, 'day')
          : false);

      cells.push({
        date: cellDate,
        day: dayNumber,
        isDisabled,
        isAllowedMeetingDay,
        isSelected:
          !!currentSelection && currentSelection.isSame(currentDate, 'day'),
        isToday: cellDate === todayStr,
      });
    }

    return cells;
  }, [
    draftValue,
    normalizedMaxDate,
    normalizedMinDate,
    viewMonth,
    todayStr,
    allowedDaysOfWeek,
    allowedDates,
  ]);

  const monthTitle = useMemo(() => {
    const titleFormatter = new Intl.DateTimeFormat('es-ES', {
      month: 'long',
      year: 'numeric',
    });
    const raw = titleFormatter.format(viewMonth.toDate());
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [viewMonth]);

  const handleDayClick = (
    date: string,
    isDisabled: boolean,
    e?: React.MouseEvent,
  ) => {
    e?.stopPropagation();
    if (isDisabled) return;
    setDraftValue(date);
    onChange(date);
    setIsOpen(false);
  };

  const handleQuickSelectRecent = (e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (allowedDates && allowedDates.length > 0) {
      const latest = allowedDates[0];
      setDraftValue(latest);
      setViewMonth(dayjs(latest).startOf('month'));
      onChange(latest);
      setIsOpen(false);
      return;
    }

    let d = dayjs(todayStr);

    if (allowedDaysOfWeek && allowedDaysOfWeek.length > 0) {
      let attempts = 0;
      while (!allowedDaysOfWeek.includes(d.day()) && attempts < 14) {
        d = d.subtract(1, 'day');
        attempts += 1;
      }
    }

    const recentDateStr = d.format(DATE_FORMAT_ISO);
    setDraftValue(recentDateStr);
    setViewMonth(d.startOf('month'));
    onChange(recentDateStr);
    setIsOpen(false);
  };

  const formattedDisplay = useMemo(() => {
    if (!value) {
      return (
        placeholder ||
        t('hub:attendance_report.select_date', {
          defaultValue: 'Seleccionar fecha...',
        })
      );
    }
    const d = dayjs(value).locale('es');
    const dayName = d.format('dddd');
    const capitalDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const dayNum = d.format('D');
    const rawMonth = d.format('MMMM');
    const month = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);
    const year = d.format('YYYY');
    return `${capitalDay}, ${dayNum} de ${month} de ${year}`;
  }, [value, placeholder, t]);

  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {/* Optional Label */}
      {label && (
        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
          <CalendarDays className="w-3.5 h-3.5 text-primary shrink-0" /> {label}
        </label>
      )}

      {/* Anchored Popover Root */}
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild disabled={disabled}>
          <button
            type="button"
            disabled={disabled}
            className={clsx(
              'flex items-center justify-between w-full rounded-2xl border-2 border-slate-200 bg-white text-slate-800 py-2.5 px-3.5 hover:border-slate-300 focus:border-primary transition-all outline-hidden text-xs font-semibold shadow-2xs text-left',
              disabled
                ? 'opacity-50 cursor-not-allowed bg-slate-50'
                : 'hover:border-primary/50 active:scale-[0.99]',
              isOpen && 'border-primary ring-2 ring-primary/20',
            )}
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <span
                className={clsx(
                  value && !disabled
                    ? 'text-slate-800 font-bold truncate'
                    : 'text-gray-400 font-normal truncate',
                )}
              >
                {disabled
                  ? t('kidChurch:report.select_service_first', {
                      defaultValue: 'Selecciona un servicio primero...',
                    })
                  : formattedDisplay}
              </span>
            </div>
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0 opacity-60" />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align={align}
            side={side}
            sideOffset={6}
            collisionPadding={16}
            data-vaul-no-drag=""
            className={clsx(
              'w-[min(calc(100vw-32px),320px)] bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 space-y-3 animate-in fade-in-80 zoom-in-95 outline-hidden',
              popoverZIndex,
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {t('hub:attendance_report.select_date', {
                      defaultValue: 'Seleccionar Fecha',
                    })}
                  </h4>
                  {allowedDaysOfWeek && allowedDaysOfWeek.length > 0 && (
                    <p className="text-[10px] text-gray-400 font-medium">
                      {t('kidChurch:report.only_meeting_days', {
                        defaultValue: 'Solo días con reuniones',
                      })}
                    </p>
                  )}
                </div>
              </div>

              <Popover.Close asChild>
                <button
                  type="button"
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Popover.Close>
            </div>

            {/* Month Navigator */}
            <div className="flex items-center justify-between pt-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMonth((m) => m.subtract(1, 'month'));
                }}
                className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold text-slate-800 tracking-wide">
                {monthTitle}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMonth((m) => m.add(1, 'month'));
                }}
                className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday labels */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {weekDays.map((wd, i) => (
                <div key={i} className="py-0.5">
                  {wd}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {monthCells.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} className="h-9" />;
                }

                return (
                  <button
                    key={cell.date}
                    type="button"
                    disabled={cell.isDisabled}
                    onClick={(e) =>
                      handleDayClick(cell.date, cell.isDisabled, e)
                    }
                    className={clsx(
                      'relative h-9 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center',
                      cell.isDisabled &&
                        'cursor-not-allowed text-slate-300 bg-slate-50/40 opacity-35',
                      !cell.isDisabled &&
                        !cell.isSelected &&
                        'text-slate-800 bg-white border border-slate-100 hover:bg-primary/10 hover:border-primary/30 hover:text-primary active:scale-95 shadow-2xs',
                      cell.isToday &&
                        !cell.isSelected &&
                        'border-2 border-primary text-primary font-black bg-primary/5',
                      cell.isSelected &&
                        'bg-primary text-primary-foreground shadow-xs font-black scale-105',
                    )}
                  >
                    <span>{cell.day}</span>
                    {cell.isAllowedMeetingDay && !cell.isDisabled && (
                      <span
                        className={clsx(
                          'w-1 h-1 rounded-full -mb-1',
                          cell.isSelected
                            ? 'bg-primary-foreground'
                            : 'bg-primary',
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleQuickSelectRecent}
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
              >
                {allowedDaysOfWeek && allowedDaysOfWeek.length > 0
                  ? t('kidChurch:report.last_service', {
                      defaultValue: 'Último servicio',
                    })
                  : t('hub:attendance_report.quick_today', {
                      defaultValue: 'Hoy',
                    })}
              </button>

              <div className="flex items-center gap-1.5">
                <Popover.Close asChild>
                  <button
                    type="button"
                    className="px-2.5 py-1 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {t('common:actions.cancel', {
                      defaultValue: 'Cancelar',
                    })}
                  </button>
                </Popover.Close>
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {helpText && (
        <p className="text-[11px] text-gray-400 font-medium px-0.5">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default DateCalendarPicker;
