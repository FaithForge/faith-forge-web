import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Calendar, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import clsx from 'clsx';
import ModalOverlay from '@/components/ui/ModalOverlay';

type DateCalendarPickerProps = {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  allowedDaysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  label: string;
  helpText?: string;
};

type CalendarCell = {
  date: string;
  day: number;
  isDisabled: boolean;
  isSelected: boolean;
  isToday: boolean;
};

/**
 * Modern custom calendar date picker aligned with the app design system.
 * Supports day-of-week restrictions (e.g. enabling only Sundays for Sunday services).
 *
 * @param {DateCalendarPickerProps} props - Value, date limits, allowed days of week, label and change callback.
 * @returns {JSX.Element}
 */
const DateCalendarPicker: React.FC<DateCalendarPickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  allowedDaysOfWeek,
  label,
  helpText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const [viewMonth, setViewMonth] = useState(dayjs(value || maxDate || undefined).startOf('month'));

  useEffect(() => {
    setDraftValue(value);
    setViewMonth(dayjs(value || maxDate || undefined).startOf('month'));
  }, [maxDate, value]);

  const normalizedMinDate = useMemo(() => (minDate ? dayjs(minDate).startOf('day') : null), [minDate]);
  const normalizedMaxDate = useMemo(() => (maxDate ? dayjs(maxDate).startOf('day') : null), [maxDate]);
  const todayStr = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

  const weekDays = useMemo(() => ['L', 'M', 'M', 'J', 'V', 'S', 'D'], []);

  const monthCells = useMemo(() => {
    const startOfMonth = viewMonth.startOf('month');
    const daysInMonth = viewMonth.daysInMonth();
    const monthStartOffset = (startOfMonth.day() + 6) % 7;
    const totalCells = Math.ceil((monthStartOffset + daysInMonth) / 7) * 7;
    const currentSelection = draftValue ? dayjs(draftValue).startOf('day') : null;

    const cells: Array<CalendarCell | null> = [];

    for (let index = 0; index < totalCells; index += 1) {
      const dayNumber = index - monthStartOffset + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        cells.push(null);
        continue;
      }

      const cellDate = startOfMonth.date(dayNumber).format('YYYY-MM-DD');
      const currentDate = dayjs(cellDate).startOf('day');
      
      const isDayOfWeekAllowed =
        allowedDaysOfWeek && allowedDaysOfWeek.length > 0
          ? allowedDaysOfWeek.includes(currentDate.day())
          : true;

      const isDisabled =
        !isDayOfWeekAllowed ||
        (normalizedMinDate ? currentDate.isBefore(normalizedMinDate, 'day') : false) ||
        (normalizedMaxDate ? currentDate.isAfter(normalizedMaxDate, 'day') : false);

      cells.push({
        date: cellDate,
        day: dayNumber,
        isDisabled,
        isSelected: !!currentSelection && currentSelection.isSame(currentDate, 'day'),
        isToday: cellDate === todayStr,
      });
    }

    return cells;
  }, [draftValue, normalizedMaxDate, normalizedMinDate, viewMonth, todayStr, allowedDaysOfWeek]);

  const monthTitle = useMemo(() => {
    const titleFormatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
    return titleFormatter.format(viewMonth.toDate());
  }, [viewMonth]);

  const openPicker = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDraftValue(value);
    setViewMonth(dayjs(value || maxDate || undefined).startOf('month'));
    setIsOpen(true);
  };

  const closePicker = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsOpen(false);
  };

  const confirmSelection = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!draftValue) return;
    onChange(draftValue);
    closePicker(e);
  };

  const handleDayClick = (date: string, isDisabled: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isDisabled) return;
    setDraftValue(date);
  };

  const handleQuickSelectRecent = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    let d = dayjs(todayStr);
    if (allowedDaysOfWeek && allowedDaysOfWeek.length > 0) {
      while (!allowedDaysOfWeek.includes(d.day())) {
        d = d.subtract(1, 'day');
      }
    }
    const recentDateStr = d.format('YYYY-MM-DD');
    setDraftValue(recentDateStr);
    setViewMonth(d.startOf('month'));
  };

  const formattedDisplay = value ? dayjs(value).format('DD [de] MMMM [de] YYYY') : 'Seleccionar fecha...';

  return (
    <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
      {/* Label */}
      <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wide">
        <Calendar size={15} className="text-primary" /> {label}
      </label>

      {/* Styled Input Trigger */}
      <button
        type="button"
        onClick={openPicker}
        className="flex items-center justify-between w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-2.5 px-3.5 focus:border-primary transition-colors outline-none text-sm shadow-sm font-medium hover:border-primary/50 text-left active:scale-[0.99]"
      >
        <span className={clsx('capitalize', value ? 'text-gray-800 font-semibold' : 'text-gray-400 font-normal')}>
          {formattedDisplay}
        </span>
        <Calendar size={17} className="text-gray-400 shrink-0 ml-2" />
      </button>

      {helpText && <p className="text-[11px] text-gray-400 font-medium px-0.5">{helpText}</p>}

      {/* Modern Calendar Modal */}
      <ModalOverlay
        open={isOpen}
        onClose={closePicker}
        panelClassName="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
      >
        <div onClick={(event) => event.stopPropagation()} className="flex flex-col">
          {/* Header */}
          <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm">Seleccionar Fecha</h3>
                <p className="text-[11px] text-gray-500 font-medium">Elige el día a consultar</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closePicker}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200/60 text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            {/* Month Navigator */}
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMonth((currentMonth) => currentMonth.subtract(1, 'month'));
                }}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="text-sm font-bold capitalize text-gray-900 tracking-wide">
                {monthTitle}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMonth((currentMonth) => currentMonth.add(1, 'month'));
                }}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              {weekDays.map((weekDay, idx) => (
                <div key={`${weekDay}-${idx}`} className="py-1">
                  {weekDay}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1">
              {monthCells.map((cell, index) => {
                if (!cell) {
                  return <div key={`empty-${index}`} className="h-9" />;
                }

                return (
                  <button
                    key={cell.date}
                    type="button"
                    disabled={cell.isDisabled}
                    onClick={(e) => handleDayClick(cell.date, cell.isDisabled, e)}
                    className={clsx(
                      'relative h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center',
                      cell.isDisabled && 'cursor-not-allowed text-gray-300 bg-gray-50/40 opacity-40',
                      !cell.isDisabled &&
                        !cell.isSelected &&
                        'text-gray-800 bg-white border border-gray-100 hover:bg-primary/10 hover:border-primary hover:text-primary active:scale-90 shadow-2xs',
                      cell.isToday && !cell.isSelected && 'border border-primary/40 text-primary font-black',
                      cell.isSelected && 'bg-primary text-primary-foreground shadow-md font-black scale-105'
                    )}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={handleQuickSelectRecent}
                className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
              >
                {allowedDaysOfWeek && allowedDaysOfWeek.length > 0 ? 'Último Servicio' : 'Hoy'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closePicker}
                  className="rounded-xl border border-gray-200 px-3.5 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmSelection}
                  className="rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95 flex items-center gap-1"
                >
                  <Check size={14} /> Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalOverlay>
    </div>
  );
};

export default DateCalendarPicker;
