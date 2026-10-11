import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarCheck, Printer } from 'lucide-react';
import clsx from 'clsx';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { useChurchMeetingStatus, formatMeetingHour } from '@/libs/hooks/useChurchMeetingStatus';
import { usePermissions } from '@/libs/hooks/usePermissions';
import { useChurchTerm } from '@/libs/hooks/useTerm';
import { Days } from '@/libs/common-types/constants/days';

export interface RegistrationStatusCardProps {
  /** Optional custom trigger to open settings drawer */
  onOpenSettings?: () => void;
  /** Optional custom CSS classes for the container */
  className?: string;
}

type CardTheme = 'emerald' | 'amber' | 'rose';

const THEME_STYLES: Record<CardTheme, { icon: string; text: string; dot: string; button: string }> = {
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    button: 'bg-emerald-50/50 text-emerald-800 border-emerald-300 hover:bg-emerald-100/80',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600 border border-amber-200/60',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    button: 'bg-amber-50/50 text-amber-800 border-amber-300 hover:bg-amber-100/80',
  },
  rose: {
    icon: 'bg-rose-50 text-rose-600 border border-rose-200/60',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
    button: 'bg-rose-50/50 text-rose-800 border-rose-300 hover:bg-rose-100/80',
  },
};

const DAY_I18N_KEYS: Record<string, 'admin:meetings.days.monday' | 'admin:meetings.days.tuesday' | 'admin:meetings.days.wednesday' | 'admin:meetings.days.thursday' | 'admin:meetings.days.friday' | 'admin:meetings.days.saturday' | 'admin:meetings.days.sunday'> = {
  [Days.MONDAY]: 'admin:meetings.days.monday',
  [Days.TUESDAY]: 'admin:meetings.days.tuesday',
  [Days.WEDNESDAY]: 'admin:meetings.days.wednesday',
  [Days.THURSDAY]: 'admin:meetings.days.thursday',
  [Days.FRIDAY]: 'admin:meetings.days.friday',
  [Days.SATURDAY]: 'admin:meetings.days.saturday',
  [Days.SUNDAY]: 'admin:meetings.days.sunday',
};

/**
 * Side-by-side status cards displaying active service schedule and printer assignment,
 * adapting visual badges and tones dynamically to the real-time meeting and hardware state.
 *
 * @param {RegistrationStatusCardProps} props - Component properties.
 * @returns {JSX.Element} The rendered status card component.
 */
