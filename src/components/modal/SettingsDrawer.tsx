import React, { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { Settings, MapPin, CalendarClock, Printer, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetChurchCampuses, GetChurchMeetings, GetChurchPrinters } from '@/libs/state/redux/thunks/church/church.thunk';
import { updateCurrentChurchCampus } from '@/libs/state/redux/slices/church/churchCampus.slice';
import { updateCurrentChurchMeeting } from '@/libs/state/redux/slices/church/churchMeeting.slice';
import { updateCurrentChurchPrinter } from '@/libs/state/redux/slices/church/churchPrinter.slice';
import { ChurchMeetingStateEnum } from '@/libs/models';

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDrawer = ({ open, onOpenChange }: SettingsDrawerProps) => {
  const dispatch = useAppDispatch();
  const campuses = useAppSelector((state) => state.churchCampusSlice);
  const meetings = useAppSelector((state) => state.churchMeetingSlice);
  const printers = useAppSelector((state) => state.churchPrinterSlice);

  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');

  // Initial load
  useEffect(() => {
    if (open) {
      if (campuses.data.length === 0) {
        dispatch(GetChurchCampuses());
      }
      setSelectedCampusId(campuses.current?.id || '');
      setSelectedMeetingId(meetings.current?.id || '');
      setSelectedPrinterId(printers.current?.id || '');
    }
  }, [open]);

  // Load meetings and printers when campus changes
  useEffect(() => {
    if (selectedCampusId) {
      dispatch(GetChurchMeetings({ churchCampusId: selectedCampusId, state: ChurchMeetingStateEnum.ACTIVE }));
      dispatch(GetChurchPrinters(selectedCampusId));
    }
  }, [selectedCampusId, dispatch]);

  const handleSave = () => {
    if (selectedCampusId) dispatch(updateCurrentChurchCampus(selectedCampusId));
    if (selectedMeetingId) dispatch(updateCurrentChurchMeeting(selectedMeetingId));
    if (selectedPrinterId) dispatch(updateCurrentChurchPrinter(selectedPrinterId));

    toast.success("Configuración guardada correctamente");
    onOpenChange(false);
  };

  const isConfigured = !!meetings.current && !!printers.current;

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} dismissible={isConfigured}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[100]" />
        <Drawer.Content className="bg-gray-50 flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-[101] outline-none mt-24 max-h-[calc(100vh-6rem)]">
          <div className="p-4 bg-white rounded-t-[20px] border-b border-gray-100 shadow-sm z-20 flex items-center justify-between sticky top-0">
            <div className="w-8" /> {/* Spacer */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-1.5 rounded-full bg-gray-300 mb-2" />
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <Settings size={20} className="text-primary" /> Configuración de Sesión
              </h3>
            </div>
            {isConfigured ? (
              <button 
                onClick={() => onOpenChange(false)} 
                className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            ) : (
              <div className="w-8" />
            )}
          </div>
          
          <div className="overflow-y-auto p-4 flex flex-col gap-5 pb-8">
            
            {/* Sede */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                <MapPin size={16} className="text-primary" /> Sede a registrar
              </label>
              <div className="relative">
                <select 
                  className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-3 px-4 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm appearance-none font-medium disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  value={selectedCampusId}
                  onChange={(e) => setSelectedCampusId(e.target.value)}
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
            <div className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 transition-opacity ${(!selectedCampusId || meetings.loading) ? 'opacity-60' : ''}`}>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                <CalendarClock size={16} className="text-primary" /> Servicio a registrar
              </label>
              <div className="relative">
                <select 
                  className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-3 px-4 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm appearance-none font-medium disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  value={selectedMeetingId}
                  onChange={(e) => setSelectedMeetingId(e.target.value)}
                  disabled={!selectedCampusId || meetings.loading}
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

            {/* Impresora */}
            <div className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 transition-opacity ${(!selectedCampusId || printers.loading) ? 'opacity-60' : ''}`}>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                <Printer size={16} className="text-primary" /> Impresora a usar
              </label>
              <div className="relative">
                <select 
                  className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-3 px-4 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm appearance-none font-medium disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  value={selectedPrinterId}
                  onChange={(e) => setSelectedPrinterId(e.target.value)}
                  disabled={!selectedCampusId || printers.loading}
                >
                  <option value="" disabled>Seleccione impresora...</option>
                  {printers.data.map((printer) => (
                    <option key={printer.id} value={printer.id}>{printer.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  {printers.loading ? <Loader2 size={16} className="animate-spin" /> : <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>}
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSave}
              block
              variant="primary"
              className="mt-2"
              disabled={!selectedCampusId || !selectedMeetingId || !selectedPrinterId}
            >
              Finalizar
            </Button>
            <div className="pb-safe" />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default SettingsDrawer;
