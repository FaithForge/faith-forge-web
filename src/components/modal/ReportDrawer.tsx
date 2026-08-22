import React, { useState } from 'react';
import { Drawer } from 'vaul';
import { FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';

interface ReportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NumberInput = ({ label }: { label: string }) => (
  <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
    <span className="text-sm font-bold text-gray-700 pr-4">{label}</span>
    <input 
      type="number" 
      min={0}
      placeholder="Digite un número"
      className="w-32 text-center font-bold text-sm rounded-lg border-2 border-gray-200 bg-gray-50 py-2 focus:border-primary focus:bg-white transition-colors outline-none"
    />
  </div>
);

const RadioGroup = ({ label }: { label: string }) => (
  <div className="flex flex-col gap-2 border-b border-gray-100 py-4 last:border-0">
    <span className="text-sm font-bold text-gray-700">{label}</span>
    <div className="flex gap-4">
      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
        <input type="radio" name={label} defaultChecked className="w-4 h-4 text-primary focus:ring-primary border-gray-300" />
        Si
      </label>
      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
        <input type="radio" name={label} className="w-4 h-4 text-primary focus:ring-primary border-gray-300" />
        No
      </label>
    </div>
  </div>
);

const ReportDrawer = ({ open, onOpenChange }: ReportDrawerProps) => {
  const [observation, setObservation] = useState('');

  const handleSave = () => {
    if (!observation.trim()) {
      toast.error("Por favor escriba su observación");
      return;
    }
    toast.success("Reporte de inventario enviado correctamente");
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[100]" />
        <Drawer.Content className="bg-gray-50 flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-[101] outline-none max-h-[95vh]">
          <div className="p-4 bg-white rounded-t-[20px] border-b border-gray-100 shadow-sm z-20 flex items-center justify-between sticky top-0">
            <div className="w-8" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-1.5 rounded-full bg-gray-300 mb-2" />
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <FileText size={20} className="text-primary" /> Reporte
              </h3>
            </div>
            <button 
              onClick={() => onOpenChange(false)} 
              className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="overflow-y-auto p-4 flex flex-col gap-4 pb-8 z-10">
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="border-b border-gray-100 pb-4 mb-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Grupo que sirvió</label>
                <div className="relative">
                  <select className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-3 px-4 focus:border-primary focus:ring-0 transition-colors outline-none text-sm shadow-sm appearance-none font-medium">
                    <option value="">Seleccione un grupo</option>
                    <option value="1">Grupo 1</option>
                    <option value="2">Grupo 2</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
              <RadioGroup label="¿Esta el computador?" />
              <RadioGroup label="¿Esta el cargador del computador?" />
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <NumberInput label="Cantidad de impresoras" />
              <NumberInput label="Cantidad de cables de impresoras" />
              <NumberInput label="Cantidad de cargadores de impresoras" />
              <NumberInput label="Cantidad de tijeras" />
              <NumberInput label="Cantidad de marcadores" />
              <NumberInput label="Cantidad de lapiceros" />
              <NumberInput label="Cantidad de rollos de impresoras" />
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <RadioGroup label="¿Hay más de 3 paquetes de stickers provisionales?" />
              <RadioGroup label="¿Hay más de 20 stickers de bienvenida (Niños)?" />
              <RadioGroup label="¿Hay más de 20 stickers de stickers de bienvenida (Niñas)?" />
              <RadioGroup label="¿Hay más de 10 stickers de cumpleaños (Niños)?" />
              <RadioGroup label="¿Hay más de 10 stickers de cumpleaños (Niñas)?" />
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold py-2 text-gray-800">Observaciones generales (Obligatorio)</h2>
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                Si tuvo algún inconveniente que desee comentar, queja o reclamo, por favor
                manifestarlo. En caso contrario, manifestar que deja el área en perfectas
                condiciones para el siguiente grupo.
              </p>
              <textarea 
                className="block w-full rounded-xl border-2 border-gray-200 bg-gray-50 text-text-main py-3 px-4 focus:border-primary focus:ring-0 transition-colors outline-none text-sm shadow-inner"
                rows={4}
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Escriba aqui su observación"
              ></textarea>
            </div>

            <Button 
              onClick={handleSave}
              block
              variant="success"
              className="mt-2"
            >
              Finalizar
            </Button>
            
            <div className="pb-10" />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default ReportDrawer;
