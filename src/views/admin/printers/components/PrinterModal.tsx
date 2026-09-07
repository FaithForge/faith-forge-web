import React, { useEffect, useState } from 'react';
import AppDrawer from '@/components/ui/AppDrawer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SelectSearch from '@/components/ui/SelectSearch';
import { ChurchPrinterStateEnum, IChurchPrinter } from '@/libs/models';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { CreateChurchPrinter, UpdateChurchPrinter } from '@/libs/state/redux/thunks/church/church.thunk';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { toast } from 'sonner';
import { Printer, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';

interface PrinterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  printerToEdit?: IChurchPrinter | null;
  churchCampusId?: string;
  onSuccess?: () => void;
}

/**
 * Drawer modal to create or edit a Church Thermal Printer.
 *
 * @param {PrinterModalProps} props - Component properties.
 * @returns {JSX.Element} The rendered modal drawer.
 */
export const PrinterModal: React.FC<PrinterModalProps> = ({
  open,
  onOpenChange,
  printerToEdit,
  churchCampusId,
  onSuccess,
}) => {
  useModalBackClose(open, () => onOpenChange(false));

  const dispatch = useAppDispatch();
  const campuses = useAppSelector((state) => state.churchCampusSlice.data);

  const [name, setName] = useState('');
  const [selectedCampusId, setSelectedCampusId] = useState('');
  const [state, setState] = useState<ChurchPrinterStateEnum>(ChurchPrinterStateEnum.ACTIVE);
  const [nameError, setNameError] = useState('');
  const [campusError, setCampusError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(printerToEdit);

  useEffect(() => {
    if (open) {
      if (printerToEdit) {
        setName(printerToEdit.name);
        setSelectedCampusId(printerToEdit.churchCampusId || churchCampusId || '');
        setState(printerToEdit.state ?? ChurchPrinterStateEnum.ACTIVE);
      } else {
        setName('');
        setSelectedCampusId(churchCampusId || (campuses.length > 0 ? campuses[0].id : ''));
        setState(ChurchPrinterStateEnum.ACTIVE);
      }
      setNameError('');
      setCampusError('');
    }
  }, [open, printerToEdit, churchCampusId, campuses]);

  const campusOptions = campuses.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!name.trim()) {
      setNameError('El nombre de la impresora es requerido');
      hasError = true;
    }
    if (!selectedCampusId) {
      setCampusError('Debes seleccionar una sede');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      if (isEditing && printerToEdit) {
        await dispatch(
          UpdateChurchPrinter({
            id: printerToEdit.id,
            name: name.trim(),
            churchCampusId: selectedCampusId,
            state,
          }),
        ).unwrap();
        toast.success('Impresora actualizada correctamente');
      } else {
        await dispatch(
          CreateChurchPrinter({
            name: name.trim(),
            churchCampusId: selectedCampusId,
            state,
          }),
        ).unwrap();
        toast.success('Impresora registrada exitosamente');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const errMsg =
        typeof err === 'string'
          ? err
          : err?.message || 'Error al procesar la impresora';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Impresora' : 'Registrar Impresora'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-2 pb-6 px-1">
        {/* Campus Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Sede Asignada <span className="text-rose-500">*</span>
          </label>
          <SelectSearch
            label="Sede"
            placeholder="Selecciona una sede..."
            options={campusOptions}
            value={selectedCampusId}
            onChange={(val) => {
              setSelectedCampusId(val);
              if (campusError) setCampusError('');
            }}
            disabled={loading}
          />
          {campusError && (
            <p className="text-xs text-rose-600 mt-1.5 font-medium">{campusError}</p>
          )}
        </div>

        {/* Name Input */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Nombre de la Impresora <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Printer size={17} />
            </div>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              placeholder="Ej: MPT-II, Impresora Entrada 1, RPP02N..."
              className="pl-10 placeholder:text-gray-400"
              disabled={loading}
              autoFocus
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Usa el nombre Bluetooth del dispositivo o un identificador claro para los voluntarios.
          </p>
          {nameError && (
            <p className="text-xs text-rose-600 mt-1.5 font-medium">{nameError}</p>
          )}
        </div>

        {/* State Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-slate-50/80">
          <div>
            <span className="text-sm font-semibold text-gray-800 block">
              Estado de la Impresora
            </span>
            <span className="text-xs text-gray-500">
              {state === ChurchPrinterStateEnum.ACTIVE
                ? 'Impresora activa y visible para emparejar'
                : 'Impresora deshabilitada (no disponible en check-in)'}
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              setState((prev) =>
                prev === ChurchPrinterStateEnum.ACTIVE
                  ? ChurchPrinterStateEnum.INACTIVE
                  : ChurchPrinterStateEnum.ACTIVE,
              )
            }
            disabled={loading}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
              state === ChurchPrinterStateEnum.ACTIVE
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-rose-100 text-rose-700 border border-rose-200',
            )}
          >
            {state === ChurchPrinterStateEnum.ACTIVE ? (
              <>
                <CheckCircle2 size={14} />
                <span>Activa</span>
              </>
            ) : (
              <>
                <XCircle size={14} />
                <span>Inactiva</span>
              </>
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="flex-1"
          >
            {isEditing ? 'Guardar Cambios' : 'Registrar'}
          </Button>
        </div>
      </form>
    </AppDrawer>
  );
};

export default PrinterModal;
