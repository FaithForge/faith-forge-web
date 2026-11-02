import DateCalendarPicker from '@/components/ui/DateCalendarPicker';
import { DATE_FORMAT_ISO } from '@/libs/common-types/constants';
import { formatDateOnly } from '@/libs/utils/date';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { Calendar, CalendarDays } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  allowedDaysOfWeek?: number[];
  allowedDates?: string[];
  maxDate?: string;
  minDate?: string;
}

/**
 * Multi-temporal filter selector for statistical dashboards.
 * Allows switching between Day, 7 days, Week, Month, Current Year, Last Year, and Custom range.
 * Empowers the Day and Custom calendar pickers to restrict selection strictly to dates
 * that had church meetings, with anchored desktop popovers.
 *
 * @param {TemporalFilterSelectorProps} props - Component properties.
 * @returns {JSX.Element} Filter bar with preset pills and expandable date controls.
 */
export const TemporalFilterSelector: React.FC<TemporalFilterSelectorProps> = ({
  value,
  onChange,
  className = '',
  allowedDaysOfWeek,
  allowedDates,
  maxDate,
  minDate,
}) => {
  const { t } = useTranslation(['common', 'hub']);
  const [showCustomInputs, setShowCustomInputs] = useState(
    value.preset === 'CUSTOM' || value.preset === 'DAY',
  );
  const [specificDay, setSpecificDay] = useState(
    value.preset === 'DAY' && value.from
      ? value.from
      : dayjs().format(DATE_FORMAT_ISO),
  );
  const [customFrom, setCustomFrom] = useState(
    value.from || dayjs().subtract(7, 'day').format(DATE_FORMAT_ISO),
  );
  const [customTo, setCustomTo] = useState(
    value.to || dayjs().format(DATE_FORMAT_ISO),
  );

  const presets: { id: TemporalFilterPreset; label: string }[] = [
    { id: 'DAY', label: t('common:temporal.day', { defaultValue: 'Día' }) },
    {
      id: 'LAST_7_DAYS',
      label: t('common:temporal.last_7_days', { defaultValue: '7 días' }),
    },
    {
      id: 'WEEK',
      label: t('common:temporal.week', { defaultValue: 'Semana' }),
    },
    { id: 'MONTH', label: t('common:temporal.month', { defaultValue: 'Mes' }) },
    {
      id: 'CURRENT_YEAR',
      label: t('common:temporal.current_year', { defaultValue: 'Año actual' }),
    },
    {
      id: 'LAST_YEAR',
      label: t('common:temporal.last_year', { defaultValue: 'Hace un año' }),
    },
    {
      id: 'CUSTOM',
      label: t('common:temporal.custom', { defaultValue: 'Rango' }),
    },
  ];

  const handleSelectPreset = (preset: TemporalFilterPreset) => {
    const today = dayjs();

    if (preset === 'DAY') {
      setShowCustomInputs(true);
      let targetDay = specificDay;

      if (allowedDates && allowedDates.length > 0) {
        if (!allowedDates.includes(targetDay)) {
          targetDay = allowedDates[0];
          setSpecificDay(targetDay);
        }
      } else if (allowedDaysOfWeek && allowedDaysOfWeek.length > 0) {
        const d = dayjs(targetDay);
        if (!allowedDaysOfWeek.includes(d.day())) {
          let attempts = 0;
          let searchDate = dayjs();
          while (
            !allowedDaysOfWeek.includes(searchDate.day()) &&
            attempts < 14
          ) {
            searchDate = searchDate.subtract(1, 'day');
            attempts += 1;
          }
          targetDay = searchDate.format(DATE_FORMAT_ISO);
          setSpecificDay(targetDay);
        }
      }

      onChange({
        preset: 'DAY',
        from: targetDay,
        to: targetDay,
        label: formatDateOnly(targetDay, 'D [de] MMMM'),
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
      const from = today.subtract(6, 'day').format(DATE_FORMAT_ISO);
      const to = today.format(DATE_FORMAT_ISO);
      onChange({
        preset,
        from,
        to,
        label: t('common:temporal.last_7_days', {
          defaultValue: 'Últimos 7 días',
        }),
      });
    } else if (preset === 'WEEK') {
      const from = today.startOf('week').format(DATE_FORMAT_ISO);
      const to = today.endOf('week').format(DATE_FORMAT_ISO);
      onChange({
        preset,
        from,
        to,
        label: t('common:temporal.week', { defaultValue: 'Esta semana' }),
      });
    } else if (preset === 'MONTH') {
      const from = today.startOf('month').format(DATE_FORMAT_ISO);
      const to = today.endOf('month').format(DATE_FORMAT_ISO);
      onChange({
        preset,
        from,
        to,
        label: today.format('MMMM YYYY'),
      });
    } else if (preset === 'CURRENT_YEAR') {
      const from = today.startOf('year').format(DATE_FORMAT_ISO);
      const to = today.endOf('year').format(DATE_FORMAT_ISO);
      onChange({
        preset,
        from,
        to,
        label: today.format('YYYY'),
      });
    } else if (preset === 'LAST_YEAR') {
      const prevYear = today.subtract(1, 'year');
      const from = prevYear.startOf('year').format(DATE_FORMAT_ISO);
      const to = prevYear.endOf('year').format(DATE_FORMAT_ISO);
      onChange({
        preset,
        from,
        to,
        label: prevYear.format('YYYY'),
      });
    }
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
                  ? 'bg-primary text-primary-foreground shadow-xs scale-[1.02]'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300',
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Date controls when DAY is selected: using custom calendar picker */}
      {showCustomInputs && value.preset === 'DAY' && (
        <div className="p-3 bg-white rounded-2xl border border-primary/20 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-primary" />
              {t('common:temporal.service_day', {
                defaultValue: 'Día a consultar',
              })}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 capitalize">
              {formatDateOnly(specificDay, 'dddd, D [de] MMMM')}
            </span>
          </div>

          <DateCalendarPicker
            value={specificDay}
            onChange={(newDay) => {
              setSpecificDay(newDay);
              onChange({
                preset: 'DAY',
                from: newDay,
                to: newDay,
                label: formatDateOnly(newDay, 'D [de] MMMM'),
              });
            }}
            allowedDaysOfWeek={allowedDaysOfWeek}
            allowedDates={allowedDates}
            maxDate={maxDate || dayjs().format(DATE_FORMAT_ISO)}
            minDate={minDate}
            helpText={
              allowedDaysOfWeek && allowedDaysOfWeek.length > 0
                ? t('common:temporal.only_service_days_help', {
                    defaultValue:
                      'Solo las fechas con reuniones programadas están habilitadas',
                  })
                : undefined
            }
          />
        </div>
      )}

      {/* Date controls when CUSTOM range is selected */}
      {showCustomInputs && value.preset === 'CUSTOM' && (
        <div className="p-3 bg-white rounded-2xl border border-primary/20 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>
              {t('common:temporal.custom_range', {
                defaultValue: 'Rango personalizado',
              })}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 font-medium block mb-1">
                {t('common:from', { defaultValue: 'Desde' })}
              </span>
              <DateCalendarPicker
                value={customFrom}
                onChange={(newFrom) => {
                  setCustomFrom(newFrom);
                  onChange({
                    preset: 'CUSTOM',
                    from: newFrom,
                    to: customTo,
                    label: `${formatDateOnly(newFrom, 'D MMM')} - ${formatDateOnly(customTo, 'D MMM')}`,
                  });
                }}
                allowedDaysOfWeek={allowedDaysOfWeek}
                allowedDates={allowedDates}
                maxDate={customTo || maxDate || dayjs().format(DATE_FORMAT_ISO)}
                minDate={minDate}
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block mb-1">
                {t('common:to', { defaultValue: 'Hasta' })}
              </span>
              <DateCalendarPicker
                value={customTo}
                onChange={(newTo) => {
                  setCustomTo(newTo);
                  onChange({
                    preset: 'CUSTOM',
                    from: customFrom,
                    to: newTo,
                    label: `${formatDateOnly(customFrom, 'D MMM')} - ${formatDateOnly(newTo, 'D MMM')}`,
                  });
                }}
                allowedDaysOfWeek={allowedDaysOfWeek}
                allowedDates={allowedDates}
                minDate={customFrom || minDate}
                maxDate={maxDate || dayjs().format(DATE_FORMAT_ISO)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemporalFilterSelector;
