import React, { useState, useEffect, useRef } from 'react';
import { Drawer } from 'vaul';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { Calendar } from 'lucide-react';

interface DatePickerWheelProps {
  label: string;
  required?: boolean;
  value?: string; // YYYY-MM-DD
  onChange?: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  className?: string;
}

const WheelColumn = ({ options, value, onChange, title }: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const ITEM_HEIGHT = 40;

  // Synchronize scroll position with selected value
  useEffect(() => {
    if (containerRef.current) {
      const index = options.findIndex((o: any) => o.value === value);
      if (index !== -1) {
        const targetTop = index * ITEM_HEIGHT;
        if (Math.abs(containerRef.current.scrollTop - targetTop) > 1) {
          isUserScrollingRef.current = false;
          containerRef.current.scrollTop = targetTop;
        }
      }
    }
  }, [options, value]);

  // Intercept mouse wheel on desktop to step exactly 1 item at a time
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let wheelTimer: NodeJS.Timeout;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        const direction = e.deltaY > 0 ? 1 : -1;
        const currentIndex = options.findIndex((o: any) => o.value === value);
        const safeCurrent = currentIndex !== -1 ? currentIndex : 0;
        const nextIndex = Math.max(0, Math.min(options.length - 1, safeCurrent + direction));
        if (options[nextIndex] && options[nextIndex].value !== value) {
          isUserScrollingRef.current = false;
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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isUserScrollingRef.current) return;
    const target = e.currentTarget;
    clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      const index = Math.round(target.scrollTop / ITEM_HEIGHT);
      if (options[index] && options[index].value !== value) {
        onChange(options[index].value);
      }
    }, 50);
  };

  const handleUserInteractionStart = () => {
    isUserScrollingRef.current = true;
  };

  return (
    <div className="flex-1 flex flex-col items-center relative h-[200px] select-none">
      <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{title}</div>
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        onTouchStart={handleUserInteractionStart}
        onMouseDown={handleUserInteractionStart}
        className="w-full h-[160px] overflow-y-auto snap-y snap-mandatory scrollbar-hide no-scrollbar relative cursor-pointer"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div style={{ height: ITEM_HEIGHT * 1.5 }} className="shrink-0" />
        {options.map((opt: any) => (
          <div 
            key={opt.value} 
            onClick={() => {
              isUserScrollingRef.current = false;
              onChange(opt.value);
            }}
            className={clsx(
              "flex items-center justify-center snap-center transition-all duration-150 cursor-pointer select-none",
              value === opt.value ? "text-xl font-bold text-primary scale-110" : "text-base text-gray-400 font-medium hover:text-gray-700"
            )}
            style={{ height: ITEM_HEIGHT }}
          >
            {opt.label}
          </div>
        ))}
        <div style={{ height: ITEM_HEIGHT * 1.5 }} className="shrink-0" />
      </div>
      {/* Selector highlight lines */}
      <div className="absolute top-[82px] left-2 right-2 h-[40px] border-y-2 border-primary/20 pointer-events-none rounded-lg z-[-1] bg-primary/5 shadow-xs" />
    </div>
  );
};

import { useModalBackClose } from '@/libs/hooks/useModalBackClose';

const DatePickerWheel = ({ 
  label, 
  required, 
  value, 
  onChange, 
  minDate = dayjs().subtract(100, 'year').format('YYYY-MM-DD'), 
  maxDate = dayjs().format('YYYY-MM-DD'), 
  className 
}: DatePickerWheelProps) => {
  const [open, setOpen] = useState(false);
  useModalBackClose(open, () => setOpen(false));
  
  const min = dayjs(minDate);
  const max = dayjs(maxDate);

  const initialDate = value ? dayjs(value) : dayjs();
  
  const [day, setDay] = useState(initialDate.date());
  const [month, setMonth] = useState(initialDate.month() + 1); // 1-12
  const [year, setYear] = useState(initialDate.year());

  // Synchronize state when modal opens or value changes
  useEffect(() => {
    if (open) {
      const target = value ? dayjs(value) : dayjs();
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
      const maxD = (y === max.year() && m === max.month() + 1) ? max.date() : daysInTargetMonth;
      const minD = (y === min.year() && m === min.month() + 1) ? min.date() : 1;
      if (d > maxD) d = maxD;
      if (d < minD) d = minD;

      setYear(y);
      setMonth(m);
      setDay(d);
    }
  }, [open, value, minDate, maxDate]);

  const years = Array.from({ length: Math.max(1, max.year() - min.year() + 1) }, (_, i) => max.year() - i).map(y => ({ label: y.toString(), value: y }));
  
  const minMonth = year === min.year() ? min.month() + 1 : 1;
  const maxMonth = year === max.year() ? max.month() + 1 : 12;
  const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const months = Array.from({ length: Math.max(1, maxMonth - minMonth + 1) }, (_, i) => minMonth + i).map(m => ({ label: monthLabels[m - 1], value: m }));
  
  const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();
  const minDay = (year === min.year() && month === min.month() + 1) ? min.date() : 1;
  const maxDay = (year === max.year() && month === max.month() + 1) ? max.date() : daysInMonth;
  const days = Array.from({ length: Math.max(1, maxDay - minDay + 1) }, (_, i) => minDay + i).map(d => ({ label: d.toString().padStart(2, '0'), value: d }));

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

  return (
    <div className={clsx("w-full", className)}>
      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <Drawer.Root handleOnly open={open} onOpenChange={setOpen} nested>
        <Drawer.Trigger asChild>
          <div className="relative w-full cursor-pointer">
            <input 
              type="text"
              readOnly
              placeholder="Seleccionar fecha"
              value={value ? dayjs(value).format('DD / MM / YYYY') : ''}
              className={clsx(
                "w-full cursor-pointer rounded-xl border-2 border-gray-200 bg-white py-2.5 pl-3 pr-10 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm text-left text-text-main"
              )}
              onFocus={(e) => {
                e.target.blur();
                setOpen(true);
              }}
              onClick={() => setOpen(true)}
            />
            <Calendar size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 z-[10000]" />
          <Drawer.Content 
            className="bg-gray-50 flex flex-col rounded-t-[24px] fixed bottom-0 left-0 right-0 z-[10001] outline-none max-h-[85vh]"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {/* Header */}
            <div className="w-full bg-white rounded-t-[24px] rounded-b-3xl shadow-xs z-10 flex items-center justify-between px-4 py-3.5 sticky top-0">
              <button type="button" onClick={() => setOpen(false)} className="text-gray-500 font-medium py-1 px-2 hover:bg-gray-100 rounded-lg transition-colors text-sm">Cancelar</button>
              <h3 className="font-bold text-gray-800 text-base">Seleccionar Fecha</h3>
              <button type="button" onClick={handleConfirm} className="text-primary font-bold py-1 px-2 hover:bg-primary/10 rounded-lg transition-colors text-sm">Confirmar</button>
            </div>
            
            <div className="flex px-4 py-6 bg-white mt-2">
              <WheelColumn title="Día" options={days} value={day} onChange={setDay} />
              <WheelColumn title="Mes" options={months} value={month} onChange={setMonth} />
              <WheelColumn title="Año" options={years} value={year} onChange={setYear} />
            </div>
            
            <div className="pb-safe" />
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default DatePickerWheel;
