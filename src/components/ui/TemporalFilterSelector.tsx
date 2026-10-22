import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { Calendar, ChevronDown, Clock, CalendarDays } from 'lucide-react';
import clsx from 'clsx';
import Input from '@/components/ui/Input';
import { formatDateOnly } from '@/libs/utils/date';

export type TemporalFilterPreset =
  | 'DAY'
  | 'LAST_7_DAYS'
  | 'WEEK'
  | 'MONTH'
  | 'CURRENT_YEAR'
  | 'LAST_YEAR'
  | 'CUSTOM';

export interface TemporalFilterValue {
  preset: TemporalFilterPreset;
  from?: string;
  to?: string;
  label?: string;
}

interface TemporalFilterSelectorProps {
  value: TemporalFilterValue;
  onChange: (val: TemporalFilterValue) => void;
  className?: string;
}

/**
 * Multi-temporal filter selector for statistical dashboards.
 * Allows switching between Day, 7 days, Week, Month, Current Year, Last Year, and Custom range.
 *
 * @param {TemporalFilterSelectorProps} props - Component properties.
 * @returns {JSX.Element} Filter bar with preset pills and expandable date controls.
 */
export const TemporalFilterSelector: React.FC<TemporalFilterSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const { t } = useTranslation(['common', 'hub']);
  const [showCustomInputs, setShowCustomInputs] = useState(value.preset === 'CUSTOM' || value.preset === 'DAY');
  const [specificDay, setSpecificDay] = useState(
    value.preset === 'DAY' && value.from ? value.from : dayjs().format('YYYY-MM-DD')
  );
  const [customFrom, setCustomFrom] = useState(value.from || dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
  const [customTo, setCustomTo] = useState(value.to || dayjs().format('YYYY-MM-DD'));

  const presets: { id: TemporalFilterPreset; label: string }[] = [
    { id: 'DAY', label: t('common:temporal.day', { defaultValue: 'Día' }) },
    { id: 'LAST_7_DAYS', label: t('common:temporal.last_7_days', { defaultValue: '7 días' }) },
    { id: 'WEEK', label: t('common:temporal.week', { defaultValue: 'Semana' }) },
    { id: 'MONTH', label: t('common:temporal.month', { defaultValue: 'Mes' }) },
    { id: 'CURRENT_YEAR', label: t('common:temporal.current_year', { defaultValue: 'Año actual' }) },
    { id: 'LAST_YEAR', label: t('common:temporal.last_year', { defaultValue: 'Hace un año' }) },
    { id: 'CUSTOM', label: t('common:temporal.custom', { defaultValue: 'Rango' }) },
  ];

  const handleSelectPreset = (preset: TemporalFilterPreset) => {
    const today = dayjs();

    if (preset === 'DAY') {
      setShowCustomInputs(true);
      onChange({
        preset: 'DAY',
        from: specificDay,
        to: specificDay,
        label: formatDateOnly(specificDay, 'D [de] MMMM'),
      });
      return;
    }

    if (preset === 'CUSTOM') {
      setShowCustomInputs(true);
      onChange({
        preset: 'CUSTOM',
        from: customFrom,
        to: customTo,
        label: `${formatDateOnly(customFrom, 'D MMM')} - ${formatDateOnly(customTo, 'D MMM')}`,
      });
      return;
    }

    setShowCustomInputs(false);

    if (preset === 'LAST_7_DAYS') {
      const from = today.subtract(6, 'day').format('YYYY-MM-DD');
      const to = today.format('YYYY-MM-DD');
      onChange({
        preset,
        from,
        to,
        label: t('common:temporal.last_7_days', { defaultValue: 'Últimos 7 días' }),
      });
    } else if (preset === 'WEEK') {
      const from = today.startOf('week').format('YYYY-MM-DD');
      const to = today.endOf('week').format('YYYY-MM-DD');
      onChange({
        preset,
        from,
        to,
        label: t('common:temporal.week', { defaultValue: 'Esta semana' }),
      });
    } else if (preset === 'MONTH') {
      const from = today.startOf('month').format('YYYY-MM-DD');
      const to = today.endOf('month').format('YYYY-MM-DD');
      onChange({
        preset,
        from,
        to,
        label: today.format('MMMM YYYY'),
      });
    } else if (preset === 'CURRENT_YEAR') {
      const from = today.startOf('year').format('YYYY-MM-DD');
      const to = today.endOf('year').format('YYYY-MM-DD');
      onChange({
        preset,
        from,
        to,
        label: today.format('YYYY'),
      });
    } else if (preset === 'LAST_YEAR') {
      const prevYear = today.subtract(1, 'year');
      const from = prevYear.startOf('year').format('YYYY-MM-DD');
      const to = prevYear.endOf('year').format('YYYY-MM-DD');
      onChange({
        preset,
        from,
        to,
        label: prevYear.format('YYYY'),
      });
    }
  };

  const handleSpecificDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDay = e.target.value;
    setSpecificDay(newDay);
    onChange({
      preset: 'DAY',
      from: newDay,
      to: newDay,
      label: formatDateOnly(newDay, 'D [de] MMMM'),
    });
  };

  const handleCustomFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrom = e.target.value;
    setCustomFrom(newFrom);
    onChange({
      preset: 'CUSTOM',
      from: newFrom,
      to: customTo,
      label: `${formatDateOnly(newFrom, 'D MMM')} - ${formatDateOnly(customTo, 'D MMM')}`,
    });
  };

  const handleCustomToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTo = e.target.value;
    setCustomTo(newTo);
    onChange({
      preset: 'CUSTOM',
      from: customFrom,
      to: newTo,
      label: `${formatDateOnly(customFrom, 'D MMM')} - ${formatDateOnly(newTo, 'D MMM')}`,
    });
  };

  return (
    <div className={clsx('space-y-2.5', className)}>
      {/* Scrollable preset pills bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        {presets.map((p) => {
          const isActive = value.preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPreset(p.id)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 outline-hidden',
                isActive
                  ? 'bg-[#0284c7] text-white shadow-xs scale-[1.02]'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Date controls when DAY or CUSTOM is selected */}
      {showCustomInputs && value.preset === 'DAY' && (
        <div className="p-3 bg-white rounded-2xl border border-sky-100 shadow-2xs flex items-center gap-3">
          <CalendarDays className="w-4 h-4 text-[#0284c7] shrink-0" />
          <div className="flex-1">
            <Input
              type="date"
              value={specificDay}
              onChange={handleSpecificDayChange}
              className="py-1 px-2.5 text-xs font-semibold text-slate-800"
            />
          </div>
          <span className="text-[11px] font-medium text-slate-500 shrink-0">
            {formatDateOnly(specificDay, 'dddd, D MMMM')}
          </span>
        </div>
      )}

      {showCustomInputs && value.preset === 'CUSTOM' && (
        <div className="p-3 bg-white rounded-2xl border border-sky-100 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#0284c7]" />
            <span>{t('common:temporal.custom_range', { defaultValue: 'Rango personalizado' })}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 font-medium block mb-1">
                {t('common:from', { defaultValue: 'Desde' })}
              </span>
              <Input
                type="date"
                value={customFrom}
                onChange={handleCustomFromChange}
                className="py-1 px-2 text-xs font-semibold"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block mb-1">
                {t('common:to', { defaultValue: 'Hasta' })}
              </span>
              <Input
                type="date"
                value={customTo}
                onChange={handleCustomToChange}
                className="py-1 px-2 text-xs font-semibold"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemporalFilterSelector;
