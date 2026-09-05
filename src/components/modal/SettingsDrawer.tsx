import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppDrawer from '@/components/ui/AppDrawer';
import { Settings, MapPin, CalendarClock, Printer, X, Loader2, Bluetooth, Check, RefreshCw, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetChurchCampuses, GetChurchMeetings, GetChurchPrinters } from '@/libs/state/redux/thunks/church/church.thunk';
import { updateCurrentChurchCampus } from '@/libs/state/redux/slices/church/churchCampus.slice';
import { updateCurrentChurchMeeting } from '@/libs/state/redux/slices/church/churchMeeting.slice';
import { updateCurrentChurchPrinter } from '@/libs/state/redux/slices/church/churchPrinter.slice';
import { setPrinterMode, setBluetoothStatus, PrinterModeType } from '@/libs/state/redux/slices/church/printerMode.slice';
import { logout } from '@/libs/state/redux/slices/user/auth.slice';
import { ChurchMeetingStateEnum } from '@/libs/models';
import { bluetoothPrinter } from '@/libs/utils/printer/bluetoothPrinter';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { IsAdmin, UserRole } from '@/libs/utils/auth';
import { APP_ROUTES } from '@/config/routes';

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const SettingsDrawer = ({ open, onOpenChange }: SettingsDrawerProps) => {
  useModalBackClose(open, () => onOpenChange(false));

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const campuses = useAppSelector((state) => state.churchCampusSlice);
  const meetings = useAppSelector((state) => state.churchMeetingSlice);
  const printers = useAppSelector((state) => state.churchPrinterSlice);
  const printerModeSlice = useAppSelector((state) => state.printerModeSlice);

  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<PrinterModeType>('NETWORK');
  const [isBtConnecting, setIsBtConnecting] = useState<boolean>(false);
  const [isBtTesting, setIsBtTesting] = useState<boolean>(false);

  const user = useAppSelector((state) => state.authSlice.user);
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);

  const userRoles = (user?.roles as UserRole[]) || [];
  const isUserAdmin =
    IsAdmin(userRoles) ||
    currentRole === UserRole.SUPER_ADMIN ||
    currentRole === UserRole.ADMIN;

  const isKidChurchRole =
    currentRole === 'KID_GROUP_ADMIN' ||
    currentRole === 'KID_GROUP_SUPERVISOR' ||
    currentRole === 'KID_GROUP_USER';

  // Roles restringidos que exclusivamente deben ver las reuniones del día actual (los administradores ven todos los días)
  const isDayRestrictedRole =
    !isUserAdmin &&
    (currentRole === UserRole.KID_REGISTER_ADMIN ||
      currentRole === UserRole.KID_REGISTER_SUPERVISOR ||
      currentRole === UserRole.KID_REGISTER_USER ||
      currentRole === UserRole.KID_CHURCH_ADMIN ||
      currentRole === UserRole.KID_GROUP_ADMIN ||
      currentRole === UserRole.KID_GROUP_SUPERVISOR ||
      currentRole === UserRole.KID_GROUP_USER);

  // Initial load
  useEffect(() => {
    if (open) {
      if (campuses.data.length === 0) {
        dispatch(GetChurchCampuses());
      }
      const activeCampusId = campuses.current?.id || '';
      setSelectedCampusId(activeCampusId);
      setSelectedPrinterId(printers.current?.id || '');
      setSelectedMode(printerModeSlice?.mode || 'NETWORK');
    }
  }, [open]);

  // Subscribe to Bluetooth printer events
  useEffect(() => {
    const unsubscribe = bluetoothPrinter.onStatusChange((status) => {
      dispatch(
        setBluetoothStatus({
          name: status.deviceName,
          isConnected: status.connected,
          error: status.error,
        })
      );
    });
    return () => unsubscribe();
  }, [dispatch]);

  // Load meetings and printers when campus changes
  useEffect(() => {
    if (selectedCampusId && open) {
      dispatch(
        GetChurchMeetings({
          churchCampusId: selectedCampusId,
          state: ChurchMeetingStateEnum.ACTIVE,
        })
      );
      if (!isKidChurchRole) {
        dispatch(GetChurchPrinters(selectedCampusId));
      }
    }
  }, [selectedCampusId, isKidChurchRole, open, dispatch]);

  const handleConnectBluetooth = async () => {
    try {
      setIsBtConnecting(true);
      const name = await bluetoothPrinter.requestAndConnect();
      toast.success(`Conectado a ${name}`);
    } catch (err: any) {
      if (err.name !== 'NotFoundError' && !err.message?.includes('User cancelled')) {
        toast.error(err.message || 'Error al conectar impresora Bluetooth');
      }
    } finally {
      setIsBtConnecting(false);
    }
  };

  const handleCancelBluetooth = () => {
    bluetoothPrinter.cancelConnect();
    setIsBtConnecting(false);
    toast.info('Búsqueda cancelada');
  };

  const handleTestBluetoothPrint = async () => {
    try {
      setIsBtTesting(true);
      await bluetoothPrinter.printTestTicket();
      toast.success('¡Ticket de prueba enviado!');
    } catch (err: any) {
      toast.error(err.message || 'Error al imprimir ticket de prueba');
    } finally {
      setIsBtTesting(false);
    }
  };

  const handleSave = () => {
    if (selectedCampusId) dispatch(updateCurrentChurchCampus(selectedCampusId));
    if (selectedMeetingId) dispatch(updateCurrentChurchMeeting(selectedMeetingId));
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
    toast.success('Se ha cerrado su sesión', {
      duration: 5000,
    });
  };

  const isBluetoothMode = selectedMode === 'BLUETOOTH';
  const isBluetoothConnected = printerModeSlice?.bluetoothDevice?.isConnected;
  const isConfigured = isKidChurchRole
    ? !!meetings.current
    : isBluetoothMode
    ? !!meetings.current && !!isBluetoothConnected
    : !!meetings.current && !!printers.current;

  const rawMeetings: any[] =
    (meetings as any).meetingsByCampus?.[selectedCampusId] || meetings.data || [];

  // Filtrado de reuniones: para roles de Registro e Iglekids, mostrar únicamente las del día de hoy
  const availableMeetings = useMemo(() => {
    if (!isDayRestrictedRole) {
      return rawMeetings;
    }
    const todayDayNum = dayjs().day();
    return rawMeetings.filter((m: any) => {
      const mDay = getMeetingDayNum(m.day);
      return mDay !== undefined && mDay === todayDayNum;
    });
  }, [rawMeetings, isDayRestrictedRole]);

  const availablePrinters =
    (printers as any).printersByCampus?.[selectedCampusId] || printers.data || [];

  // Auto-select or align meeting when availableMeetings change
  useEffect(() => {
    if (!selectedCampusId || !open) return;

    if (availableMeetings.length === 1) {
      if (selectedMeetingId !== availableMeetings[0].id) {
        setSelectedMeetingId(availableMeetings[0].id);
      }
    } else if (availableMeetings.length > 1) {
      const isCurrentValidInList = availableMeetings.some(
        (m: any) => m.id === selectedMeetingId
      );
      if (!isCurrentValidInList) {
        const preferredMeeting =
          meetings.current &&
          availableMeetings.find((m: any) => m.id === meetings.current?.id);
        if (preferredMeeting) {
          setSelectedMeetingId(preferredMeeting.id);
        } else {
          setSelectedMeetingId(availableMeetings[0].id);
        }
      }
    } else if (availableMeetings.length === 0) {
      if (selectedMeetingId !== '') {
        setSelectedMeetingId('');
      }
    }
  }, [availableMeetings, selectedCampusId, selectedMeetingId, meetings.current, open]);

  // Auto-select printer if there is only one available in the list
  useEffect(() => {
    if (availablePrinters.length === 1 && selectedPrinterId !== availablePrinters[0].id) {
      setSelectedPrinterId(availablePrinters[0].id);
    }
  }, [availablePrinters, selectedPrinterId]);

  // Handle Campus Change
  const handleCampusChange = (campusId: string) => {
    setSelectedCampusId(campusId);
    setSelectedMeetingId('');
    const campusPrinters = (printers as any).printersByCampus?.[campusId] || [];
    if (campusPrinters.length === 1) {
      setSelectedPrinterId(campusPrinters[0].id);
    } else {
      setSelectedPrinterId('');
    }
  };

  // Handle Meeting Change
  const handleMeetingChange = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    if (availablePrinters.length === 1) {
      setSelectedPrinterId(availablePrinters[0].id);
    } else {
      setSelectedPrinterId('');
    }
  };

  const isMeetingLoading = meetings.loading && rawMeetings.length === 0;
  const isMeetingDisabled = !selectedCampusId || isMeetingLoading;
  const isPrinterLoading = printers.loading && availablePrinters.length === 0;
  const isPrinterDisabled = !selectedCampusId || !selectedMeetingId || isPrinterLoading;

  const isSaveDisabled =
    !selectedCampusId ||
    !selectedMeetingId ||
    (!isKidChurchRole && !isBluetoothMode && !selectedPrinterId) ||
    (!isKidChurchRole && isBluetoothMode && !isBluetoothConnected);

  const hasNoMeetingsToday = Boolean(selectedCampusId) && availableMeetings.length === 0 && !isMeetingLoading;

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      dismissible={isConfigured}
      showCloseButton={isConfigured}
      icon={<Settings size={18} className="text-primary shrink-0" />}
      title="Configuración de Sesión"
      bodyClassName="p-4 flex flex-col gap-5 pb-8"
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
            
            {/* Sede */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                <MapPin size={16} className="text-primary" /> Sede a registrar
              </label>
              <div className="relative">
                <select 
                  className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-3 px-4 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm appearance-none font-medium disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  value={selectedCampusId}
                  onChange={(e) => handleCampusChange(e.target.value)}
                >
                  <option value="" disabled>Seleccione sede...</option>
                  {campuses.data.map((campus) => (
                    <option key={campus.id} value={campus.id}>{campus.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Servicio */}
            <div className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 transition-opacity ${isMeetingDisabled || (selectedCampusId && availableMeetings.length === 0 && !isMeetingLoading) ? 'opacity-70' : ''}`}>
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
                  {isMeetingLoading ? <Loader2 size={16} className="animate-spin" /> : <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>}
                </div>
              </div>
            </div>

            {/* Sección de Impresión (solo para Regikids) */}
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
                      {availablePrinters.length !== 1 && (
                        <option value="" disabled>Seleccione impresora de red...</option>
                      )}
                      {availablePrinters.map((printer: any) => (
                        <option key={printer.id} value={printer.id}>{printer.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                      {isPrinterLoading ? <Loader2 size={16} className="animate-spin" /> : <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>}
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
                            {isBluetoothConnected ? 'Conectada y lista para imprimir' : isBtConnecting ? 'Conectando...' : 'No conectada'}
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

            {/* Si la sede seleccionada no tiene servicios para hoy, mostrar Alerta + Botón de Cerrar Sesión */}
            {hasNoMeetingsToday ? (
              <div className="flex flex-col gap-3 mt-1 animate-in fade-in duration-200">
                <Alert
                  type="warning"
                  title="Sin servicios programados hoy"
                  message="No se encontraron servicios activos para el día de hoy en esta sede. Puedes seleccionar otra sede o cerrar tu sesión."
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
    </AppDrawer>
  );
};

export default SettingsDrawer;
