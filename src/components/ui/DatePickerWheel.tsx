import React, { useState, useEffect, useRef } from 'react';
import { Drawer } from 'vaul';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import clsx from 'clsx';
import { Calendar } from 'lucide-react';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { formatDateOnly, toDateOnlyInputValue } from '@/libs/utils/date';
import Input from './Input';

export interface DatePickerWheelProps {
  label?: string;
  required?: boolean;
  value?: string; // YYYY-MM-DD
  onChange?: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

interface WheelOption {
  label: string;
  value: number;
}

interface WheelColumnProps {
  options: WheelOption[];
  value: number;
  onChange: (val: number) => void;
}

const ITEM_HEIGHT = 46;
const WHEEL_HEIGHT = 230; // 5 visible items (2 above, selected in center, 2 below)
const CENTER_OFFSET = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2; // 92px

/**
 * Individual scrollable wheel column with real-time active item tracking,
 * touch snapping, and smooth stepping.
 *
 * @param {WheelColumnProps} props - Options, selected value, and change callback.
 * @returns {JSX.Element} Rendered wheel column.
 */
const WheelColumn: React.FC<WheelColumnProps> = ({ options, value, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [activeVisualValue, setActiveVisualValue] = useState<number>(value);

  // Synchronize scroll position with selected value when not actively being scrolled by user
  useEffect(() => {
    setActiveVisualValue(value);
    if (containerRef.current && !isUserScrollingRef.current) {
      const index = options.findIndex((o) => o.value === value);
      if (index !== -1) {
        const targetTop = index * ITEM_HEIGHT;
        if (Math.abs(containerRef.current.scrollTop - targetTop) > 1) {
          containerRef.current.scrollTop = targetTop;
        }
      }
    }
  }, [options, value]);

  // Intercept mouse wheel on desktop to step exactly 1 item at a time
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let wheelTimer: ReturnType<typeof setTimeout>;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        const direction = e.deltaY > 0 ? 1 : -1;
        const currentIndex = options.findIndex((o) => o.value === value);
        const safeCurrent = currentIndex !== -1 ? currentIndex : 0;
        const nextIndex = Math.max(0, Math.min(options.length - 1, safeCurrent + direction));
        if (options[nextIndex] && options[nextIndex].value !== value) {
          isUserScrollingRef.current = false;
          setActiveVisualValue(options[nextIndex].value);
          onChange(options[nextIndex].value);
        }
      }, 35);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      clearTimeout(wheelTimer);
    };
  }, [options, value, onChange]);

  /**
   * Handles scroll events to calculate the active item in real-time
   * and debounce the commit callback to the parent state.
   */
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const index = Math.round(target.scrollTop / ITEM_HEIGHT);
    const safeIndex = Math.max(0, Math.min(options.length - 1, index));
    const currentOption = options[safeIndex];

    if (currentOption && currentOption.value !== activeVisualValue) {
      setActiveVisualValue(currentOption.value);
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate(5);
        } catch {
          // Ignore vibration errors if unsupported
        }
      }
    }

    if (!isUserScrollingRef.current) return;

    clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
      if (currentOption && currentOption.value !== value) {
        onChange(currentOption.value);
      }
    }, 60);
  };

  const handleUserInteractionStart = () => {
    isUserScrollingRef.current = true;
  };

  const handleItemClick = (optValue: number, optIndex: number) => {
    isUserScrollingRef.current = false;
    setActiveVisualValue(optValue);
    onChange(optValue);
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: optIndex * ITEM_HEIGHT,
        behavior: 'smooth',
      });
    }
  };

  const selectedIndex = options.findIndex((o) => o.value === activeVisualValue);

  return (
    <div className="flex-1 flex flex-col items-center relative select-none">
      <div className="relative w-full h-[230px] overflow-hidden flex justify-center">
        {/* Scrollable list */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          onTouchStart={handleUserInteractionStart}
          onMouseDown={handleUserInteractionStart}
          className="w-full h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide no-scrollbar relative z-10 cursor-pointer"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div style={{ height: CENTER_OFFSET }} className="shrink-0" />
          {options.map((opt, idx) => {
            const isSelected = activeVisualValue === opt.value;
            const distance = Math.abs(idx - (selectedIndex !== -1 ? selectedIndex : 0));

            return (
              <div
                key={opt.value}
                onClick={() => handleItemClick(opt.value, idx)}
                className={clsx(
                  'flex items-center justify-center snap-center transition-all duration-150 cursor-pointer select-none',
                  isSelected
                    ? 'text-2xl font-black text-primary scale-105'
                    : distance === 1
                      ? 'text-lg font-semibold text-gray-400 hover:text-gray-600'
                      : 'text-base font-medium text-gray-300 hover:text-gray-400',
                )}
                style={{ height: ITEM_HEIGHT }}
              >
                {opt.label}
              </div>
            );
          })}
          <div style={{ height: CENTER_OFFSET }} className="shrink-0" />
        </div>
      </div>
    </div>
  );
};

