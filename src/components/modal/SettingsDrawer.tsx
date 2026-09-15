import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppDrawer from '@/components/ui/AppDrawer';
import {
  Settings,
  MapPin,
  CalendarClock,
  Printer,
  X,
  Loader2,
  Bluetooth,
  Check,
  RefreshCw,
  LogOut,
  Users,
  Building2,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import clsx from 'clsx';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetChurchCampuses, GetChurchMeetings, GetChurchPrinters } from '@/libs/state/redux/thunks/church/church.thunk';
import { updateCurrentChurchCampus } from '@/libs/state/redux/slices/church/churchCampus.slice';
import { updateCurrentChurchMeeting } from '@/libs/state/redux/slices/church/churchMeeting.slice';
import { updateCurrentChurchPrinter } from '@/libs/state/redux/slices/church/churchPrinter.slice';
import { setPrinterMode, setBluetoothStatus, PrinterModeType } from '@/libs/state/redux/slices/church/printerMode.slice';
import { logout, changeCurrentRole } from '@/libs/state/redux/slices/user/auth.slice';
import {
  setActiveCampus,
  setActiveGroupConfig,
  setActiveVolunteerRole,
  setOnboardingCompleted,
} from '@/libs/state/redux/slices/church/volunteerContext.slice';
import { ChurchMeetingStateEnum, ChurchPrinterStateEnum, IChurchPrinter } from '@/libs/models';
import {
  IVolunteerCampusContext,
  IVolunteerGroupConfigContext,
  VolunteerRole,
} from '@/libs/models/Volunteer';
import { bluetoothPrinter } from '@/libs/utils/printer/bluetoothPrinter';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { AppRole, ChurchRole, IsAdmin, UserRole } from '@/libs/utils/auth';
import { isRoleEnabled } from '@/config/roles';
import { APP_ROUTES } from '@/config/routes';
import { capitalizeWords, formatPersonFirstAndLastNames } from '@/libs/utils/text';

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When true, wizard resets to campus-selection step so the user can switch their active campus. */
  forceSelectCampus?: boolean;
  /** When true, the drawer is opened as the initial session setup wizard. */
  sessionWizard?: boolean;
}

// Feature flag for Bluetooth printing (can be disabled when needed)
export const ENABLE_BLUETOOTH_PRINTING = true;

type WizardStep = 'SELECT_CAMPUS' | 'SELECT_GROUP' | 'SELECT_MEETING' | 'SELECT_PRINTER' | 'CONFIG';

const DAYS_NUM_MAP: Record<string, number> = {
  SUNDAY: 0,
  DOMINGO: 0,
  '0': 0,
  MONDAY: 1,
  LUNES: 1,
  '1': 1,
  TUESDAY: 2,
  MARTES: 2,
  '2': 2,
  WEDNESDAY: 3,
  MIERCOLES: 3,
  MIÉRCOLES: 3,
  '3': 3,
  THURSDAY: 4,
  JUEVES: 4,
  '4': 4,
  FRIDAY: 5,
  VIERNES: 5,
  '5': 5,
  SATURDAY: 6,
  SABADO: 6,
  SÁBADO: 6,
  '6': 6,
};

/**
 * Normaliza y obtiene el número de día de la semana (0=Domingo, ..., 6=Sábado) de una reunión.
 *
 * @param {any} day - Valor del día (enum string o número).
 * @returns {number | undefined} Índice del día o undefined si no es válido.
 */
const getMeetingDayNum = (day: any): number | undefined => {
  if (day === undefined || day === null) return undefined;
  if (typeof day === 'number') return day;
  const key = String(day).toUpperCase().trim();
  return DAYS_NUM_MAP[key];
};

/**
 * Infers the target AppRole from a volunteer group config.
 *
 * @param {IVolunteerGroupConfigContext} group - The selected volunteer group.
 * @returns {AppRole | null} The inferred AppRole or null if undetermined.
 */
const inferRoleFromGroup = (group: IVolunteerGroupConfigContext): AppRole | null => {
  const primaryArea = group.areas[0];
  const primaryRole = primaryArea?.role || group.groupRole || VolunteerRole.VOLUNTEER;

  const isRegikids =
    primaryArea?.scope === 'KID_REGISTRATION' ||
    (primaryArea.name || '').toLowerCase().includes('regi');

  if (primaryRole === VolunteerRole.SUPERVISOR) {
    return isRegikids ? UserRole.KID_REGISTER_SUPERVISOR : UserRole.KID_GROUP_SUPERVISOR;
  }
  if (primaryRole === VolunteerRole.GROUP_COORDINATOR) {
    return isRegikids ? UserRole.KID_REGISTER_ADMIN : UserRole.KID_GROUP_ADMIN;
  }
  return isRegikids ? UserRole.KID_REGISTER_USER : UserRole.KID_GROUP_USER;
};


