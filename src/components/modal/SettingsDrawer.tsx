import React from 'react';
import { Drawer } from 'vaul';
import { Settings, MapPin, CalendarClock, Printer, X } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDrawer = ({ open, onOpenChange }: SettingsDrawerProps) => {
  const handleSave = () => {
    toast.success("Configuración guardada correctamente");
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[100]" />
        <Drawer.Content className="bg-gray-50 flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-[101] outline-none max-h-[90vh]">
          <div className="p-4 bg-white rounded-t-[20px] border-b border-gray-100 shadow-sm z-10 flex items-center justify-between">
            <div className="w-8" /> {/* Spacer */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-1.5 rounded-full bg-gray-300 mb-2" />
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <Settings size={20} className="text-primary" /> Configuraciones
              </h3>
            </div>
            <button 
              onClick={() => onOpenChange(false)} 
              className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="overflow-y-auto p-4 flex flex-col gap-5 pb-8">
            
            {/* Sede */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                <MapPin size={16} className="text-primary" /> Sede a registrar
              </label>
              <div className="relative">
                <select className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-3 px-4 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm appearance-none font-medium">
                  <option value="1">Villagrande de Indias 2</option>
                  <option value="2">Sede Norte</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Servicio */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                <CalendarClock size={16} className="text-primary" /> Servicio a registrar
              </label>
              <div className="relative">
                <select className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-3 px-4 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm appearance-none font-medium">
                  <option value="1">Viernes de Fe y Milagros</option>
                  <option value="2">Servicio Dominical 1</option>
                  <option value="3">Servicio Dominical 2</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Impresora */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                <Printer size={16} className="text-primary" /> Impresora a usar
              </label>
              <div className="relative">
                <select className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-3 px-4 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm appearance-none font-medium">
                  <option value="1">PRINCIPAL_PRINT_01</option>
                  <option value="2">SECUNDARIA_PRINT_02</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSave}
              block
              variant="success"
              className="mt-2"
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