/**
 * Mobile-friendly iOS-style DatePicker Wheel bottom sheet matching the visual specifications.
 * Features 3 individual capsule highlight lenses, capitalized header preview pill,
 * smooth column scrolling, and responsive feedback.
 *
 * @param {DatePickerWheelProps} props - Component properties.
 * @returns {JSX.Element} Rendered date picker input trigger and bottom sheet wheel picker.
 */
const DatePickerWheel: React.FC<DatePickerWheelProps> = ({
  label,
  required,
  value,
  onChange,
  minDate = dayjs().subtract(100, 'year').format('YYYY-MM-DD'),
  maxDate = dayjs().add(20, 'year').format('YYYY-MM-DD'),
  className,
  error,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  useModalBackClose(open, () => setOpen(false));

  const min = dayjs(minDate);
  const max = dayjs(maxDate);

  const safeDateStr = value ? toDateOnlyInputValue(value) : '';
  const initialDate = safeDateStr ? dayjs.utc(safeDateStr) : dayjs();

  const [day, setDay] = useState(initialDate.date());
  const [month, setMonth] = useState(initialDate.month() + 1); // 1-12
  const [year, setYear] = useState(initialDate.year());

  // Synchronize state when modal opens or value changes
  useEffect(() => {
    if (open) {
      const currentSafeStr = value ? toDateOnlyInputValue(value) : '';
      const target = currentSafeStr ? dayjs.utc(currentSafeStr) : dayjs();
      let y = target.year();
      let m = target.month() + 1;
      let d = target.date();

      if (y > max.year()) y = max.year();
      if (y < min.year()) y = min.year();

      const maxM = y === max.year() ? max.month() + 1 : 12;
      const minM = y === min.year() ? min.month() + 1 : 1;
      if (m > maxM) m = maxM;
      if (m < minM) m = minM;

      const daysInTargetMonth = dayjs(`${y}-${m}-01`).daysInMonth();
      const maxD = y === max.year() && m === max.month() + 1 ? max.date() : daysInTargetMonth;
      const minD = y === min.year() && m === min.month() + 1 ? min.date() : 1;
      if (d > maxD) d = maxD;
      if (d < minD) d = minD;

      setYear(y);
      setMonth(m);
      setDay(d);
    }
  }, [open, value, minDate, maxDate]);

  // Chronological ascending years from min.year() to max.year()
  const years = Array.from(
    { length: Math.max(1, max.year() - min.year() + 1) },
    (_, i) => min.year() + i,
  ).map((y) => ({ label: y.toString(), value: y }));

  const minMonth = year === min.year() ? min.month() + 1 : 1;
  const maxMonth = year === max.year() ? max.month() + 1 : 12;
  const monthLabels = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];
  const months = Array.from(
    { length: Math.max(1, maxMonth - minMonth + 1) },
    (_, i) => minMonth + i,
  ).map((m) => ({
    label: monthLabels[m - 1],
    value: m,
  }));

  const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();
  const minDay = year === min.year() && month === min.month() + 1 ? min.date() : 1;
  const maxDay = year === max.year() && month === max.month() + 1 ? max.date() : daysInMonth;
  const days = Array.from({ length: Math.max(1, maxDay - minDay + 1) }, (_, i) => minDay + i).map(
    (d) => ({
      label: d.toString().padStart(2, '0'),
      value: d,
    }),
  );

  useEffect(() => {
    if (day > maxDay) setDay(maxDay);
    if (day < minDay) setDay(minDay);
    if (month > maxMonth) setMonth(maxMonth);
    if (month < minMonth) setMonth(minMonth);
  }, [month, year, maxDay, minDay, maxMonth, minMonth, day]);

  const handleConfirm = () => {
    const formatted = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    if (onChange) onChange(formatted);
    setOpen(false);
  };

  // Capitalize format like "Viernes, 9 De Mayo De 2026"
  const rawDateStr = dayjs(
    `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
  )
    .locale('es')
    .format('dddd, D [de] MMMM [de] YYYY');

  const currentDatePreview = rawDateStr.replace(
    /(?:^|\s|\/|[¿([{"',;:])\S/g,
    (match) => match.toUpperCase(),
  );

  return (
    <div className={clsx('w-full group', className)}>
      <Input
        label={label}
        required={required}
        error={error}
        disabled={disabled}
        readOnly
        placeholder="Seleccionar fecha"
        value={value ? formatDateOnly(value, 'DD / MM / YYYY') : ''}
        onClick={() => {
          if (!disabled) setOpen(true);
        }}
        rightElement={
          <Calendar
            size={18}
            className="text-gray-400 group-hover:text-primary transition-colors shrink-0 pointer-events-none"
          />
        }
        className="cursor-pointer select-none"
      />

      {/* Bottom Sheet Drawer */}
      <Drawer.Root repositionInputs={false} open={open} onOpenChange={setOpen} nested>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 z-[10000]" />
          <Drawer.Content
            className="bg-white flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 z-[10001] outline-none max-h-[92dvh] shadow-2xl"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {/* Grab handle */}
            <div className="w-12 h-1.5 bg-gray-300/80 rounded-full mx-auto mt-3 mb-1 shrink-0" />

            {/* Header: Cancelar | Seleccionar Fecha | Confirmar */}
            <div className="w-full px-5 py-3 flex items-center justify-between select-none shrink-0 border-b border-gray-100/80">
              <button
                type="button"
                data-vaul-no-drag=""
                onClick={() => setOpen(false)}
                className="text-gray-500 font-semibold py-1 px-2 hover:text-gray-800 transition-colors text-sm sm:text-base cursor-pointer"
              >
                Cancelar
              </button>

              <Drawer.Title className="font-bold text-gray-900 text-base sm:text-lg tracking-tight">
                Seleccionar Fecha
              </Drawer.Title>

              <button
                type="button"
                data-vaul-no-drag=""
                onClick={handleConfirm}
                className="text-primary font-bold py-1 px-2 hover:opacity-80 transition-opacity text-sm sm:text-base cursor-pointer"
              >
                Confirmar
              </button>
            </div>

            {/* Live selected date preview pill */}
            <div className="pt-4 pb-3 flex justify-center px-4">
              <div className="px-5 py-2 bg-primary/10 rounded-full border border-primary/20 text-xs sm:text-sm font-bold text-primary flex items-center gap-2 shadow-2xs">
                <Calendar size={15} className="text-primary shrink-0" />
                <span>{currentDatePreview}</span>
              </div>
            </div>

            {/* Column Titles: DÍA | MES | AÑO */}
            <div className="grid grid-cols-3 w-full px-6 pt-3 pb-1 text-center">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                DÍA
              </span>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                MES
              </span>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                AÑO
              </span>
            </div>

            {/* Wheels Columns with 3 separate capsule highlight lenses */}
            <div data-vaul-no-drag="" className="relative px-6 py-2">
              {/* 3 Separate Highlight Capsules */}
              <div
                className="absolute inset-x-6 grid grid-cols-3 gap-3 pointer-events-none z-0"
                style={{ top: CENTER_OFFSET + 8, height: ITEM_HEIGHT }}
              >
                <div className="w-full h-full bg-primary/10 rounded-2xl border border-primary/20 shadow-2xs" />
                <div className="w-full h-full bg-primary/10 rounded-2xl border border-primary/20 shadow-2xs" />
                <div className="w-full h-full bg-primary/10 rounded-2xl border border-primary/20 shadow-2xs" />
              </div>

              {/* Scrollable Wheels */}
              <div className="grid grid-cols-3 gap-3 relative z-10">
                <WheelColumn options={days} value={day} onChange={setDay} />
                <WheelColumn options={months} value={month} onChange={setMonth} />
                <WheelColumn options={years} value={year} onChange={setYear} />
              </div>

              {/* Top & Bottom gradient fade masks */}
              <div className="absolute top-2 inset-x-6 h-[70px] bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none z-20" />
              <div className="absolute bottom-2 inset-x-6 h-[70px] bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-20" />
            </div>

            {/* Bottom explanatory helper text */}
            <p className="text-xs text-gray-500 text-center leading-relaxed max-w-xs mx-auto mt-2 px-6 pb-6 pb-safe">
              Desliza las columnas o toca los valores para seleccionar la fecha exacta.
            </p>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
};

export default DatePickerWheel;