export const RegistrationStatusCard: React.FC<RegistrationStatusCardProps> = ({
  onOpenSettings,
  className,
}) => {
  const { t } = useTranslation(['kidRegistration', 'admin', 'common']);
  const meetingTerm = useChurchTerm('meeting');

  const {
    currentMeeting,
    currentPrinter,
    isMeetingValid,
    isMeetingNotStarted,
    isMeetingConcluded,
    meetingErrorMsg,
  } = useChurchMeetingStatus();

  const printerMode = useAppSelector((state) => state.printerModeSlice?.mode || 'NETWORK');
  const bluetoothDevice = useAppSelector((state) => state.printerModeSlice?.bluetoothDevice);

  /**
   * Dispatches or calls handler to open settings configuration drawer.
   *
   * @returns {void}
   */
  const handleOpenSettings = (): void => {
    if (onOpenSettings) {
      onOpenSettings();
      return;
    }
    window.dispatchEvent(new CustomEvent('app:open-settings'));
  };

  // Meeting title formatting
  const meetingDayLabel = useMemo(() => {
    if (!currentMeeting?.day) return '';
    const key = DAY_I18N_KEYS[currentMeeting.day.toString().toUpperCase()];
    if (!key) return '';
    return t(key);
  }, [currentMeeting?.day, t]);

  const meetingDisplayTitle = useMemo(() => {
    if (!currentMeeting) {
      return t('kidRegistration:status_card.no_meeting_title', {
        meeting: meetingTerm.toLowerCase(),
      });
    }

    let title = currentMeeting.name;

    // Append localized day if available and not present in name
    if (meetingDayLabel && !title.toLowerCase().includes(meetingDayLabel.toLowerCase())) {
      title = `${title} – ${meetingDayLabel}`;
    }

    return title;
  }, [currentMeeting, meetingDayLabel, meetingTerm, t]);

  // Schedule range (registration initial - final hour)
  const scheduleRange = useMemo(() => {
    if (!currentMeeting) return '';
    const initHour = currentMeeting.initialRegistrationHour || currentMeeting.initialHour;
    const finalHour = currentMeeting.finalRegistrationHour || currentMeeting.finalHour;
    const initFormatted = formatMeetingHour(initHour);
    const finalFormatted = formatMeetingHour(finalHour);

    if (initFormatted && finalFormatted) return `${initFormatted} – ${finalFormatted}`;
    return initFormatted || finalFormatted || '';
  }, [currentMeeting]);

  // Meeting state and color theme
  const { meetingTheme, meetingStatusLabel, meetingButtonLabel } = useMemo(() => {
    if (!currentMeeting) {
      return {
        meetingTheme: THEME_STYLES.amber,
        meetingStatusLabel: t('kidRegistration:status_card.status_pending_config'),
        meetingButtonLabel: t('kidRegistration:status_card.configure_button'),
      };
    }

    if (isMeetingValid) {
      return {
        meetingTheme: THEME_STYLES.emerald,
        meetingStatusLabel: t('kidRegistration:status_card.status_in_progress'),
        meetingButtonLabel: t('kidRegistration:status_card.change_button'),
      };
    }

    if (isMeetingNotStarted) {
      return {
        meetingTheme: THEME_STYLES.amber,
        meetingStatusLabel: t('kidRegistration:status_card.status_out_of_schedule'),
        meetingButtonLabel: t('kidRegistration:status_card.change_button'),
      };
    }

    if (isMeetingConcluded) {
      return {
        meetingTheme: THEME_STYLES.amber,
        meetingStatusLabel: t('kidRegistration:status_card.status_concluded'),
        meetingButtonLabel: t('kidRegistration:status_card.change_button'),
      };
    }

    return {
      meetingTheme: THEME_STYLES.amber,
      meetingStatusLabel: t('kidRegistration:status_card.status_different_day'),
      meetingButtonLabel: t('kidRegistration:status_card.change_button'),
    };
  }, [currentMeeting, isMeetingValid, isMeetingNotStarted, isMeetingConcluded, t]);

  const { can } = usePermissions();

  // Tooltip details for hover or screen readers
  const meetingTooltip = useMemo(() => {
    const parts = [meetingDisplayTitle];
    if (scheduleRange) parts.push(`Horario: ${scheduleRange}`);
    if (meetingStatusLabel) parts.push(`Estado: ${meetingStatusLabel}`);
    if (!isMeetingValid && can('checkin:bypass-schedule')) {
      parts.push(t('kidRegistration:status_card.admin_access_notice'));
    } else if (!isMeetingValid && meetingErrorMsg) {
      parts.push(meetingErrorMsg);
    }
    return parts.join(' • ');
  }, [meetingDisplayTitle, scheduleRange, meetingStatusLabel, isMeetingValid, can, meetingErrorMsg, t]);

  // Printer configuration & status
  const isBluetooth = printerMode === 'BLUETOOTH';

  const { printerTitle, printerSubtitle, printerTheme, printerButtonLabel } = useMemo(() => {
    if (isBluetooth) {
      const isConnected = Boolean(bluetoothDevice?.isConnected);
      const name = bluetoothDevice?.name || 'Impresora Bluetooth';
      return {
        printerTitle: `${name} (Bluetooth)`,
        printerSubtitle: isConnected
          ? t('kidRegistration:status_card.printer_bluetooth_connected')
          : t('kidRegistration:status_card.printer_bluetooth_disconnected'),
        printerTheme: isConnected ? THEME_STYLES.emerald : THEME_STYLES.amber,
        printerButtonLabel: isConnected
          ? t('kidRegistration:status_card.change_button')
          : t('kidRegistration:status_card.configure_button'),
      };
    }

    if (currentPrinter) {
      return {
        printerTitle: currentPrinter.name,
        printerSubtitle: undefined,
        printerTheme: THEME_STYLES.emerald,
        printerButtonLabel: t('kidRegistration:status_card.change_button'),
      };
    }

    return {
      printerTitle: t('kidRegistration:status_card.no_printer_title'),
      printerSubtitle: t('kidRegistration:status_card.no_printer_subtitle'),
      printerTheme: THEME_STYLES.amber,
      printerButtonLabel: t('kidRegistration:status_card.configure_button'),
    };
  }, [isBluetooth, bluetoothDevice?.isConnected, bluetoothDevice?.name, currentPrinter, t]);

  return (
    <div className={clsx('grid grid-cols-2 gap-2.5 sm:gap-3', className)}>
      {/* Tarjeta 1: Servicio / Reunión */}
      <div
        onClick={handleOpenSettings}
        className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-3 sm:p-3.5 flex flex-col justify-between min-h-[96px] sm:min-h-[104px] transition-all cursor-pointer hover:shadow-xs active:scale-[0.99]"
        title={meetingTooltip}
      >
        <div className="flex items-center justify-between gap-1.5">
          <div
            className={clsx(
              'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-colors',
              meetingTheme.icon
            )}
          >
            <CalendarCheck size={16} className="shrink-0" />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenSettings();
            }}
            className={clsx(
              'px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold shrink-0 cursor-pointer transition-all active:scale-95 border',
              meetingTheme.button
            )}
          >
            {meetingButtonLabel}
          </button>
        </div>

        <div className="mt-2.5 min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
            {meetingDisplayTitle}
          </h4>

          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
            <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', meetingTheme.dot)} />
            <span className={clsx('text-[11px] font-medium truncate', meetingTheme.text)}>
              {meetingStatusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Tarjeta 2: Impresora */}
      <div
        onClick={handleOpenSettings}
        className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-3 sm:p-3.5 flex flex-col justify-between min-h-[96px] sm:min-h-[104px] transition-all cursor-pointer hover:shadow-xs active:scale-[0.99]"
      >
        <div className="flex items-center justify-between gap-1.5">
          <div
            className={clsx(
              'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-colors',
              printerTheme.icon
            )}
          >
            <Printer size={16} className="shrink-0" />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenSettings();
            }}
            className={clsx(
              'px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold shrink-0 cursor-pointer transition-all active:scale-95 border',
              printerTheme.button
            )}
          >
            {printerButtonLabel}
          </button>
        </div>

        <div className="mt-2.5 min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
            {printerTitle}
          </h4>

          {printerSubtitle ? (
            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
              <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', printerTheme.dot)} />
              <span className={clsx('text-[11px] font-medium truncate', printerTheme.text)}>
                {printerSubtitle}
              </span>
            </div>
          ) : (
            <div className="h-4" aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationStatusCard;
