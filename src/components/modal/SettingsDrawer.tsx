import React, { useEffect, useState } from 'react';
import AppDrawer from '@/components/ui/AppDrawer';
import { Settings, MapPin, CalendarClock, Printer, X, Loader2, Bluetooth, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetChurchCampuses, GetChurchMeetings, GetChurchPrinters } from '@/libs/state/redux/thunks/church/church.thunk';
import { updateCurrentChurchCampus } from '@/libs/state/redux/slices/church/churchCampus.slice';
import { updateCurrentChurchMeeting } from '@/libs/state/redux/slices/church/churchMeeting.slice';
import { updateCurrentChurchPrinter } from '@/libs/state/redux/slices/church/churchPrinter.slice';
import { setPrinterMode, setBluetoothStatus, PrinterModeType } from '@/libs/state/redux/slices/church/printerMode.slice';
import { ChurchMeetingStateEnum } from '@/libs/models';
import { bluetoothPrinter } from '@/libs/utils/printer/bluetoothPrinter';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Feature flag for Bluetooth printing (can be disabled when needed)
export const ENABLE_BLUETOOTH_PRINTING = true;

const SettingsDrawer = ({ open, onOpenChange }: SettingsDrawerProps) => {
  useModalBackClose(open, () => onOpenChange(false));

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

  const currentRole = useAppSelector((state) => state.authSlice.currentRole);
  const isKidChurchRole =
    currentRole === 'KID_GROUP_ADMIN' ||
    currentRole === 'KID_GROUP_SUPERVISOR' ||
    currentRole === 'KID_GROUP_USER';

  // Initial load
  useEffect(() => {
    if (open) {
      if (campuses.data.length === 0) {
        dispatch(GetChurchCampuses());
      }
      const activeCampusId = campuses.current?.id || '';
      setSelectedCampusId(activeCampusId);
      setSelectedMeetingId(meetings.current?.id || '');
      setSelectedPrinterId(printers.current?.id || '');
      setSelectedMode(printerModeSlice?.mode || 'NETWORK');

      if (activeCampusId) {
        dispatch(
          GetChurchMeetings({
            churchCampusId: activeCampusId,
            state: ChurchMeetingStateEnum.ACTIVE,
          })
        );
      }
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

  const isBluetoothMode = selectedMode === 'BLUETOOTH';
  const isBluetoothConnected = printerModeSlice?.bluetoothDevice?.isConnected;
  const isConfigured = isKidChurchRole
    ? !!meetings.current
    : isBluetoothMode
    ? !!meetings.current && !!isBluetoothConnected
    : !!meetings.current && !!printers.current;

  // Handle Campus Change
  const handleCampusChange = (campusId: string) => {
    setSelectedCampusId(campusId);
    setSelectedMeetingId('');
    setSelectedPrinterId('');
  };

  // Handle Meeting Change
  const handleMeetingChange = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setSelectedPrinterId('');
  };

  const isMeetingDisabled = !selectedCampusId || meetings.loading;
  const isPrinterDisabled = !selectedCampusId || !selectedMeetingId || printers.loading;

  const isSaveDisabled =
    !selectedCampusId ||
    !selectedMeetingId ||
    (!isKidChurchRole && !isBluetoothMode && !selectedPrinterId) ||
    (!isKidChurchRole && isBluetoothMode && !isBluetoothConnected);

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
            <div className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 transition-opacity ${isMeetingDisabled ? 'opacity-60' : ''}`}>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                <CalendarClock size={16} className="text-primary" /> Servicio a registrar
              </label>
              <div className="relative">
                <select 
                  className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-3 px-4 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm appearance-none font-medium disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  value={selectedMeetingId}
                  onChange={(e) => handleMeetingChange(e.target.value)}
                  disabled={isMeetingDisabled}
                >
                  <option value="" disabled>Seleccione servicio...</option>
                  {meetings.data.map((meeting) => (
                    <option key={meeting.id} value={meeting.id}>{meeting.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  {meetings.loading ? <Loader2 size={16} className="animate-spin" /> : <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>}
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
                      <option value="" disabled>Seleccione impresora de red...</option>
                      {printers.data.map((printer) => (
                        <option key={printer.id} value={printer.id}>{printer.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                      {printers.loading ? <Loader2 size={16} className="animate-spin" /> : <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>}
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
                                {bluetoothPrinter.isNiimbot() ? 'Niimbot' : 'ESC/POS'}
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

            <Button 
              onClick={handleSave}
              block
              variant="primary"
              className="mt-2"
              disabled={isSaveDisabled}
            >
              Finalizar
            </Button>
            <div className="pb-safe" />
    </AppDrawer>
  );
};

export default SettingsDrawer;
