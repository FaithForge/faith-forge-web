import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { IsAdmin, IsAdminKidChurch, IsAdminKidRegisterChurch } from '@/libs/utils/auth';
import {
  REGISTRATION_CONFIRM_COPY_DIFFERENT_DAY_MEETING,
  REGISTRATION_CONFIRM_COPY_LATER_HOURS_MEETING,
  REGISTRATION_CONFIRM_COPY_LOWER_HOURS_MEETING,
} from '@/libs/common-types/constants/copy';

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
 * Normaliza cualquier formato de hora (string "HH:mm:ss", "HH:mm" o fecha ISO) a formato "HH:mm:ss".
 */
const normalizeTime = (val: any): string => {
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

export interface MeetingStatus {
  isConfigured: boolean;
  isMeetingValid: boolean;
  meetingErrorMsg: string;
  shouldBlockKids: boolean;
  isAdmin: boolean;
  currentMeeting: any;
  currentPrinter: any;
  currentCampus: any;
}

/**
 * Hook to continuously monitor the active church meeting status in real time.
 * Re-evaluates every 2 seconds so when the meeting ends or when viewing a future/past service,
 * `isMeetingValid` immediately switches to false and `shouldBlockKids` blocks registrations in real time
 * without needing the user to refresh the page.
 *
 * @returns {MeetingStatus} Current meeting validation and blocking status.
 */
export const useChurchMeetingStatus = (): MeetingStatus => {
  const currentMeeting = useAppSelector((state) => state.churchMeetingSlice.current);
  const currentPrinter = useAppSelector((state) => state.churchPrinterSlice.current);
  const currentCampus = useAppSelector((state) => state.churchCampusSlice.current);
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);

  const [currentTime, setCurrentTime] = useState<dayjs.Dayjs>(dayjs());

  // Tick every 2 seconds to evaluate schedule in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  const isKidChurchRole =
    currentRole === 'KID_GROUP_ADMIN' ||
    currentRole === 'KID_GROUP_SUPERVISOR' ||
    currentRole === 'KID_GROUP_USER';

  const isConfigured = isKidChurchRole ? !!currentMeeting : (!!currentMeeting && !!currentPrinter);
  const activeRoles = currentRole ? [currentRole] : [];
  const isAdmin = IsAdmin(activeRoles) || IsAdminKidChurch(activeRoles) || IsAdminKidRegisterChurch(activeRoles);

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
      const m = currentMeeting as any;
      const initRaw = 
        m.initialRegistrationHour ?? 
        m.initial_registration_hour ?? 
        m.registrationInitialHour;
        
      const finalRaw = 
        m.finalRegistrationHour ?? 
        m.final_registration_hour ?? 
        m.registrationFinalHour ?? 
        m.finalHour ?? 
        m.final_hour;

      const initTimeStr = normalizeTime(initRaw);
      const finalTimeStr = normalizeTime(finalRaw);

      if (initTimeStr && currentTimeStr < initTimeStr) {
        // La hora actual es ANTERIOR a la hora inicial de registro del servicio (servicio posterior)
        isMeetingValid = false;
        meetingErrorMsg = REGISTRATION_CONFIRM_COPY_LATER_HOURS_MEETING.message;
      } else if (finalTimeStr && currentTimeStr >= finalTimeStr) {
        // La hora actual es POSTERIOR a la hora final de registro del servicio (servicio ya finalizó)
        isMeetingValid = false;
        meetingErrorMsg = REGISTRATION_CONFIRM_COPY_LOWER_HOURS_MEETING.message;
      }
    }
  }

  const shouldBlockKids = !isAdmin && !isMeetingValid && isConfigured;

  return {
    isConfigured,
    isMeetingValid,
    meetingErrorMsg,
    shouldBlockKids,
    isAdmin,
    currentMeeting,
    currentPrinter,
    currentCampus,
  };
};
