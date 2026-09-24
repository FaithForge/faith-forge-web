import {
  REGISTRATION_CONFIRM_COPY_DIFFERENT_DAY_MEETING,
  REGISTRATION_CONFIRM_COPY_LATER_HOURS_MEETING,
  REGISTRATION_CONFIRM_COPY_LOWER_HOURS_MEETING,
} from '@/libs/common-types/constants/copy';
import { IChurchCampus, IChurchMeeting, IChurchPrinter } from '@/libs/models/Church';
import { VolunteerRole } from '@/libs/models/Volunteer';
import { useAppSelector } from '@/libs/state/redux/hooks';
import {
  AppRole,
  IsAdmin,
  IsAdminKidChurch,
  IsAdminKidRegisterChurch,
  IsSupervisorRegisterKidChurch,
} from '@/libs/utils/auth';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const DAYS_MAP: Record<string, number> = {
  SUNDAY: 0,
  DOMINGO: 0,
  MONDAY: 1,
  LUNES: 1,
  TUESDAY: 2,
  MARTES: 2,
  WEDNESDAY: 3,
  MIERCOLES: 3,
  MIÉRCOLES: 3,
  THURSDAY: 4,
  JUEVES: 4,
  FRIDAY: 5,
  VIERNES: 5,
  SATURDAY: 6,
  SABADO: 6,
  SÁBADO: 6,
};

/**
 * Normalizes any date or time value (string "HH:mm:ss", "HH:mm", or ISO timestamp) to standard "HH:mm:ss" format.
 *
 * @param {unknown} val - Raw time representation to normalize.
 * @returns {string} Formatted "HH:mm:ss" string, or empty string if invalid.
 */
const normalizeTime = (val: unknown): string => {
  if (!val) return '';
  if (typeof val === 'string') {
    // If already in "HH:mm" or "HH:mm:ss" format
    if (val.includes(':') && !val.includes('T')) {
      const parts = val.split(':');
      const h = parts[0]?.trim().padStart(2, '0') || '00';
      const m = parts[1]?.trim().padStart(2, '0') || '00';
      const s = parts[2]?.trim().split('.')[0]?.padStart(2, '0') || '00';
      return `${h}:${m}:${s}`;
    }
    // If provided as ISO string "YYYY-MM-DDTHH:mm:ss..."
    if (val.includes('T')) {
      const timePart = val.split('T')[1]?.split('.')[0]?.split('Z')[0];
      if (timePart && timePart.includes(':')) {
        const parts = timePart.split(':');
        const h = parts[0]?.trim().padStart(2, '0') || '00';
        const m = parts[1]?.trim().padStart(2, '0') || '00';
        const s = parts[2]?.trim().padStart(2, '0') || '00';
        return `${h}:${m}:${s}`;
      }
    }
    const d = dayjs(val);
    if (d.isValid()) return d.format('HH:mm:ss');
  }
  if (val instanceof Date) {
    const d = dayjs(val);
    if (d.isValid()) return d.format('HH:mm:ss');
  }
  return '';
};

/**
 * Meeting state validation snapshot returned by useChurchMeetingStatus.
 */
export interface MeetingStatus {
  isConfigured: boolean;
  isMeetingValid: boolean;
  meetingErrorMsg: string;
  shouldBlockKids: boolean;
  isAdmin: boolean;
  /** True when the active role is KID_REGISTER_SUPERVISOR (or above). Supervisor+ can delete registrations and view the registration log. */
  isSupervisor: boolean;
  currentMeeting: IChurchMeeting | null;
  currentPrinter: IChurchPrinter | null;
  currentCampus: IChurchCampus | null;
}

/**
 * Extended meeting interface accounting for potential legacy property aliases.
 */
interface IExtendedMeetingProperties extends IChurchMeeting {
  initial_registration_hour?: string;
  registrationInitialHour?: string;
  final_registration_hour?: string;
  registrationFinalHour?: string;
  final_hour?: string;
}

/**
 * Hook to continuously monitor the active church meeting status in real time.
 * Re-evaluates every 2 seconds so when the meeting ends or when viewing a future/past service,
 * `isMeetingValid` immediately switches to false and `shouldBlockKids` blocks registrations in real time
 * without needing the user to refresh the page.
 *
 * @returns {MeetingStatus} Current meeting validation and blocking status snapshot.
 */
