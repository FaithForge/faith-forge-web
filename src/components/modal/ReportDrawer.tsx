import React, { useState } from 'react';
import { Drawer } from 'vaul';
import { FileText, X, Share2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { churchGroupOptions } from '@/libs/common-types/constants/church';
import { useAppSelector } from '@/libs/state/redux/hooks';
import dayjs from 'dayjs';

interface ReportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NumberInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
  <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0 gap-3">
    <span className="text-sm font-bold text-gray-700">{label}</span>
    <input 
      type="number" 
      min={0}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      className="w-20 text-center font-semibold text-base rounded-xl border-2 border-gray-200 bg-white py-2 px-2 text-text-main focus:border-primary transition-colors outline-none shadow-sm shrink-0"
    />
  </div>
);

const RadioGroup = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
  <div className="flex flex-col gap-2 border-b border-gray-100 py-4 last:border-0">
    <span className="text-sm font-bold text-gray-700">{label}</span>
    <div className="flex gap-4">
      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
        <input 
          type="radio" 
          checked={value === 'Si'}
          onChange={() => onChange('Si')}
          className="w-4 h-4 text-primary focus:ring-primary border-gray-300" 
        />
        Si
      </label>
      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
        <input 
          type="radio" 
          checked={value === 'No'}
          onChange={() => onChange('No')}
          className="w-4 h-4 text-primary focus:ring-primary border-gray-300" 
        />
        No
      </label>
    </div>
  </div>
);

const defaultState = {
  group: '',
  computer: 'Si',
  computerCharger: 'Si',
  printer: '',
  printerCables: '',
  printerCharger: '',
  scissors: '',
  markers: '',
  pencils: '',
  printerRolls: '',
  stickerPacks: 'Si',
  welcomeStickerBoy: 'Si',
  welcomeStickerGirl: 'Si',
  birthdayStickerBoy: 'Si',
  birthdayStickerGirl: 'Si',
  observationGeneral: '',
};

import { useModalBackClose } from '@/libs/hooks/useModalBackClose';

