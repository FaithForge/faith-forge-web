import React, { useEffect, useState } from 'react';
import AppDrawer from '@/components/ui/AppDrawer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { ChurchCampusStateEnum, IChurchCampus, KidAttendanceFlowModeEnum } from '@/libs/models';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import { CreateChurchCampus, UpdateChurchCampus } from '@/libs/state/redux/thunks/church/church.thunk';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { toast } from 'sonner';
import { MapPin, CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';

interface CampusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campusToEdit?: IChurchCampus | null;
  onSuccess?: () => void;
}

/**
 * Drawer modal to create or edit a Church Campus.
 *
 * @param {CampusModalProps} props - Component properties.
 * @returns {JSX.Element} The rendered modal drawer.
 */
export const CampusModal: React.FC<CampusModalProps> = ({
  open,
  onOpenChange,
  campusToEdit,
  onSuccess,
}) => {
  useModalBackClose(open, () => onOpenChange(false));

  const dispatch = useAppDispatch();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState<number | ''>('');
  const [state, setState] = useState<ChurchCampusStateEnum>(ChurchCampusStateEnum.ACTIVE);
  const [kidAttendanceFlowMode, setKidAttendanceFlowMode] = useState<KidAttendanceFlowModeEnum>(
    KidAttendanceFlowModeEnum.ONLY_CHECK_IN,
  );
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(campusToEdit);

  useEffect(() => {
    if (open) {
      if (campusToEdit) {
        setName(campusToEdit.name);
        setDescription(campusToEdit.description || '');
        setPosition(campusToEdit.position ?? '');
        setState(campusToEdit.state ?? ChurchCampusStateEnum.ACTIVE);
        setKidAttendanceFlowMode(
          campusToEdit.kidAttendanceFlowMode ?? KidAttendanceFlowModeEnum.ONLY_CHECK_IN,
        );
      } else {
        setName('');
        setDescription('');
        setPosition('');
        setState(ChurchCampusStateEnum.ACTIVE);
        setKidAttendanceFlowMode(KidAttendanceFlowModeEnum.ONLY_CHECK_IN);
      }
      setNameError('');
    }
  }, [open, campusToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('El nombre de la sede es requerido');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && campusToEdit) {
        await dispatch(
          UpdateChurchCampus({
            id: campusToEdit.id,
            name: name.trim(),
            description: description.trim() || undefined,
            position: position !== '' ? Number(position) : undefined,
            state,
            kidAttendanceFlowMode,
          }),
        ).unwrap();
        toast.success('Sede actualizada correctamente');
      } else {
        await dispatch(
          CreateChurchCampus({
            name: name.trim(),
            description: description.trim() || undefined,
            position: position !== '' ? Number(position) : undefined,
            state,
            kidAttendanceFlowMode,
          }),
        ).unwrap();
        toast.success('Sede creada exitosamente');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const errMsg =
        typeof err === 'string'
          ? err
          : err?.message || 'Error al procesar la operación en la sede';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Sede' : 'Nueva Sede'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-2 pb-6 px-1">
        {/* Name Input */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Nombre de la Sede <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <MapPin size={17} />
            </div>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              placeholder="Ej: Sede Central, Campus Norte..."
              className="pl-10 placeholder:text-gray-400"
              disabled={loading}
              autoFocus
            />
          </div>
          {nameError && (
            <p className="text-xs text-rose-600 mt-1.5 font-medium">{nameError}</p>
          )}
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Descripción o Dirección <span className="text-gray-400 text-[10px] font-normal">(Opcional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dirección, referencias de acceso o notas sobre la sede..."
            rows={3}
            disabled={loading}
            className="w-full text-sm rounded-xl border border-gray-200 p-3 text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
          />
        </div>

        {/* Position Input */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Orden de Visualización <span className="text-gray-400 text-[10px] font-normal">(Opcional)</span>
          </label>
          <Input
            type="number"
            min={1}
            value={position}
            onChange={(e) => setPosition(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="1, 2, 3..."
            className="placeholder:text-gray-400"
            disabled={loading}
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Determina la posición en que aparecerá la sede en los selectores de la aplicación.
          </p>
        </div>

        {/* Kid Attendance Flow Mode */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Flujo de Asistencia (Escuela de Niños)
          </label>
          <Select
            value={kidAttendanceFlowMode}
            onChange={(e) => setKidAttendanceFlowMode(e.target.value as KidAttendanceFlowModeEnum)}
            disabled={loading}
          >
            <option value={KidAttendanceFlowModeEnum.ONLY_CHECK_IN}>
              Solo Check-In (Registro básico)
            </option>
            <option value={KidAttendanceFlowModeEnum.CHECK_IN_AND_ENTRY}>
              Check-In + Confirmación de Ingreso
            </option>
            <option value={KidAttendanceFlowModeEnum.DIRECT_ENTRY_AND_CHECK_OUT}>
              Ingreso Directo + Salida / Check-Out
            </option>
            <option value={KidAttendanceFlowModeEnum.FULL_FLOW}>
              Flujo Completo (Check-In + Ingreso + Salida)
            </option>
          </Select>
          <p className="text-[11px] text-gray-400 mt-1">
            Define las etapas operativas de registro, acceso a salones y entrega de niños para esta sede.
          </p>
        </div>

        {/* State Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-slate-50/80">
          <div>
            <span className="text-sm font-semibold text-gray-800 block">
              Estado de la Sede
            </span>
            <span className="text-xs text-gray-500">
              {state === ChurchCampusStateEnum.ACTIVE
                ? 'Sede activa y disponible en la plataforma'
                : 'Sede inactiva (oculta en el flujo operativo)'}
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              setState((prev) =>
                prev === ChurchCampusStateEnum.ACTIVE
                  ? ChurchCampusStateEnum.INACTIVE
                  : ChurchCampusStateEnum.ACTIVE,
              )
            }
            disabled={loading}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
              state === ChurchCampusStateEnum.ACTIVE
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-rose-100 text-rose-700 border border-rose-200',
            )}
          >
            {state === ChurchCampusStateEnum.ACTIVE ? (
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
            {isEditing ? 'Guardar Cambios' : 'Crear Sede'}
          </Button>
        </div>
      </form>
    </AppDrawer>
  );
};

export default CampusModal;