export const useChurchMeetingStatus = (): MeetingStatus => {
  const currentMeeting = useAppSelector((state) => state.churchMeetingSlice.current);
  const currentPrinter = useAppSelector((state) => state.churchPrinterSlice.current);
  const currentCampus = useAppSelector((state) => state.churchCampusSlice.current);
  const user = useAppSelector((state) => state.authSlice.user);
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);
  const activeVolunteerRole = useAppSelector(
    (state) => state.volunteerContextSlice.activeVolunteerRole,
  );

  const [currentTime, setCurrentTime] = useState<dayjs.Dayjs>(dayjs());

  // Tick every 2 seconds to evaluate schedule in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  const isKidChurchRole =
    activeVolunteerRole === VolunteerRole.GROUP_COORDINATOR ||
    activeVolunteerRole === VolunteerRole.MINISTRY_GENERAL_COORDINATOR ||
    currentRole === 'MINISTRY_ADMIN' ||
    currentRole === 'KID_GROUP_ADMIN' ||
    currentRole === 'KID_GROUP_SUPERVISOR' ||
    currentRole === 'KID_GROUP_USER';

  const printerMode = useAppSelector((state) => state.printerModeSlice?.mode || 'NETWORK');
  const bluetoothDevice = useAppSelector((state) => state.printerModeSlice?.bluetoothDevice);

  const userRoles = (user?.roles as AppRole[]) || [];
  const activeRoles = currentRole ? Array.from(new Set([...userRoles, currentRole])) : userRoles;
  const isAdmin =
    IsAdmin(activeRoles) || IsAdminKidChurch(activeRoles) || IsAdminKidRegisterChurch(activeRoles);

  // Supervisor or above: can delete registrations and see the registration log
  const isSupervisor = isAdmin || IsSupervisorRegisterKidChurch(activeRoles);

  let isMeetingValid = true;
  let meetingErrorMsg = '';

  if (currentMeeting) {
    const currentDayNum = currentTime.day();
    const meetingDayStr = (currentMeeting.day || '').toString().toUpperCase();
    const meetingDayNum = DAYS_MAP[meetingDayStr];

    if (meetingDayNum !== undefined && meetingDayNum !== currentDayNum) {
      isMeetingValid = false;
      meetingErrorMsg = REGISTRATION_CONFIRM_COPY_DIFFERENT_DAY_MEETING.message;
    } else {
      const currentTimeStr = currentTime.format('HH:mm:ss');

      // Specifically use registration hour fields (initialRegistrationHour / finalRegistrationHour)
      const m = currentMeeting as IExtendedMeetingProperties;
      const initRaw =
        m.initialRegistrationHour ?? m.initial_registration_hour ?? m.registrationInitialHour;

      const finalRaw =
        m.finalRegistrationHour ??
        m.final_registration_hour ??
        m.registrationFinalHour ??
        m.finalHour ??
        m.final_hour;

      const initTimeStr = normalizeTime(initRaw);
      const finalTimeStr = normalizeTime(finalRaw);

      if (initTimeStr && currentTimeStr < initTimeStr) {
        // Current time is before the initial registration hour of the meeting (future meeting)
        isMeetingValid = false;
        meetingErrorMsg = REGISTRATION_CONFIRM_COPY_LATER_HOURS_MEETING.message;
      } else if (finalTimeStr && currentTimeStr >= finalTimeStr) {
        // Current time is after the final registration hour of the meeting (meeting has concluded)
        isMeetingValid = false;
        meetingErrorMsg = REGISTRATION_CONFIRM_COPY_LOWER_HOURS_MEETING.message;
      }
    }
  }

  const isPrinterConfigured =
    printerMode === 'BLUETOOTH' ? !!bluetoothDevice?.isConnected : !!currentPrinter;
  const isConfigured = isKidChurchRole ? !!currentMeeting : !!currentMeeting && isPrinterConfigured;

  const shouldBlockKids = !isAdmin && !isMeetingValid && isConfigured;

  return {
    isConfigured,
    isMeetingValid,
    meetingErrorMsg,
    shouldBlockKids,
    isAdmin,
    isSupervisor,
    currentMeeting: currentMeeting ?? null,
    currentPrinter: currentPrinter ?? null,
    currentCampus: currentCampus ?? null,
  };
};