const ReportDrawer = ({ open, onOpenChange }: ReportDrawerProps) => {
  useModalBackClose(open, () => onOpenChange(false));

  const currentCampus = useAppSelector(state => state.churchCampusSlice.current);
  const currentMeeting = useAppSelector(state => state.churchMeetingSlice.current);

  const [state, setState] = useState(defaultState);
  const [isFinished, setIsFinished] = useState(false);

  const updateState = (updates: Partial<typeof defaultState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    // Validations (all fields mandatory)
    if (!state.group) return toast.error("Por favor seleccione un grupo");
    if (!state.printer) return toast.error("Por favor digite la cantidad de impresoras");
    if (!state.printerCables) return toast.error("Por favor digite la cantidad de cables de impresoras");
    if (!state.printerCharger) return toast.error("Por favor digite la cantidad de cargadores de impresoras");
    if (!state.scissors) return toast.error("Por favor digite la cantidad de tijeras");
    if (!state.markers) return toast.error("Por favor digite la cantidad de marcadores");
    if (!state.pencils) return toast.error("Por favor digite la cantidad de lapiceros");
    if (!state.printerRolls) return toast.error("Por favor digite la cantidad de rollos de impresoras");
    if (!state.observationGeneral.trim()) return toast.error("Por favor escriba su observación general");

    setIsFinished(true);
  };

  const onFinish = () => {
    setState(defaultState);
    setIsFinished(false);
    onOpenChange(false);
  };

  const generateReport = () => {
    const now = dayjs().format('YYYY-MM-DD');
    return `*📝 Reporte de Servicio*
📅 ${now}
📍 ${currentCampus?.name || 'N/A'}
⛪ ${currentMeeting?.name || 'N/A'}
👥 Grupo: ${state.group}

*📋 Inventario*
💻 Comp: ${state.computer === 'Si' ? '✅' : '❌'}
🔌 Carg. Comp: ${state.computerCharger === 'Si' ? '✅' : '❌'}
🖨️ Impresora: ${state.printer}
🔌 Cab. Impresora: ${state.printerCables}
🔋 Carg. Impresora: ${state.printerCharger}
📦 Rollos: ${state.printerRolls}
✂️ Tijeras: ${state.scissors}
🖍️ Marcadores: ${state.markers}
🖊️ Lapiceros: ${state.pencils}
📦 Stickers prov. (3+): ${state.stickerPacks === 'Si' ? '✅' : '❌'}
👦🎉 Bienv. Niños (20+): ${state.welcomeStickerBoy === 'Si' ? '✅' : '❌'}
👧🎉 Bienv. Niñas (20+): ${state.welcomeStickerGirl === 'Si' ? '✅' : '❌'}
👦🎂 Cumple. Niños (10+): ${state.birthdayStickerBoy === 'Si' ? '✅' : '❌'}
👧🎂 Cumple. Niñas (10+): ${state.birthdayStickerGirl === 'Si' ? '✅' : '❌'}

*ℹ️ Observaciones*
${state.observationGeneral}`;
  };

  const shareReport = async () => {
    const text = generateReport();
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      copyReport();
    }
  };

  const copyReport = () => {
    navigator.clipboard.writeText(generateReport())
      .then(() => toast.success('Texto copiado al portapapeles'))
      .catch(() => toast.error('Error al copiar'));
  };

  return (
    <Drawer.Root handleOnly open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/50 z-[150]" />
        <Drawer.Content 
          className="bg-gray-50 flex flex-col rounded-t-[24px] fixed bottom-0 left-0 right-0 z-[151] outline-none mt-20 max-h-[calc(100vh-5rem)]"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="w-full bg-white rounded-t-[24px] border-b border-gray-100 shadow-xs z-20 flex items-center justify-between px-4 py-3.5 sticky top-0">
            <div className="w-8 shrink-0" />
            <h3 className="font-bold text-gray-800 text-base sm:text-lg flex items-center justify-center gap-2 text-center flex-1 truncate px-2">
              <FileText size={18} className="text-primary shrink-0" />
              <span className="truncate">Reporte Regikids</span>
            </h3>
            <button 
              type="button"
              onClick={onFinish} 
              className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 active:scale-95 transition-all shrink-0"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="overflow-y-auto p-4 flex flex-col gap-4 pb-8 z-10">
            {isFinished ? (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center flex flex-col items-center">
                <h2 className="text-xl font-bold text-gray-800 mb-2">¡Reporte generado!</h2>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  Elige si deseas compartir por WhatsApp (se abrirá el selector y elige el grupo de Supervisores Regikids) o copia el texto y pégalo en el grupo. Una vez terminado, cierra esta ventana.
                </p>
                <div className="w-full flex flex-col gap-3">
                  <Button onClick={shareReport} block className="flex items-center justify-center gap-2">
                    <Share2 size={18} /> Compartir
                  </Button>
                  <Button onClick={copyReport} block variant="ghost" className="flex items-center justify-center gap-2">
                    <Copy size={18} /> Copiar texto
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-bold py-2 text-gray-800">Información del grupo y servicio (Obligatorio)</h2>
                  <p className="text-sm text-gray-600 mb-1"><span className="font-bold">Sede para el reporte:</span> {currentCampus?.name}</p>
                  <p className="text-sm text-gray-600 mb-4"><span className="font-bold">Reunión para el reporte:</span> {currentMeeting?.name}</p>

                  <div className="border-t border-gray-100 pt-4 mb-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Grupo que sirvió</label>
                    <div className="relative">
                      <select 
                        value={state.group}
                        onChange={(e) => updateState({ group: e.target.value })}
                        className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-3 px-4 focus:border-primary focus:ring-0 transition-colors outline-none text-sm shadow-sm appearance-none font-medium"
                      >
                        <option value="">Seleccione un grupo</option>
                        {churchGroupOptions.map((group) => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                  <RadioGroup label="¿Esta el computador?" value={state.computer} onChange={(val) => updateState({ computer: val })} />
                  <RadioGroup label="¿Esta el cargador del computador?" value={state.computerCharger} onChange={(val) => updateState({ computerCharger: val })} />
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-bold py-2 text-gray-800">Inventario (Obligatorio)</h2>
                  <NumberInput label="Cantidad de impresoras" value={state.printer} onChange={(val) => updateState({ printer: val })} />
                  <NumberInput label="Cantidad de cables de impresoras" value={state.printerCables} onChange={(val) => updateState({ printerCables: val })} />
                  <NumberInput label="Cantidad de cargadores de impresoras" value={state.printerCharger} onChange={(val) => updateState({ printerCharger: val })} />
                  <NumberInput label="Cantidad de tijeras" value={state.scissors} onChange={(val) => updateState({ scissors: val })} />
                  <NumberInput label="Cantidad de marcadores" value={state.markers} onChange={(val) => updateState({ markers: val })} />
                  <NumberInput label="Cantidad de lapiceros" value={state.pencils} onChange={(val) => updateState({ pencils: val })} />
                  <NumberInput label="Cantidad de rollos de impresoras" value={state.printerRolls} onChange={(val) => updateState({ printerRolls: val })} />
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <RadioGroup label="¿Hay más de 3 paquetes de stickers provisionales?" value={state.stickerPacks} onChange={(val) => updateState({ stickerPacks: val })} />
                  <RadioGroup label="¿Hay más de 20 stickers de bienvenida (Niños)?" value={state.welcomeStickerBoy} onChange={(val) => updateState({ welcomeStickerBoy: val })} />
                  <RadioGroup label="¿Hay más de 20 stickers de stickers de bienvenida (Niñas)?" value={state.welcomeStickerGirl} onChange={(val) => updateState({ welcomeStickerGirl: val })} />
                  <RadioGroup label="¿Hay más de 10 stickers de cumpleaños (Niños)?" value={state.birthdayStickerBoy} onChange={(val) => updateState({ birthdayStickerBoy: val })} />
                  <RadioGroup label="¿Hay más de 10 stickers de cumpleaños (Niñas)?" value={state.birthdayStickerGirl} onChange={(val) => updateState({ birthdayStickerGirl: val })} />
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-bold py-2 text-gray-800">Observaciones generales (Obligatorio)</h2>
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                    Si tuvo algún inconveniente que desee comentar, queja o reclamo, por favor
                    manifestarlo. En caso contrario, manifestar que deja el área en perfectas
                    condiciones para el siguiente grupo.
                  </p>
                  <textarea 
                    className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-3 px-4 focus:border-primary focus:ring-0 transition-colors outline-none text-sm shadow-sm"
                    rows={4}
                    value={state.observationGeneral}
                    onChange={(e) => updateState({ observationGeneral: e.target.value })}
                    placeholder="Escriba aquí su observación"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  ></textarea>
                </div>

                <Button 
                  onClick={handleSave}
                  block
                  variant="primary"
                  className="mt-2"
                >
                  Generar informe para compartir
                </Button>
              </>
            )}
            <div className="pb-10" />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default ReportDrawer;
