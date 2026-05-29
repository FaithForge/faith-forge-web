import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';

type DateCalendarPickerProps = {
  value: string;
  onChange: (value: string) => void;
  minDate: string;
  maxDate: string;
  label: string;
  helpText?: string;
};

type CalendarCell = {
  date: string;
  day: number;
  isDisabled: boolean;
  isSelected: boolean;
};

/**
 * Renders a lightweight custom calendar picker with a button trigger and modal month view.
 *
 * @param {DateCalendarPickerProps} props - Calendar value, date limits, and change handler.
 * @returns {JSX.Element} - A custom date picker built without external UI dependencies.
 */
const DateCalendarPicker: React.FC<DateCalendarPickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  label,
  helpText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const [viewMonth, setViewMonth] = useState(dayjs(value || maxDate).startOf('month'));

  useEffect(() => {
    setDraftValue(value);
    setViewMonth(dayjs(value || maxDate).startOf('month'));
  }, [maxDate, value]);

  const normalizedMinDate = useMemo(() => dayjs(minDate).startOf('day'), [minDate]);
  const normalizedMaxDate = useMemo(() => dayjs(maxDate).startOf('day'), [maxDate]);

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
      const isDisabled = currentDate.isBefore(normalizedMinDate, 'day') || currentDate.isAfter(normalizedMaxDate, 'day');

      cells.push({
        date: cellDate,
        day: dayNumber,
        isDisabled,
        isSelected: !!currentSelection && currentSelection.isSame(currentDate, 'day'),
      });
    }

    return cells;
  }, [draftValue, normalizedMaxDate, normalizedMinDate, viewMonth]);

  const monthTitle = useMemo(() => {
    const titleFormatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
    return titleFormatter.format(viewMonth.toDate());
  }, [viewMonth]);

  const openPicker = () => {
    setDraftValue(value);
    setViewMonth(dayjs(value || maxDate).startOf('month'));
    setIsOpen(true);
  };

  const closePicker = () => {
    setIsOpen(false);
  };

  const confirmSelection = () => {
    if (!draftValue) {
      return;
    }

    onChange(draftValue);
    closePicker();
  };

  const handleDayClick = (date: string, isDisabled: boolean) => {
    if (isDisabled) {
      return;
    }

    setDraftValue(date);
  };

  const buttonLabel = value ? dayjs(value).format('DD/MM/YYYY') : 'Seleccionar fecha';
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>

      <button
        type="button"
        onClick={openPicker}
        className="select select-bordered w-full bg-white text-left text-sm font-normal text-gray-900 shadow-none transition hover:border-[#004863] hover:shadow-none focus:outline-none"
      >
        <span className="text-sm text-gray-900">{buttonLabel}</span>
      </button>

      {helpText ? <p className="text-xs text-gray-500">{helpText}</p> : null}

      {isOpen ? (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:items-center"
          onClick={closePicker}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#004863] to-[#005a7d] px-4 py-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-medium text-white/95">{label}</h3>
                  <p className="mt-0.5 text-xs text-white/70">Selecciona una fecha y confirma.</p>
                </div>
                <button
                  type="button"
                  onClick={closePicker}
                  className="rounded-full border border-white/20 px-3 py-1 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="p-4">

              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setViewMonth((currentMonth) => currentMonth.subtract(1, 'month'))}
                  className="rounded-full border border-gray-200 px-3 py-2 text-gray-700 transition hover:border-[#004863] hover:bg-[#f1f7fa]"
                >
                  ←
                </button>
                <div className="text-base font-semibold capitalize text-gray-900">{monthTitle}</div>
                <button
                  type="button"
                  onClick={() => setViewMonth((currentMonth) => currentMonth.add(1, 'month'))}
                  className="rounded-full border border-gray-200 px-3 py-2 text-gray-700 transition hover:border-[#004863] hover:bg-[#f1f7fa]"
                >
                  →
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                {weekDays.map((weekDay) => (
                  <div key={weekDay} className="py-1">
                    {weekDay}
                  </div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-2">
                {monthCells.map((cell, index) => {
                  if (!cell) {
                    return <div key={`empty-${index}`} className="h-11 rounded-xl" />;
                  }

                  return (
                    <button
                      key={cell.date}
                      type="button"
                      disabled={cell.isDisabled}
                      onClick={() => handleDayClick(cell.date, cell.isDisabled)}
                      className={[
                        'relative h-11 rounded-xl border text-sm font-medium transition',
                        cell.isDisabled
                          ? 'cursor-not-allowed border-transparent bg-gray-50 text-gray-300'
                          : 'border-gray-200 bg-white text-gray-800 hover:border-[#004863] hover:bg-[#f1f7fa] hover:shadow-sm',
                        cell.isSelected
                          ? 'border-[#004863] bg-[#004863] text-white shadow-md ring-2 ring-[#7cc0df] ring-offset-0 scale-105 hover:bg-[#004863]'
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {cell.isSelected ? (
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white">
                          ✓
                        </span>
                      ) : null}
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const today = dayjs().format('YYYY-MM-DD');
                    setDraftValue(today);
                    setViewMonth(dayjs(today).startOf('month'));
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Hoy
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closePicker}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmSelection}
                    className="rounded-xl bg-[#004863] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#00384d]"
                    style={{ color: '#ffffff' }}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DateCalendarPicker;