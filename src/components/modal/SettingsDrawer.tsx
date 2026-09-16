import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppDrawer from '@/components/ui/AppDrawer';
import {
  Settings,
  MapPin,
  CalendarClock,
  Printer,
  Loader2,
  Bluetooth,
  RefreshCw,
  LogOut,
  Users,
  Building2,
  ChevronsUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import clsx from 'clsx';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import {
  GetChurchCampuses,
  GetChurchMeetings,
  GetChurchPrinters,
} from '@/libs/state/redux/thunks/church/church.thunk';
import { updateCurrentChurchCampus } from '@/libs/state/redux/slices/church/churchCampus.slice';
import { updateCurrentChurchMeeting } from '@/libs/state/redux/slices/church/churchMeeting.slice';
import { updateCurrentChurchPrinter } from '@/libs/state/redux/slices/church/churchPrinter.slice';
import {
  setPrinterMode,
  setBluetoothStatus,
  PrinterModeType,
} from '@/libs/state/redux/slices/church/printerMode.slice';
import { logout, changeCurrentRole } from '@/libs/state/redux/slices/user/auth.slice';
import {
  setActiveCampus,
  setActiveGroupConfig,
  setActiveVolunteerRole,
  setOnboardingCompleted,
} from '@/libs/state/redux/slices/church/volunteerContext.slice';
import { ChurchMeetingStateEnum, ChurchPrinterStateEnum, IChurchPrinter, MinistryType } from '@/libs/models';
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
import { formatPersonShortName } from '@/libs/utils/text';
import { useChurchTerm, useKidsTerm, getVolunteerRoleLabel } from '@/libs/hooks/useTerm';

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Kept for backwards compatibility */
  forceSelectCampus?: boolean;
  sessionWizard?: boolean;
}

// Feature flag for Bluetooth printing (can be disabled when needed)
export const ENABLE_BLUETOOTH_PRINTING = true;

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

  const isRegistration = primaryArea?.scope === 'KID_REGISTRATION';

  if (primaryRole === VolunteerRole.SUPERVISOR) {
    return isRegistration ? UserRole.KID_REGISTER_SUPERVISOR : UserRole.KID_GROUP_SUPERVISOR;
  }
  if (primaryRole === VolunteerRole.GROUP_COORDINATOR) {
    return UserRole.KID_GROUP_ADMIN;
  }
  return isRegistration ? UserRole.KID_REGISTER_USER : UserRole.KID_GROUP_USER;
};

/**
 * Maps a volunteer role to friendly user-facing label adhering strictly to 'Servidor' terminology.
 *
 * @param {string | undefined} role - The volunteer role code.
 * @returns {string} User-friendly role badge text.
 */
const getVolunteerRoleBadgeLabel = (role: string | undefined): string => {
  switch (role) {
    case VolunteerRole.GROUP_COORDINATOR:
      return 'Coordinador(a) de Grupo';
    case VolunteerRole.AREA_GENERAL_COORDINATOR:
      return 'Coordinador(a) de Área';
    case VolunteerRole.MINISTRY_GENERAL_COORDINATOR:
      return 'Coordinador(a) General';
    case VolunteerRole.SUPERVISOR:
      return 'Supervisor(a)';
    case VolunteerRole.VOLUNTEER:
    default:
      return 'Servidor(a)';
  }
};

