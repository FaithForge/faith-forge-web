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
  const ITEM_HEIGHT = 40;

  useEffect(() => {
    if (containerRef.current) {
      const index = options.findIndex((o: any) => o.value === value);
      if (index !== -1) {
        containerRef.current.scrollTop = index * ITEM_HEIGHT;
      } else if (options.length > 0) {
        // If current value is out of bounds, snap to the closest available
        containerRef.current.scrollTop = 0;
        onChange(options[0].value);
      }
    }
  }, [options, value, onChange]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const index = Math.round(target.scrollTop / ITEM_HEIGHT);
    if (options[index] && options[index].value !== value) {
      onChange(options[index].value);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center relative h-[200px]">
      <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{title}</div>
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-[160px] overflow-y-auto snap-y snap-mandatory scrollbar-hide no-scrollbar relative"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div style={{ height: ITEM_HEIGHT * 1.5 }} className="shrink-0" />
        {options.map((opt: any) => (
          <div 
            key={opt.value} 
            className={clsx(
              "flex items-center justify-center snap-center transition-colors duration-200",
              value === opt.value ? "text-xl font-bold text-primary" : "text-base text-gray-400 font-medium"
            )}
            style={{ height: ITEM_HEIGHT }}
          >
            {opt.label}
          </div>
        ))}
        <div style={{ height: ITEM_HEIGHT * 1.5 }} className="shrink-0" />
      </div>
      {/* Selector highlight lines */}
      <div className="absolute top-[82px] left-2 right-2 h-[40px] border-y-2 border-primary/20 pointer-events-none rounded-sm z-[-1] bg-primary/5" />
    </div>
  );
};

const DatePickerWheel = ({ label, required, value, onChange, minDate, maxDate, className }: DatePickerWheelProps) => {
  const [open, setOpen] = useState(false);
  
  const now = dayjs();
  const currentVal = value ? dayjs(value) : now;
  
  const [day, setDay] = useState(currentVal.date());
  const [month, setMonth] = useState(currentVal.month() + 1); // 1-12
  const [year, setYear] = useState(currentVal.year());

  const min = minDate ? dayjs(minDate) : dayjs().subtract(100, 'year');
  const max = maxDate ? dayjs(maxDate) : dayjs().add(50, 'year');

  const years = Array.from({ length: max.year() - min.year() + 1 }, (_, i) => max.year() - i).map(y => ({ label: y.toString(), value: y }));
  
  const minMonth = year === min.year() ? min.month() + 1 : 1;
  const maxMonth = year === max.year() ? max.month() + 1 : 12;
  const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const months = Array.from({ length: maxMonth - minMonth + 1 }, (_, i) => minMonth + i).map(m => ({ label: monthLabels[m - 1], value: m }));
  
  const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();
  const minDay = (year === min.year() && month === min.month() + 1) ? min.date() : 1;
  const maxDay = (year === max.year() && month === max.month() + 1) ? max.date() : daysInMonth;
  const days = Array.from({ length: maxDay - minDay + 1 }, (_, i) => minDay + i).map(d => ({ label: d.toString().padStart(2, '0'), value: d }));

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
      
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Trigger asChild>
          <button 
            type="button"
            className="w-full flex items-center justify-between rounded-xl border-2 border-gray-200 bg-white text-text-main py-2.5 px-3 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm text-left"
          >
            <span className={value ? "text-gray-900" : "text-gray-400"}>
              {value ? dayjs(value).format('DD / MM / YYYY') : "Seleccionar fecha"}
            </span>
            <Calendar size={20} className="text-gray-400" />
          </button>
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[100]" />
          <Drawer.Content className="bg-gray-50 flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-[101] outline-none max-h-[85vh]">
            <div className="p-4 bg-white rounded-t-[20px] rounded-b-3xl shadow-sm z-10">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-4" />
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={() => setOpen(false)} className="text-gray-500 font-medium p-2">Cancelar</button>
                <h3 className="font-bold text-gray-800">Seleccionar Fecha</h3>
                <button type="button" onClick={handleConfirm} className="text-primary font-bold p-2">Confirmar</button>
              </div>
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