const SettingsDrawer = ({
  open,
  onOpenChange,
  forceSelectCampus = false,
  sessionWizard = false,
}: SettingsDrawerProps) => {
  useModalBackClose(open, () => onOpenChange(false));

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const campuses = useAppSelector((state) => state.churchCampusSlice);
  const meetings = useAppSelector((state) => state.churchMeetingSlice);
  const printers = useAppSelector((state) => state.churchPrinterSlice);
  const printerModeSlice = useAppSelector((state) => state.printerModeSlice);
  const {
    isChurchVolunteer,
    activeCampusId: volunteerActiveCampusId,
    activeCampusName: volunteerActiveCampusName,
    userMsRoles = [],
    campuses: volunteerCampuses,
    activeGroupConfigId,
    activeVolunteerRole,
    isOnboardingCompleted,
  } = useAppSelector((state) => state.volunteerContextSlice);

  const user = useAppSelector((state) => state.authSlice.user);
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);

  const userRoles = (user?.roles as UserRole[]) || [];
  const isUserAdmin =
    IsAdmin(userRoles) ||
    currentRole === UserRole.SUPER_ADMIN ||
    currentRole === UserRole.ADMIN;

  const isChurchRole =
    isChurchVolunteer &&
    (!currentRole || !userMsRoles.includes(currentRole));

  // Determine if we need to show the onboarding wizard steps
  const isUserMsRole = currentRole && userMsRoles.includes(currentRole);
  const registrationRoles = [
    UserRole.KID_REGISTER_ADMIN,
    UserRole.KID_REGISTER_SUPERVISOR,
    UserRole.KID_REGISTER_USER,
  ];
  const kidChurchRoles = [
    ChurchRole.MINISTRY_ADMIN,
    UserRole.KID_GROUP_ADMIN,
    UserRole.KID_GROUP_SUPERVISOR,
    UserRole.KID_GROUP_USER,
  ];
  const isRegistrationRole = currentRole
    ? registrationRoles.includes(currentRole as UserRole)
    : userRoles.some((role) => registrationRoles.includes(role));
  const isKidChurchUserRole = currentRole
    ? kidChurchRoles.includes(currentRole as ChurchRole | UserRole)
    : userRoles.some((role) => kidChurchRoles.includes(role));
  const isActiveKidChurchVolunteerRole =
    activeVolunteerRole === VolunteerRole.GROUP_COORDINATOR ||
    activeVolunteerRole === VolunteerRole.MINISTRY_GENERAL_COORDINATOR;
  const isActiveRegistrationVolunteerRole =
    activeVolunteerRole === VolunteerRole.AREA_GENERAL_COORDINATOR;
  const resolvedIsRegistrationRole = isActiveKidChurchVolunteerRole
    ? false
    : isActiveRegistrationVolunteerRole
    ? true
    : isRegistrationRole;
  const resolvedIsKidChurchUserRole =
    isActiveKidChurchVolunteerRole || isKidChurchUserRole;
  const isInitialSessionWizard = sessionWizard && (resolvedIsRegistrationRole || resolvedIsKidChurchUserRole);
  const isInitialRegistrationWizard = sessionWizard && resolvedIsRegistrationRole;
  const needsOnboarding =
    forceSelectCampus ||
    (isChurchRole && !isUserMsRole && volunteerCampuses.length > 0 && (!isOnboardingCompleted || !volunteerActiveCampusId));

  // Sort campuses by system position
  const masterCampuses = useAppSelector((state) => state.churchCampusSlice.data);
  const sortedVolunteerCampuses = useMemo(() => {
    const positionMap = new Map(masterCampuses.map((c, idx) => [c.id, c.position ?? idx]));
    return [...volunteerCampuses].sort((a, b) => {
      const posA = a.position !== undefined && a.position !== null ? a.position : (positionMap.get(a.id) ?? 9999);
      const posB = b.position !== undefined && b.position !== null ? b.position : (positionMap.get(b.id) ?? 9999);
      return posA !== posB ? posA - posB : a.name.localeCompare(b.name);
    });
  }, [volunteerCampuses, masterCampuses]);

  // ------ Wizard step state ------
  const [wizardStep, setWizardStep] = useState<WizardStep>('CONFIG');
  const [wizardSelectedCampus, setWizardSelectedCampus] = useState<IVolunteerCampusContext | null>(null);

  // ------ Config step state ------
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<PrinterModeType>('NETWORK');
  const [isBtConnecting, setIsBtConnecting] = useState<boolean>(false);
  const [isBtTesting, setIsBtTesting] = useState<boolean>(false);
  /**
   * Role determined synchronously during wizard navigation (_commitGroup).
   * Set immediately so isKidChurchRole is correct on the first CONFIG render,
   * before Redux's changeCurrentRole dispatch has propagated back to currentRole.
   * Reset to null when the drawer closes.
   */
  const [committedRole, setCommittedRole] = useState<AppRole | null>(null);


  /**
   * Determines whether the printer section should be hidden.
   * Priority: committedRole (set synchronously in wizard) → currentRole (persisted Redux).
   * Using committedRole avoids the Redux timing gap on first-ever login.
   */
  const effectiveRole = committedRole ?? currentRole;
  const isKidChurchRole =
    isActiveKidChurchVolunteerRole ||
    effectiveRole === ChurchRole.MINISTRY_ADMIN ||
    effectiveRole === UserRole.KID_GROUP_ADMIN ||
    effectiveRole === UserRole.KID_GROUP_SUPERVISOR ||
    effectiveRole === UserRole.KID_GROUP_USER;

  // Roles restricted to today's meetings only
  const isDayRestrictedRole =
    !isUserAdmin &&
    (isRegistrationRole ||
      effectiveRole === UserRole.KID_REGISTER_ADMIN ||
      effectiveRole === UserRole.KID_REGISTER_SUPERVISOR ||
      effectiveRole === UserRole.KID_REGISTER_USER ||
      effectiveRole === UserRole.KID_GROUP_ADMIN ||
      effectiveRole === UserRole.KID_GROUP_SUPERVISOR ||
      effectiveRole === UserRole.KID_GROUP_USER);


  // Available campuses
  const availableCampuses = useMemo(() => {
    if (isUserAdmin) return campuses.data;
    if (volunteerCampuses && volunteerCampuses.length > 0) return volunteerCampuses;
    return campuses.data;
  }, [isUserAdmin, volunteerCampuses, campuses.data]);

  // Available groups for selected campus
  const availableGroups = useMemo(() => {
    if (!isChurchRole) return [];
    const campus =
      wizardSelectedCampus ??
      volunteerCampuses.find((c) => c.id === selectedCampusId);
    return campus?.groups ?? [];
  }, [isChurchRole, wizardSelectedCampus, volunteerCampuses, selectedCampusId]);

  // ---- Initialize wizard step on open ----
  useEffect(() => {
    if (!open) return;

    if (isInitialSessionWizard && sortedVolunteerCampuses.length > 0) {
      setWizardSelectedCampus(null);
      setWizardStep('SELECT_CAMPUS');
      return;
    }

    if (forceSelectCampus && sortedVolunteerCampuses.length > 0) {
      setWizardSelectedCampus(null);
      setWizardStep('SELECT_CAMPUS');
      return;
    }

    if (needsOnboarding && sortedVolunteerCampuses.length > 1) {
      // Pre-select active campus if available
      if (volunteerActiveCampusId) {
        const match = sortedVolunteerCampuses.find((c) => c.id === volunteerActiveCampusId);
        if (match) setWizardSelectedCampus(match);
      }
      setWizardStep('SELECT_CAMPUS');
      return;
    }

    if (needsOnboarding && sortedVolunteerCampuses.length === 1) {
      const single = sortedVolunteerCampuses[0];
      setWizardSelectedCampus(single);
      dispatch(setActiveCampus({ campusId: single.id, campusName: single.name }));
      dispatch(updateCurrentChurchCampus(single.id));

      if (single.groups.length > 1) {
        setWizardStep('SELECT_GROUP');
      } else {
        // Auto-select single group & go to CONFIG
        if (single.groups.length === 1) {
          _commitGroup(single.groups[0], isInitialRegistrationWizard);
        }
        setWizardStep(isInitialSessionWizard ? 'SELECT_MEETING' : 'CONFIG');
      }
      return;
    }

    // Normal re-open for already onboarded users
    setWizardStep('CONFIG');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isInitialSessionWizard, sortedVolunteerCampuses.length]);

  // ---- Initialize CONFIG step state from Redux ----
  useEffect(() => {
    if (!open) return;

    // Campus
    const initCampusId =
      volunteerActiveCampusId || campuses.current?.id || '';
    setSelectedCampusId(initCampusId);
    setSelectedMeetingId('');
    if (initCampusId) {
      dispatch(GetChurchMeetings({ churchCampusId: initCampusId, force: true }));
      if (!isKidChurchRole) {
        dispatch(GetChurchPrinters({ churchCampusId: initCampusId, force: true }));
      }
    }

    // Group
    setSelectedGroupId(isInitialSessionWizard ? '' : activeGroupConfigId || '');

    // Meeting
    setSelectedMeetingId(isInitialSessionWizard ? '' : meetings.current?.id || '');

    // Printer
    const isCurrentPrinterActive =
      printers.current?.state === ChurchPrinterStateEnum.ACTIVE;
    setSelectedPrinterId(
      isInitialSessionWizard || !isCurrentPrinterActive ? '' : printers.current?.id || '',
    );
    setSelectedMode(isInitialSessionWizard ? 'NETWORK' : printerModeSlice?.mode || 'NETWORK');

    if (!isUserAdmin) {
      dispatch(GetChurchCampuses({ force: false }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Subscribe to Bluetooth printer events
  useEffect(() => {
    const unsubscribe = bluetoothPrinter.onStatusChange((status) => {
      dispatch(
        setBluetoothStatus({
          isConnected: status.connected,
          name: status.deviceName,
        }),
      );
    });
    return unsubscribe;
  }, [dispatch]);

  // Load meetings and printers when campus changes
  useEffect(() => {
    if (!selectedCampusId || !open) return;
    dispatch(GetChurchMeetings({ churchCampusId: selectedCampusId, force: true }));
    if (!isKidChurchRole) {
      dispatch(GetChurchPrinters({ churchCampusId: selectedCampusId, force: true }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampusId]);

  const handleConnectBluetooth = async () => {
    try {
      setIsBtConnecting(true);
      const name = await bluetoothPrinter.requestAndConnect();
      toast.success(`Impresora "${name}" vinculada correctamente`);
    } catch (err: any) {
      toast.error(err.message || 'Error al conectar impresora Bluetooth');
    } finally {
      setIsBtConnecting(false);
    }
  };

  const handleCancelBluetooth = () => {
    bluetoothPrinter.cancelConnect();
  };

  const handleTestBluetoothPrint = async () => {
    try {
      setIsBtTesting(true);
      await bluetoothPrinter.printTestTicket();
    } finally {
      setIsBtTesting(false);
    }
  };

  /** Commits group context without changing the active module. */
  const _commitGroup = (group: IVolunteerGroupConfigContext, preserveRegistrationRole = false) => {
    const primaryRole = group.areas[0]?.role || group.groupRole || VolunteerRole.VOLUNTEER;
    const currentRegistrationRole =
      preserveRegistrationRole && currentRole && registrationRoles.includes(currentRole as UserRole)
        ? currentRole
        : null;
    const targetRole = currentRegistrationRole || inferRoleFromGroup(group);
    const contextRole = currentRegistrationRole === UserRole.KID_REGISTER_ADMIN
      ? VolunteerRole.AREA_GENERAL_COORDINATOR
      : currentRegistrationRole === UserRole.KID_REGISTER_SUPERVISOR
      ? VolunteerRole.SUPERVISOR
      : currentRegistrationRole === UserRole.KID_REGISTER_USER
      ? VolunteerRole.VOLUNTEER
      : primaryRole;

    dispatch(setActiveGroupConfig({ groupConfigId: group.id, groupConfigName: group.name, role: contextRole }));
    dispatch(setActiveVolunteerRole(contextRole));
    if (targetRole && isRoleEnabled(targetRole)) {
      // Set committedRole synchronously so isKidChurchRole is correct before
      // Redux propagates currentRole back on the first CONFIG render.
      setCommittedRole(targetRole);
      dispatch(changeCurrentRole(targetRole));
    }
  };


  // ---- Wizard handlers ----

  /**
   * Handles campus selection in the wizard's SELECT_CAMPUS step.
   *
   * @param {IVolunteerCampusContext} campus - The selected campus.
   */
  const handleWizardSelectCampus = (campus: IVolunteerCampusContext) => {
    setWizardSelectedCampus(campus);
    setSelectedGroupId('');
    setSelectedMeetingId('');
    setSelectedPrinterId('');
    dispatch(setActiveCampus({ campusId: campus.id, campusName: campus.name }));
    dispatch(updateCurrentChurchCampus(campus.id));
    setSelectedCampusId(campus.id);

    if (campus.groups.length > 1) {
      setWizardStep('SELECT_GROUP');
    } else {
      if (campus.groups.length === 1) {
        _commitGroup(campus.groups[0], isInitialRegistrationWizard);
        setSelectedGroupId(campus.groups[0].id);
      }
      dispatch(setOnboardingCompleted(true));
      setWizardStep(isInitialSessionWizard ? 'SELECT_MEETING' : 'CONFIG');
    }
  };

  /**
   * Handles group selection in the wizard's SELECT_GROUP step.
   *
   * @param {IVolunteerGroupConfigContext} group - The selected group.
   */
  const handleWizardSelectGroup = (group: IVolunteerGroupConfigContext) => {
    _commitGroup(group, isInitialRegistrationWizard);
    setSelectedGroupId(group.id);
    dispatch(setOnboardingCompleted(true));
    setWizardStep(isInitialSessionWizard ? 'SELECT_MEETING' : 'CONFIG');
  };

  /** Selects the service and completes Iglekids setup or advances Regikids to printer selection. */
  const handleWizardSelectMeeting = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    if (isInitialRegistrationWizard) {
      setWizardStep('SELECT_PRINTER');
      return;
    }

    if (selectedCampusId) dispatch(updateCurrentChurchCampus(selectedCampusId));
    dispatch(updateCurrentChurchMeeting(meetingId));
    navigate(APP_ROUTES.kidChurch.root, { replace: true });
    toast.success('Configuración guardada correctamente');
    onOpenChange(false);
  };

  /** Saves the initial session choices after the printer has been selected. */
  const handleWizardSelectPrinter = (printerId: string) => {
    setSelectedPrinterId(printerId);
    if (selectedCampusId) dispatch(updateCurrentChurchCampus(selectedCampusId));
    if (selectedMeetingId) dispatch(updateCurrentChurchMeeting(selectedMeetingId));
    dispatch(setPrinterMode('NETWORK'));
    dispatch(updateCurrentChurchPrinter(printerId));
    toast.success('Configuración guardada correctamente');
    onOpenChange(false);
  };

  // ---- Config step handlers ----

  const handleConnectBt = handleConnectBluetooth;

  /**
   * Handles campus dropdown change in the CONFIG step.
   *
   * @param {string} campusId - The new campus ID.
   */
  const handleCampusChange = (campusId: string) => {
    setSelectedCampusId(campusId);
    setSelectedMeetingId('');

    const volCampus = volunteerCampuses.find((c) => c.id === campusId);
    const newGroups = volCampus?.groups || [];
    setSelectedGroupId(newGroups.length >= 1 ? newGroups[0].id : '');

    const rawCampusPrinters: IChurchPrinter[] =
      (printers as any).printersByCampus?.[campusId] || [];
    const activePrinters = rawCampusPrinters.filter(
      (p) => p.state === ChurchPrinterStateEnum.ACTIVE,
    );
    setSelectedPrinterId(activePrinters.length === 1 ? activePrinters[0].id : '');
  };

  /**
   * Handles meeting dropdown change in the CONFIG step.
   *
   * @param {string} meetingId - The new meeting ID.
   */
  const handleMeetingChange = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    if (availablePrinters.length === 1) {
      setSelectedPrinterId(availablePrinters[0].id);
    } else {
      const isCurrentValid = availablePrinters.some((p) => p.id === selectedPrinterId);
      if (!isCurrentValid) {
        setSelectedPrinterId(availablePrinters.length > 0 ? availablePrinters[0].id : '');
      }
    }
  };

  /**
   * Saves all session settings and closes the drawer.
   */
  const handleSave = () => {
    // 1. Campus
    if (selectedCampusId) {
      dispatch(updateCurrentChurchCampus(selectedCampusId));
      if (isChurchRole) {
        const campus = availableCampuses.find((c: any) => c.id === selectedCampusId);
        if (campus) {
          dispatch(setActiveCampus({ campusId: campus.id, campusName: (campus as any).name || '' }));
        }
      }
    }

    // 2. Group (if multi-group campus in CONFIG step)
    if (isChurchRole && selectedGroupId) {
      const volCampus = volunteerCampuses.find((c) => c.id === selectedCampusId);
      const group = volCampus?.groups.find((g) => g.id === selectedGroupId);
      if (group) {
        const primaryRole = group.areas[0]?.role || group.groupRole || null;
        dispatch(setActiveGroupConfig({ groupConfigId: group.id, groupConfigName: group.name, role: primaryRole }));
        dispatch(setActiveVolunteerRole(primaryRole));
        const targetRole = inferRoleFromGroup(group);
        if (targetRole && isRoleEnabled(targetRole)) {
          dispatch(changeCurrentRole(targetRole));
        }
      }
    }

    // 3. Meeting
    if (selectedMeetingId) dispatch(updateCurrentChurchMeeting(selectedMeetingId));

    // 4. Printer (only for non-Iglekids roles)
    if (!isKidChurchRole) {
      dispatch(setPrinterMode(selectedMode));
      if (selectedMode === 'NETWORK' && selectedPrinterId) {
        dispatch(updateCurrentChurchPrinter(selectedPrinterId));
      }
    }

    toast.success('Configuración guardada correctamente');
    onOpenChange(false);
  };

  /** Dispatches logout action and redirects to login page. */
  const handleLogout = () => {
    onOpenChange(false);
    dispatch(logout());
    navigate(APP_ROUTES.auth.login, { replace: true });
    toast.success('Se ha cerrado su sesión', { duration: 5000 });
  };

  // ---- Derived state ----
  const isBluetoothMode = selectedMode === 'BLUETOOTH';
  const isBluetoothConnected = printerModeSlice?.bluetoothDevice?.isConnected;
  const isConfigured = isKidChurchRole
    ? !!meetings.current
    : isBluetoothMode
    ? !!meetings.current && !!isBluetoothConnected
    : !!meetings.current && !!printers.current;

  const rawMeetings: any[] =
    (meetings as any).meetingsByCampus?.[selectedCampusId] || meetings.data || [];

  const availableMeetings = useMemo(() => {
    if (!isDayRestrictedRole) return rawMeetings;
    const todayDayNum = dayjs().day();
    return rawMeetings.filter((m: any) => {
      const mDay = getMeetingDayNum(m.day);
      return mDay === todayDayNum && m.state === ChurchMeetingStateEnum.ACTIVE;
    });
  }, [isDayRestrictedRole, rawMeetings]);

  // Auto-select single meeting
  useEffect(() => {
    if (!selectedCampusId || !open || isInitialSessionWizard) return;
    if (availableMeetings.length === 1 && selectedMeetingId !== availableMeetings[0].id) {
      setSelectedMeetingId(availableMeetings[0].id);
    }
  }, [availableMeetings, selectedCampusId, selectedMeetingId, open, isInitialSessionWizard]);

  const availablePrinters = useMemo(() => {
    const rawPrinters: IChurchPrinter[] =
      (printers as any).printersByCampus?.[selectedCampusId] ?? [];
    return rawPrinters.filter(
      (p) =>
        p.state === ChurchPrinterStateEnum.ACTIVE ||
        p.id === printers.current?.id,
    );
  }, [printers, selectedCampusId]);

  // Auto-select/align printer when availablePrinters change
  useEffect(() => {
    if (!selectedCampusId || !open || isBluetoothMode || isInitialSessionWizard) return;
    if (availablePrinters.length === 1) {
      if (selectedPrinterId !== availablePrinters[0].id) {
        setSelectedPrinterId(availablePrinters[0].id);
      }
    } else if (availablePrinters.length > 1) {
      const preferredPrinter =
        printers.current &&
        availablePrinters.find((p: IChurchPrinter) => p.id === printers.current?.id);
      if (preferredPrinter) {
        setSelectedPrinterId(preferredPrinter.id);
      } else {
        setSelectedPrinterId(availablePrinters[0].id);
      }
    } else if (availablePrinters.length === 0) {
      if (selectedPrinterId !== '') setSelectedPrinterId('');
    }
  }, [availablePrinters, selectedCampusId, selectedPrinterId, printers.current, open, isBluetoothMode, isInitialSessionWizard]);

  const isMeetingLoading = meetings.loading && rawMeetings.length === 0;
  const isMeetingDisabled = !selectedCampusId || isMeetingLoading;
  const isPrinterLoading = printers.loading && availablePrinters.length === 0;
  const isPrinterDisabled = !selectedCampusId || !selectedMeetingId || isPrinterLoading;

  const isSaveDisabled =
    !selectedCampusId ||
    !selectedMeetingId ||
    (availableGroups.length > 1 && !selectedGroupId) ||
    (!isKidChurchRole && !isBluetoothMode && !selectedPrinterId) ||
    (!isKidChurchRole && isBluetoothMode && !isBluetoothConnected);

  const hasNoMeetingsToday = Boolean(selectedCampusId) && availableMeetings.length === 0 && !isMeetingLoading;

  const userName =
    formatPersonFirstAndLastNames(user?.firstName, user?.lastName) || 'Servidor(a)';

  const hasWizardGroupStep = sortedVolunteerCampuses.some((campus) => campus.groups.length > 1);
  const wizardStepOrder: WizardStep[] = hasWizardGroupStep
    ? isInitialRegistrationWizard
      ? ['SELECT_CAMPUS', 'SELECT_GROUP', 'SELECT_MEETING', 'SELECT_PRINTER']
      : ['SELECT_CAMPUS', 'SELECT_GROUP', 'SELECT_MEETING']
    : isInitialRegistrationWizard
    ? ['SELECT_CAMPUS', 'SELECT_MEETING', 'SELECT_PRINTER']
    : ['SELECT_CAMPUS', 'SELECT_MEETING'];
  const wizardSteps = wizardStepOrder.map((step) =>
    step === 'SELECT_CAMPUS'
      ? 'Sede'
      : step === 'SELECT_GROUP'
      ? 'Grupo'
      : step === 'SELECT_MEETING'
      ? 'Servicio'
      : 'Impresora',
  );
  const currentWizardStep = Math.max(wizardStepOrder.indexOf(wizardStep), 0);

  /** Returns to the previous selection step in the initial session wizard. */
  const handleWizardBack = () => {
    if (wizardStep === 'SELECT_GROUP') {
      setWizardStep('SELECT_CAMPUS');
    } else if (wizardStep === 'SELECT_MEETING') {
      const hasSelectedCampusGroupStep = (wizardSelectedCampus?.groups.length ?? 0) > 1;
      setWizardStep(hasWizardGroupStep && hasSelectedCampusGroupStep ? 'SELECT_GROUP' : 'SELECT_CAMPUS');
    } else if (wizardStep === 'SELECT_PRINTER') {
      setWizardStep('SELECT_MEETING');
    }
  };

  // ---- Render ----
  return (
    <AppDrawer
      open={open}
      onOpenChange={(v) => {
        if (!v) setCommittedRole(null);
        onOpenChange(v);
      }}
      dismissible={isConfigured && wizardStep === 'CONFIG'}
      showCloseButton={isConfigured && wizardStep === 'CONFIG'}
      icon={<Settings size={18} className="text-primary shrink-0" />}
      title="Configuración de Sesión"
      bodyClassName="p-4 flex flex-col gap-5 pb-8"
      onPointerDownOutside={(e) => {
        if (!isConfigured || wizardStep !== 'CONFIG') {
          e.preventDefault();
        } else {
          onOpenChange(false);
        }
      }}
      onInteractOutside={(e) => {
        if (!isConfigured || wizardStep !== 'CONFIG') {
          const target = e.target as HTMLElement | null;
          if (!target?.closest('header') && !target?.closest('[role="menu"]')) {
            e.preventDefault();
          }
        }
      }}
    >
      {isInitialSessionWizard && (
        <div className="flex items-center gap-1 px-1 pb-1" aria-label="Progreso de configuración">
          {wizardSteps.map((step, index) => (
            <React.Fragment key={step}>
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0',
                    index <= currentWizardStep ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400',
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={clsx(
                    'text-[10px] font-bold truncate',
                    index === currentWizardStep ? 'text-primary' : 'text-gray-400',
                  )}
                >
                  {step}
                </span>
              </div>
              {index < wizardSteps.length - 1 && <div className="h-px flex-1 bg-gray-200" />}
            </React.Fragment>
          ))}
        </div>
      )}

      {isInitialSessionWizard && wizardStep !== 'SELECT_CAMPUS' && (
        <button
          type="button"
          onClick={handleWizardBack}
          className="flex items-center gap-1.5 self-start text-xs font-bold text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft size={14} />
          Atrás
        </button>
      )}

      {/* ===================== PASO 1: Selección de Sede ===================== */}
      {wizardStep === 'SELECT_CAMPUS' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="text-center pt-2 pb-1">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-gray-800 tracking-tight">
              ¡Hola, {userName}!
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              ¿En qué sede vas a brindar tu servicio hoy?
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {sortedVolunteerCampuses.map((campus) => {
              const isSelected = isInitialSessionWizard
                ? wizardSelectedCampus?.id === campus.id
                : volunteerActiveCampusId === campus.id;
              const groupCount = campus.groups.length;
              return (
                <button
                  key={campus.id}
                  onClick={() => handleWizardSelectCampus(campus)}
                  className={clsx(
                    'w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all group',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50/80 bg-white shadow-xs',
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={clsx(
                        'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                        isSelected
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary',
                      )}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">
                        {campus.name}
                      </h3>
                      <p className="text-xs text-gray-400 font-medium">
                        {groupCount > 0
                          ? `${groupCount} ${groupCount === 1 ? 'grupo asignado' : 'grupos asignados'}`
                          : 'Coordinación'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
          <div className="pb-safe" />
        </div>
      )}

      {/* ===================== PASO 2: Selección de Grupo ===================== */}
      {wizardStep === 'SELECT_GROUP' && wizardSelectedCampus && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="text-center pt-2 pb-1">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-gray-800 tracking-tight">
              Grupo de Servicio
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              ¿Bajo qué grupo vas a servir en{' '}
              <span className="font-bold text-gray-700">{wizardSelectedCampus.name}</span>?
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {wizardSelectedCampus.groups.map((group) => {
              const isSelected = selectedGroupId === group.id;
              const primaryRole = group.areas[0]?.role || group.groupRole || VolunteerRole.VOLUNTEER;
              const roleLabel =
                primaryRole === VolunteerRole.SUPERVISOR
                  ? 'Supervisor(a)'
                  : primaryRole === VolunteerRole.GROUP_COORDINATOR
                  ? 'Coordinador(a)'
                  : 'Servidor(a)';
              const areasLabel = group.areas.map((a) => a.name).join(', ') || 'Área asignada';

              return (
                <button
                  key={group.id}
                  onClick={() => handleWizardSelectGroup(group)}
                  className={clsx(
                    'w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all group',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50/80 bg-white shadow-xs',
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={clsx(
                        'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                        isSelected
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary',
                      )}
                    >
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">{group.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          {roleLabel}
                        </span>
                        <span className="text-xs text-gray-400 font-medium truncate max-w-[170px]">
                          {areasLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Back to campus selection if multiple campuses */}
          {sortedVolunteerCampuses.length > 1 && (
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => setWizardStep('SELECT_CAMPUS')}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors px-1 py-1"
              >
                <ArrowLeft size={13} />
                Cambiar de sede
              </button>
            </div>
          )}
          <div className="pb-safe" />
        </div>
      )}

      {/* ===================== PASO 3: Selección de Servicio ===================== */}
      {wizardStep === 'SELECT_MEETING' && isInitialSessionWizard && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="text-center pt-2 pb-1">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 shadow-xs">
              <CalendarClock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-gray-800 tracking-tight">Servicio de hoy</h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">¿En qué servicio vas a brindar apoyo?</p>
          </div>

          {isMeetingLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
              <Loader2 size={18} className="animate-spin" /> Cargando servicios...
            </div>
          ) : availableMeetings.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {availableMeetings.map((meeting: any) => (
                <button
                  key={meeting.id}
                  type="button"
                  onClick={() => handleWizardSelectMeeting(meeting.id)}
                  className={clsx(
                    'w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all group',
                    selectedMeetingId === meeting.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50/80 bg-white shadow-xs',
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={clsx(
                      'w-11 h-11 rounded-xl flex items-center justify-center transition-colors',
                      selectedMeetingId === meeting.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary',
                    )}>
                      <CalendarClock className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-800 text-sm">{meeting.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedMeetingId === meeting.id && (
                      <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Alert
                type="warning"
                title="Sin servicios programados hoy"
                message="No se encontraron servicios activos para el día de hoy en tu sede."
              />
              <Button
                type="button"
                variant="ghost"
                onClick={handleLogout}
                className="w-full bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-all shadow-xs"
              >
                <LogOut size={16} /> Cerrar Sesión
              </Button>
            </div>
          )}
          <div className="pb-safe" />
        </div>
      )}

      {/* ===================== PASO 4: Selección de Impresora ===================== */}
      {wizardStep === 'SELECT_PRINTER' && isInitialRegistrationWizard && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="text-center pt-2 pb-1">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Printer className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-gray-800 tracking-tight">Impresora</h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">Selecciona la impresora de tu sede</p>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedMode('NETWORK')}
              className={clsx(
                'py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                selectedMode === 'NETWORK'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              <Printer size={14} />
              <span>Red / Campus</span>
            </button>
            <button
              type="button"
              disabled
              title="Impresión térmica por Bluetooth próximamente"
              className="py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 text-gray-400 cursor-not-allowed bg-gray-50/50 border border-dashed border-gray-300"
            >
              <Bluetooth size={14} className="text-gray-400" />
              <span>Bluetooth</span>
              <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-semibold border border-amber-200">
                Próximamente
              </span>
            </button>
          </div>

          {isPrinterLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
              <Loader2 size={18} className="animate-spin" /> Cargando impresoras...
            </div>
          ) : availablePrinters.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {availablePrinters.map((printer: IChurchPrinter) => (
                <button
                  key={printer.id}
                  type="button"
                  onClick={() => handleWizardSelectPrinter(printer.id)}
                  className={clsx(
                    'w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all group',
                    selectedPrinterId === printer.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50/80 bg-white shadow-xs',
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={clsx(
                      'w-11 h-11 rounded-xl flex items-center justify-center transition-colors',
                      selectedPrinterId === printer.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary',
                    )}>
                      <Printer className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-800 text-sm">{printer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPrinterId === printer.id && (
                      <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Alert
              type="warning"
              title="Sin impresoras disponibles"
              message="No hay una impresora activa configurada para esta sede."
            />
          )}
          <div className="pb-safe" />
        </div>
      )}

      {/* ===================== CONFIG: Configuración manual ===================== */}
      {wizardStep === 'CONFIG' && (
        <>
          {/* Sede a registrar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              <MapPin size={16} className="text-primary" /> Sede a registrar
            </label>
            <div className="relative">
              <select
                className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-3 px-4 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm appearance-none font-medium disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                value={selectedCampusId}
                onChange={(e) => handleCampusChange(e.target.value)}
                disabled={availableCampuses.length <= 1}
              >
                {availableCampuses.length === 0 ? (
                  <option value="" disabled>No hay sedes disponibles</option>
                ) : (
                  <>
                    {availableCampuses.length > 1 && (
                      <option value="" disabled>Seleccione sede...</option>
                    )}
                    {availableCampuses.map((campus: any) => (
                      <option key={campus.id} value={campus.id}>{campus.name}</option>
                    ))}
                  </>
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>

            {/* Single assigned group info badge */}
            {availableGroups.length === 1 && (
              <div className="mt-2.5 flex items-center px-3 py-2 rounded-xl bg-primary/5 border border-primary/15">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Users size={13} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider leading-tight">
                      Grupo asignado
                    </span>
                    <span className="text-xs font-bold text-gray-800 truncate block">
                      {availableGroups[0].name}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Multi-group selector (visible only when campus has >1 groups and we're in CONFIG step) */}
            {availableGroups.length > 1 && (
              <div className="mt-3">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  <Users size={16} className="text-primary" /> Grupo de servicio
                </label>
                <div className="relative">
                  <select
                    className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-3 px-4 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm appearance-none font-medium"
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                  >
                    {availableGroups.length !== 1 && (
                      <option value="" disabled>Seleccione grupo...</option>
                    )}
                    {availableGroups.map((group) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Servicio a registrar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              <CalendarClock size={16} className="text-primary" /> Servicio a registrar
            </label>
            <div className="relative">
              <select
                className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-3 px-4 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm appearance-none font-medium disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                value={selectedMeetingId}
                onChange={(e) => handleMeetingChange(e.target.value)}
                disabled={isMeetingDisabled || (!!selectedCampusId && availableMeetings.length === 0)}
              >
                {availableMeetings.length === 0 ? (
                  <option value="" disabled>
                    {isMeetingLoading ? 'Cargando servicios...' : 'No hay servicios programados para hoy'}
                  </option>
                ) : (
                  <>
                    {availableMeetings.length !== 1 && (
                      <option value="" disabled>Seleccione servicio...</option>
                    )}
                    {availableMeetings.map((meeting: any) => (
                      <option key={meeting.id} value={meeting.id}>{meeting.name}</option>
                    ))}
                  </>
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                {isMeetingLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Sección de Impresión (solo para roles Regikids) */}
          {!isKidChurchRole && (
            <div className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 transition-opacity ${isPrinterDisabled ? 'opacity-60' : ''}`}>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                <Printer size={16} className="text-primary" /> Método de impresión
              </label>

              {/* Mode Selector Tabs */}
              {ENABLE_BLUETOOTH_PRINTING && (
                <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl mb-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMode('NETWORK')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      selectedMode === 'NETWORK'
                        ? 'bg-white text-primary shadow-xs'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Printer size={14} />
                    <span>Red / Campus</span>
                  </button>
                  <button
                    type="button"
                    disabled
                    className="py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-gray-400 cursor-not-allowed bg-gray-50/50 border border-dashed border-gray-300 relative group"
                    title="Impresión móvil por Bluetooth (Próximamente)"
                  >
                    <Bluetooth size={14} className="text-gray-400" />
                    <span>Bluetooth</span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-semibold border border-amber-200">
                      Próximamente
                    </span>
                  </button>
                </div>
              )}

              {/* Network Printer Selector */}
              {selectedMode === 'NETWORK' && (
                <div className="relative">
                  <select
                    className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-3 px-4 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm appearance-none font-medium disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    value={selectedPrinterId}
                    onChange={(e) => setSelectedPrinterId(e.target.value)}
                    disabled={isPrinterDisabled}
                  >
                    {isPrinterLoading ? (
                      <option value="" disabled>Cargando impresoras...</option>
                    ) : availablePrinters.length === 0 ? (
                      <option value="" disabled>No hay impresoras disponibles en esta sede</option>
                    ) : (
                      <>
                        {availablePrinters.length !== 1 && (
                          <option value="" disabled>Seleccione impresora de red...</option>
                        )}
                        {availablePrinters.map((printer: any) => (
                          <option key={printer.id} value={printer.id}>{printer.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    {isPrinterLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    )}
                  </div>
                </div>
              )}

              {/* Bluetooth Device Management */}
              {selectedMode === 'BLUETOOTH' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-3 h-3 rounded-full shrink-0 ${
                          isBluetoothConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
                        }`}
                      />
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          <p className="text-xs font-bold text-gray-800 truncate">
                            {printerModeSlice?.bluetoothDevice?.name || 'Sin impresora vinculada'}
                          </p>
                          {isBluetoothConnected && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary shrink-0">
                              {bluetoothPrinter.getStatus().driverType}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500">
                          {isBluetoothConnected
                            ? 'Conectada y lista para imprimir'
                            : isBtConnecting
                            ? 'Conectando...'
                            : 'No conectada'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isBtConnecting && (
                        <button
                          type="button"
                          onClick={handleCancelBluetooth}
                          className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all active:scale-95"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleConnectBt}
                        disabled={isBtConnecting}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
                      >
                        {isBtConnecting ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Bluetooth size={13} />
                        )}
                        <span>{isBluetoothConnected ? 'Cambiar' : 'Vincular'}</span>
                      </button>
                    </div>
                  </div>

                  {isBluetoothConnected && (
                    <button
                      type="button"
                      onClick={handleTestBluetoothPrint}
                      disabled={isBtTesting}
                      className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                    >
                      {isBtTesting ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <RefreshCw size={13} />
                      )}
                      <span>Imprimir ticket de prueba</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sin servicios hoy → alerta + cerrar sesión */}
          {hasNoMeetingsToday ? (
            <div className="flex flex-col gap-3 mt-1 animate-in fade-in duration-200">
              <Alert
                type="warning"
                title="Sin servicios programados hoy"
                message={
                  isChurchRole || volunteerActiveCampusId
                    ? 'No se encontraron servicios activos para el día de hoy en tu sede asignada. Contacta a tu coordinador(a) o cierra tu sesión.'
                    : 'No se encontraron servicios activos para el día de hoy en esta sede. Puedes seleccionar otra sede o cerrar tu sesión.'
                }
              />
              <Button
                type="button"
                variant="ghost"
                onClick={handleLogout}
                className="w-full bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-all shadow-xs"
              >
                <LogOut size={16} /> Cerrar Sesión
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleSave}
              block
              variant="primary"
              className="mt-2"
              disabled={isSaveDisabled}
            >
              Finalizar
            </Button>
          )}
          <div className="pb-safe" />
        </>
      )}
    </AppDrawer>
  );
};

export default SettingsDrawer;