const SettingsDrawer = ({
  open,
  onOpenChange,
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
    userMsRoles = [],
    campuses: volunteerCampuses = [],
    activeGroupConfigId,
    activeVolunteerRole,
  } = useAppSelector((state) => state.volunteerContextSlice);

  const user = useAppSelector((state) => state.authSlice.user);
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);

  const campusTerm = useChurchTerm('campus');
  const campusesTerm = useChurchTerm('campuses');
  const meetingTerm = useChurchTerm('meeting');
  const meetingsTerm = useChurchTerm('meetings');

  const userRoles = (user?.roles as UserRole[]) || [];
  const isUserAdmin =
    IsAdmin(userRoles) ||
    currentRole === UserRole.SUPER_ADMIN ||
    currentRole === UserRole.ADMIN;

  const isCurrentRoleAdmin =
    currentRole === UserRole.SUPER_ADMIN ||
    currentRole === UserRole.ADMIN ||
    currentRole === UserRole.STAFF;

  const isChurchRole =
    isChurchVolunteer &&
    (!currentRole || !userMsRoles.includes(currentRole));

  const registrationRoles = [
    UserRole.KID_REGISTER_ADMIN,
    UserRole.KID_REGISTER_SUPERVISOR,
    UserRole.KID_REGISTER_USER,
  ];

  const isRegistrationRole = currentRole
    ? registrationRoles.includes(currentRole as UserRole)
    : userRoles.some((role) => registrationRoles.includes(role));

  const isActiveKidChurchVolunteerRole =
    activeVolunteerRole === VolunteerRole.GROUP_COORDINATOR ||
    activeVolunteerRole === VolunteerRole.MINISTRY_GENERAL_COORDINATOR;

  // Master campuses list sorted by position
  const masterCampuses = useAppSelector((state) => state.churchCampusSlice.data);
  const sortedVolunteerCampuses = useMemo(() => {
    const positionMap = new Map(masterCampuses.map((c, idx) => [c.id, c.position ?? idx]));
    return [...volunteerCampuses].sort((a, b) => {
      const posA = a.position !== undefined && a.position !== null ? a.position : (positionMap.get(a.id) ?? 9999);
      const posB = b.position !== undefined && b.position !== null ? b.position : (positionMap.get(b.id) ?? 9999);
      return posA !== posB ? posA - posB : a.name.localeCompare(b.name);
    });
  }, [volunteerCampuses, masterCampuses]);

  // Available campuses for user
  const availableCampuses = useMemo(() => {
    if (isUserAdmin) return masterCampuses;
    if (sortedVolunteerCampuses.length > 0) return sortedVolunteerCampuses;
    return masterCampuses;
  }, [isUserAdmin, sortedVolunteerCampuses, masterCampuses]);

  // Form states
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<PrinterModeType>('NETWORK');
  const [isBtConnecting, setIsBtConnecting] = useState<boolean>(false);
  const [isBtTesting, setIsBtTesting] = useState<boolean>(false);

  // Available groups for selected campus
  const availableGroups = useMemo(() => {
    if (!isChurchRole && !volunteerCampuses.length) return [];
    const campus = sortedVolunteerCampuses.find((c) => c.id === selectedCampusId);
    return campus?.groups ?? [];
  }, [isChurchRole, volunteerCampuses.length, sortedVolunteerCampuses, selectedCampusId]);

  const currentSelectedGroup = useMemo(() => {
    if (selectedGroupId) {
      return availableGroups.find((g) => g.id === selectedGroupId) || null;
    }
    return availableGroups.length === 1 ? availableGroups[0] : null;
  }, [availableGroups, selectedGroupId]);

  // Resolve whether effective role is Kid Church vs Registration
  const isKidChurchRole = useMemo(() => {
    if (isActiveKidChurchVolunteerRole) return true;
    if (currentRole) {
      if (
        currentRole === ChurchRole.MINISTRY_ADMIN ||
        currentRole === UserRole.KID_GROUP_ADMIN ||
        currentRole === UserRole.KID_GROUP_SUPERVISOR ||
        currentRole === UserRole.KID_GROUP_USER
      ) {
        return true;
      }
      if (
        currentRole === UserRole.KID_REGISTER_ADMIN ||
        currentRole === UserRole.KID_REGISTER_SUPERVISOR ||
        currentRole === UserRole.KID_REGISTER_USER
      ) {
        return false;
      }
    }
    if (currentSelectedGroup) {
      const inferred = inferRoleFromGroup(currentSelectedGroup);
      if (inferred && [UserRole.KID_GROUP_ADMIN, UserRole.KID_GROUP_SUPERVISOR, UserRole.KID_GROUP_USER].includes(inferred as UserRole)) {
        return true;
      }
      if (inferred && [UserRole.KID_REGISTER_ADMIN, UserRole.KID_REGISTER_SUPERVISOR, UserRole.KID_REGISTER_USER].includes(inferred as UserRole)) {
        return false;
      }
    }
    return !isRegistrationRole;
  }, [isActiveKidChurchVolunteerRole, currentRole, currentSelectedGroup, isRegistrationRole]);

  // Roles restricted to today's meetings only
  const isDayRestrictedRole = !isUserAdmin;

  // Initialize form state upon opening drawer
  useEffect(() => {
    if (!open) return;

    // 1. Campus selection
    const initCampusId =
      volunteerActiveCampusId ||
      campuses.current?.id ||
      (availableCampuses.length === 1 ? availableCampuses[0].id : '') ||
      '';
    setSelectedCampusId(initCampusId);

    // 2. Load campus data if campus is set
    if (initCampusId) {
      dispatch(GetChurchMeetings({ churchCampusId: initCampusId, force: true }));
      if (!isKidChurchRole) {
        dispatch(GetChurchPrinters({ churchCampusId: initCampusId, force: true }));
      }
    }

    // 3. Group selection
    const volCampus = sortedVolunteerCampuses.find((c) => c.id === initCampusId);
    const groups = volCampus?.groups || [];
    if (!isCurrentRoleAdmin) {
      if (groups.length === 1) {
        setSelectedGroupId(groups[0].id);
      } else if (groups.length > 1) {
        const matching = groups.find((g) => g.id === activeGroupConfigId);
        setSelectedGroupId(matching ? matching.id : '');
      } else {
        setSelectedGroupId('');
      }
    } else {
      setSelectedGroupId('');
    }

    // 4. Meeting selection
    setSelectedMeetingId(meetings.current?.id || '');

    // 5. Printer selection
    const isCurrentPrinterActive =
      printers.current?.state === ChurchPrinterStateEnum.ACTIVE;
    setSelectedPrinterId(isCurrentPrinterActive ? printers.current?.id || '' : '');
    setSelectedMode(printerModeSlice?.mode || 'NETWORK');

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

  // Reload meetings & printers whenever selected campus changes
  useEffect(() => {
    if (!selectedCampusId || !open) return;
    dispatch(GetChurchMeetings({ churchCampusId: selectedCampusId, force: true }));
    if (!isKidChurchRole) {
      dispatch(GetChurchPrinters({ churchCampusId: selectedCampusId, force: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampusId, isKidChurchRole]);

  // Filter meetings
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

  // Auto-select meeting if only 1 meeting available for today
  useEffect(() => {
    if (!selectedCampusId || !open) return;
    if (availableMeetings.length === 1 && selectedMeetingId !== availableMeetings[0].id) {
      setSelectedMeetingId(availableMeetings[0].id);
    } else if (availableMeetings.length > 1) {
      const isValid = availableMeetings.some((m: any) => m.id === selectedMeetingId);
      if (!isValid) {
        const preferred = meetings.current && availableMeetings.find((m: any) => m.id === meetings.current?.id);
        setSelectedMeetingId(preferred ? preferred.id : '');
      }
    }
  }, [availableMeetings, selectedCampusId, selectedMeetingId, meetings.current, open]);

  // Filter printers
  const availablePrinters = useMemo(() => {
    const rawPrinters: IChurchPrinter[] =
      (printers as any).printersByCampus?.[selectedCampusId] ?? [];
    return rawPrinters.filter(
      (p) =>
        p.state === ChurchPrinterStateEnum.ACTIVE ||
        p.id === printers.current?.id,
    );
  }, [printers, selectedCampusId]);

  // Auto-select printer if only 1 available
  useEffect(() => {
    if (!selectedCampusId || !open || selectedMode === 'BLUETOOTH') return;
    if (availablePrinters.length === 1) {
      if (selectedPrinterId !== availablePrinters[0].id) {
        setSelectedPrinterId(availablePrinters[0].id);
      }
    } else if (availablePrinters.length > 1) {
      const preferred = printers.current && availablePrinters.find((p: IChurchPrinter) => p.id === printers.current?.id);
      if (preferred) {
        setSelectedPrinterId(preferred.id);
      } else {
        const isValid = availablePrinters.some((p: IChurchPrinter) => p.id === selectedPrinterId);
        if (!isValid) {
          setSelectedPrinterId('');
        }
      }
    }
  }, [availablePrinters, selectedCampusId, selectedPrinterId, printers.current, open, selectedMode]);

  // Handlers
  const handleCampusChange = (campusId: string) => {
    setSelectedCampusId(campusId);
    setSelectedMeetingId('');

    const volCampus = sortedVolunteerCampuses.find((c) => c.id === campusId);
    const newGroups = volCampus?.groups || [];
    setSelectedGroupId(newGroups.length === 1 ? newGroups[0].id : '');

    const rawCampusPrinters: IChurchPrinter[] =
      (printers as any).printersByCampus?.[campusId] || [];
    const activePrinters = rawCampusPrinters.filter(
      (p) => p.state === ChurchPrinterStateEnum.ACTIVE,
    );
    setSelectedPrinterId(activePrinters.length === 1 ? activePrinters[0].id : '');
  };

  const handleMeetingChange = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
  };

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

  /** Saves all session settings and closes drawer. */
  const handleSave = () => {
    // 1. Campus
    if (selectedCampusId) {
      dispatch(updateCurrentChurchCampus(selectedCampusId));
      const campusObj = availableCampuses.find((c: any) => c.id === selectedCampusId);
      if (campusObj) {
        dispatch(setActiveCampus({ campusId: campusObj.id, campusName: campusObj.name }));
      }
    }

    // 2. Group context & inferred role
    if (isCurrentRoleAdmin) {
      dispatch(
        setActiveGroupConfig({
          groupConfigId: '',
          groupConfigName: '',
          role: null,
        }),
      );
      dispatch(setActiveVolunteerRole(null));
    } else if (currentSelectedGroup) {
      const effectiveVolunteerRole =
        activeVolunteerRole ||
        (currentRole === UserRole.KID_GROUP_ADMIN || currentRole === UserRole.KID_REGISTER_ADMIN
          ? VolunteerRole.GROUP_COORDINATOR
          : currentRole === UserRole.KID_GROUP_SUPERVISOR || currentRole === UserRole.KID_REGISTER_SUPERVISOR
          ? VolunteerRole.SUPERVISOR
          : currentSelectedGroup.areas[0]?.role || currentSelectedGroup.groupRole || VolunteerRole.VOLUNTEER);

      dispatch(
        setActiveGroupConfig({
          groupConfigId: currentSelectedGroup.id,
          groupConfigName: currentSelectedGroup.name,
          role: effectiveVolunteerRole,
        }),
      );
      dispatch(setActiveVolunteerRole(effectiveVolunteerRole));

      // ONLY set initial operational role if user has no role set or is on base USER role
      if (!currentRole || currentRole === UserRole.USER) {
        const targetRole = inferRoleFromGroup(currentSelectedGroup);
        if (targetRole && isRoleEnabled(targetRole)) {
          dispatch(changeCurrentRole(targetRole));
        }
      }
    }

    // 3. Meeting
    if (selectedMeetingId) {
      dispatch(updateCurrentChurchMeeting(selectedMeetingId));
    }

    // 4. Printer (only if Registration)
    if (!isKidChurchRole) {
      dispatch(setPrinterMode(selectedMode));
      if (selectedMode === 'NETWORK' && selectedPrinterId) {
        dispatch(updateCurrentChurchPrinter(selectedPrinterId));
      }
    }

    dispatch(setOnboardingCompleted(true));
    onOpenChange(false);
  };

  const handleLogout = () => {
    onOpenChange(false);
    dispatch(logout());
    navigate(APP_ROUTES.auth.login, { replace: true });
    toast.success('Se ha cerrado su sesión', { duration: 5000 });
  };

  const isBluetoothMode = selectedMode === 'BLUETOOTH';
  const isBluetoothConnected = printerModeSlice?.bluetoothDevice?.isConnected;

  const isConfigured = isKidChurchRole
    ? !!meetings.current
    : isBluetoothMode
    ? !!meetings.current && !!isBluetoothConnected
    : !!meetings.current && !!printers.current;

  const isMeetingLoading = meetings.loading && rawMeetings.length === 0;
  const isMeetingDisabled = !selectedCampusId || isMeetingLoading;
  const isPrinterLoading = printers.loading && availablePrinters.length === 0;
  const isPrinterDisabled = !selectedCampusId || !selectedMeetingId || isPrinterLoading;

  const hasNoMeetingsToday = Boolean(selectedCampusId) && availableMeetings.length === 0 && !isMeetingLoading;

  const isSaveDisabled =
    !selectedCampusId ||
    !selectedMeetingId ||
    (availableGroups.length > 0 && !selectedGroupId) ||
    (!isKidChurchRole && !isBluetoothMode && !selectedPrinterId) ||
    (!isKidChurchRole && isBluetoothMode && !isBluetoothConnected);

  // Shows full given name(s) and only the first last name (e.g. "Juan Carlos Peña" or "Juan Peña")
  const userName =
    formatPersonShortName(user?.firstName, user?.lastName) || 'Servidor(a)';

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      dismissible={isConfigured}
      showCloseButton={isConfigured}
      icon={<Settings size={18} className="text-primary shrink-0" />}
      title="Configuración de Sesión"
      bodyClassName="p-4 flex flex-col gap-4 pb-8"
      onPointerDownOutside={(e) => {
        if (!isConfigured) {
          e.preventDefault();
        } else {
          onOpenChange(false);
        }
      }}
      onInteractOutside={(e) => {
        if (!isConfigured) {
          const target = e.target as HTMLElement | null;
          if (!target?.closest('header') && !target?.closest('[role="menu"]')) {
            e.preventDefault();
          }
        }
      }}
    >
      {/* Friendly greeting & instructions */}
      <div className="flex items-center gap-3 bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-gray-900 truncate">
            ¡Hola, {userName}!
          </h2>
          <p className="text-xs text-gray-500 font-medium truncate">
            Verifica tu {campusTerm.toLowerCase()} y {meetingTerm.toLowerCase()} asignada para hoy
          </p>
        </div>
      </div>

      {/* ===================== CARD 1: Sede de Servicio ===================== */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col gap-3">
        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
          <Building2 size={16} className="text-primary" /> {campusTerm} de Servicio
        </label>

        {availableCampuses.length === 1 ? (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200/80 text-gray-800">
            <MapPin size={16} className="text-primary shrink-0" />
            <span className="font-bold text-sm text-gray-800 truncate">
              {availableCampuses[0].name}
            </span>
          </div>
        ) : (
          <div className="relative">
            <select
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white text-gray-900 py-2.5 px-3.5 pr-9 font-medium text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer shadow-xs"
              value={selectedCampusId}
              onChange={(e) => handleCampusChange(e.target.value)}
            >
              {availableCampuses.length === 0 ? (
                <option value="" disabled>No hay {campusesTerm.toLowerCase()} disponibles</option>
              ) : (
                <>
                  <option value="" disabled>Seleccione {campusTerm.toLowerCase()}...</option>
                  {availableCampuses.map((campus: any) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <ChevronsUpDown size={15} />
            </div>
          </div>
        )}

        {/* Grupo de servicio: Asignación única */}
        {!isCurrentRoleAdmin && availableGroups.length === 1 && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-primary/5 border border-primary/15">
            <div className="flex items-center gap-2 min-w-0">
              <Users size={14} className="text-primary shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider leading-none">
                  Grupo asignado
                </span>
                <span className="text-xs font-bold text-gray-800 truncate block mt-0.5">
                  {availableGroups[0].name}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary shrink-0">
              {getVolunteerRoleLabel(
                activeVolunteerRole ||
                (currentRole === UserRole.KID_GROUP_ADMIN || currentRole === UserRole.KID_REGISTER_ADMIN
                  ? VolunteerRole.GROUP_COORDINATOR
                  : currentRole === UserRole.KID_GROUP_SUPERVISOR || currentRole === UserRole.KID_REGISTER_SUPERVISOR
                  ? VolunteerRole.SUPERVISOR
                  : availableGroups[0].areas[0]?.role || availableGroups[0].groupRole || VolunteerRole.VOLUNTEER),
                {
                  ministryType: isKidChurchRole ? MinistryType.KIDS : MinistryType.GENERAL,
                }
              )}
            </span>
          </div>
        )}

        {/* Selector de grupo si el voluntario tiene múltiples grupos en la sede */}
        {!isCurrentRoleAdmin && availableGroups.length > 1 && (
          <div className="pt-1">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              <Users size={13} className="text-primary" /> Grupo de Servicio
            </label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white text-gray-900 py-2.5 px-3.5 pr-9 font-medium text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer shadow-xs"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                <option value="" disabled>Seleccione grupo de servicio...</option>
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <ChevronsUpDown size={15} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================== CARD 2: Servicio o Reunión ===================== */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col gap-3">
        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
          <CalendarClock size={16} className="text-primary" /> {meetingTerm}
        </label>

        {isMeetingLoading ? (
          <div className="flex items-center justify-center gap-2 py-4 text-xs font-medium text-gray-500 bg-gray-50 rounded-xl">
            <Loader2 size={16} className="animate-spin text-primary" />
            Cargando {meetingsTerm.toLowerCase()} de hoy...
          </div>
        ) : hasNoMeetingsToday ? (
          <div className="flex flex-col gap-3">
            <Alert
              type="warning"
              title={`Sin ${meetingsTerm.toLowerCase()} programadas hoy`}
              message={`No se encontraron ${meetingsTerm.toLowerCase()} activas para el día de hoy en la ${campusTerm.toLowerCase()} seleccionada.`}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={handleLogout}
              className="w-full bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 font-bold py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-xs"
            >
              <LogOut size={15} /> Cerrar Sesión
            </Button>
          </div>
        ) : (
          <div className="relative">
            <select
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white text-gray-900 py-2.5 px-3.5 pr-9 font-medium text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer shadow-xs disabled:bg-gray-50 disabled:text-gray-400"
              value={selectedMeetingId}
              onChange={(e) => handleMeetingChange(e.target.value)}
              disabled={isMeetingDisabled}
            >
              {availableMeetings.length === 0 ? (
                <option value="" disabled>No hay {meetingsTerm.toLowerCase()} disponibles</option>
              ) : (
                <>
                  {availableMeetings.length > 1 && (
                    <option value="" disabled>Seleccione {meetingTerm.toLowerCase()}...</option>
                  )}
                  {availableMeetings.map((meeting: any) => (
                    <option key={meeting.id} value={meeting.id}>
                      {meeting.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <ChevronsUpDown size={15} />
            </div>
          </div>
        )}
      </div>

      {/* ===================== CARD 3: Método de Impresión (Registro de Niños) ===================== */}
      {!isKidChurchRole && (
        <div className={clsx(
          'bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col gap-3 transition-opacity',
          isPrinterDisabled && 'opacity-60',
        )}>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <Printer size={16} className="text-primary" /> Método de Impresión
          </label>

          {/* Mode Selector Tabs */}
          {ENABLE_BLUETOOTH_PRINTING && (
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
                <span>Red / {campusTerm}</span>
              </button>
              <button
                type="button"
                disabled
                className="py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 text-gray-400 cursor-not-allowed bg-gray-50/50 border border-dashed border-gray-300"
                title="Impresión térmica por Bluetooth próximamente"
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
            <>
              {isPrinterLoading ? (
                <div className="flex items-center justify-center gap-2 py-4 text-xs font-medium text-gray-500 bg-gray-50 rounded-xl">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  Cargando impresoras de la {campusTerm.toLowerCase()}...
                </div>
              ) : availablePrinters.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-800 text-xs font-medium">
                  No hay impresoras de red activas en esta {campusTerm.toLowerCase()}.
                </div>
              ) : (
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white text-gray-900 py-2.5 px-3.5 pr-9 font-medium text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer shadow-xs disabled:bg-gray-50 disabled:text-gray-400"
                    value={selectedPrinterId}
                    onChange={(e) => setSelectedPrinterId(e.target.value)}
                    disabled={isPrinterDisabled}
                  >
                    {availablePrinters.length > 1 && (
                      <option value="" disabled>Seleccione impresora de red...</option>
                    )}
                    {availablePrinters.map((printer: any) => (
                      <option key={printer.id} value={printer.id}>
                        {printer.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <ChevronsUpDown size={15} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Bluetooth controls */}
          {selectedMode === 'BLUETOOTH' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={clsx(
                      'w-2.5 h-2.5 rounded-full shrink-0',
                      isBluetoothConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300',
                    )}
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-800 truncate">
                      {printerModeSlice?.bluetoothDevice?.name || 'Sin impresora vinculada'}
                    </p>
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
                    onClick={handleConnectBluetooth}
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

      {/* ===================== FOOTER BUTTON ===================== */}
      {!hasNoMeetingsToday && (
        <Button
          onClick={handleSave}
          block
          variant="primary"
          size="lg"
          className="mt-1 shadow-md shadow-primary/20 font-bold"
          disabled={isSaveDisabled}
        >
          Finalizar
        </Button>
      )}

      <div className="pb-safe" />
    </AppDrawer>
  );
};

export default SettingsDrawer;
