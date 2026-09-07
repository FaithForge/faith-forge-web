import React, { useEffect, useState } from 'react';
import AppDrawer from '@/components/ui/AppDrawer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SelectSearch from '@/components/ui/SelectSearch';
import { ChurchMeetingStateEnum, IChurchMeeting } from '@/libs/models';
import { Days } from '@/libs/common-types/constants';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import { CreateChurchMeeting, UpdateChurchMeeting } from '@/libs/state/redux/thunks/church/church.thunk';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { toast } from 'sonner';
import { CalendarClock, Clock, CalendarDays, CheckCircle2, EyeOff, XCircle } from 'lucide-react';
import clsx from 'clsx';

interface ChurchMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingToEdit?: IChurchMeeting | null;
  churchCampusId: string;
  onSuccess?: () => void;
}

const DAY_OPTIONS = [
  { id: Days.SUNDAY, name: 'Domingo' },
  { id: Days.SATURDAY, name: 'Sábado' },
  { id: Days.FRIDAY, name: 'Viernes' },
  { id: Days.THURSDAY, name: 'Jueves' },
  { id: Days.WEDNESDAY, name: 'Miércoles' },
  { id: Days.TUESDAY, name: 'Martes' },
  { id: Days.MONDAY, name: 'Lunes' },
];

/**
 * Normalizes any time input to HH:mm string for input elements.
 *
 * @param {any} val - Time string or Date.
 * @returns {string} HH:mm string.
 */
const toTimeString = (val: any): string => {
  if (!val) return '09:00';
  if (typeof val === 'string') {
    const parts = val.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
  }
  return '09:00';
};

/**
 * Converts HH:mm to HH:mm:00 required by BE regex.
 *
 * @param {string} timeStr - Time string in HH:mm.
 * @returns {string} Time string in HH:mm:00.
 */
const formatToBackendTime = (timeStr: string): string => {
  if (!timeStr) return '00:00:00';
  const parts = timeStr.split(':');
  const hh = parts[0].padStart(2, '0');
  const mm = (parts[1] || '00').padStart(2, '0');
  return `${hh}:${mm}:00`;
};

/**
 * Drawer modal to create or edit a Church Meeting (Service / Horario).
 *
 * @param {ChurchMeetingModalProps} props - Component properties.
 * @returns {JSX.Element} The rendered modal drawer.
 */
export const ChurchMeetingModal: React.FC<ChurchMeetingModalProps> = ({
  open,
  onOpenChange,
  meetingToEdit,
  churchCampusId,
  onSuccess,
}) => {
  useModalBackClose(open, () => onOpenChange(false));

  const dispatch = useAppDispatch();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [day, setDay] = useState<Days>(Days.SUNDAY);
  const [initialHour, setInitialHour] = useState('09:00');
  const [finalHour, setFinalHour] = useState('11:00');
  const [initialRegHour, setInitialRegHour] = useState('08:30');
  const [finalRegHour, setFinalRegHour] = useState('10:00');
  const [position, setPosition] = useState<number | ''>('');
  const [state, setState] = useState<ChurchMeetingStateEnum>(ChurchMeetingStateEnum.ACTIVE);
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(meetingToEdit);

  useEffect(() => {
    if (open) {
      if (meetingToEdit) {
        setName(meetingToEdit.name);
        setDescription(meetingToEdit.description || '');
        setDay(meetingToEdit.day || Days.SUNDAY);
        setInitialHour(toTimeString(meetingToEdit.initialHour));
        setFinalHour(toTimeString(meetingToEdit.finalHour));
        setInitialRegHour(toTimeString(meetingToEdit.initialRegistrationHour));
        setFinalRegHour(toTimeString(meetingToEdit.finalRegistrationHour));
        setPosition(meetingToEdit.position ?? '');
        setState(meetingToEdit.state || ChurchMeetingStateEnum.ACTIVE);
      } else {
        setName('');
        setDescription('');
        setDay(Days.SUNDAY);
        setInitialHour('09:00');
        setFinalHour('11:00');
        setInitialRegHour('08:30');
        setFinalRegHour('10:00');
        setPosition('');
        setState(ChurchMeetingStateEnum.ACTIVE);
      }
      setNameError('');
    }
  }, [open, meetingToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('El nombre del servicio es requerido');
      return;
    }

    if (!churchCampusId) {
      toast.error('Debe seleccionar una sede para asociar el servicio');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && meetingToEdit) {
        await dispatch(
          UpdateChurchMeeting({
            id: meetingToEdit.id,
            churchCampusId,
            name: name.trim(),
            description: description.trim() || undefined,
            day,
            initialHour: formatToBackendTime(initialHour),
            finalHour: formatToBackendTime(finalHour),
            initialRegistrationHour: formatToBackendTime(initialRegHour),
            finalRegistrationHour: formatToBackendTime(finalRegHour),
            position: position !== '' ? Number(position) : undefined,
            state,
          }),
        ).unwrap();
        toast.success('Servicio actualizado correctamente');
      } else {
        await dispatch(
          CreateChurchMeeting({
            churchCampusId,
            name: name.trim(),
            description: description.trim() || undefined,
            day,
            initialHour: formatToBackendTime(initialHour),
            finalHour: formatToBackendTime(finalHour),
            initialRegistrationHour: formatToBackendTime(initialRegHour),
            finalRegistrationHour: formatToBackendTime(finalRegHour),
            position: position !== '' ? Number(position) : undefined,
            state,
          }),
        ).unwrap();
        toast.success('Servicio creado exitosamente');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const errMsg =
        typeof err === 'string'
          ? err
          : err?.message || 'Error al procesar el servicio';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Horario y Servicio' : 'Nuevo Servicio'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2 pb-6 px-1">
        {/* Name Input */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Nombre del Servicio <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <CalendarClock size={17} />
            </div>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              placeholder="Ej: Servicio 1, Culto Familiar, Domingo 10am..."
              className="pl-10 placeholder:text-gray-400"
              disabled={loading}
              autoFocus
            />
          </div>
          {nameError && (
            <p className="text-xs text-rose-600 mt-1.5 font-medium">{nameError}</p>
          )}
        </div>

        {/* Day Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Día de la Semana <span className="text-rose-500">*</span>
          </label>
          <SelectSearch
            label="Día"
            placeholder="Selecciona el día..."
            options={DAY_OPTIONS}
            value={day}
            onChange={(val) => setDay(val as Days)}
            disabled={loading}
          />
        </div>

        {/* Service Hours Row */}
        <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-gray-100 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
            <Clock size={14} className="text-primary" />
            <span>Horario del Culto / Reunión</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Hora de Inicio
              </label>
              <Input
                type="time"
                value={initialHour}
                onChange={(e) => setInitialHour(e.target.value)}
                className="bg-white placeholder:text-gray-400"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Hora de Fin
              </label>
              <Input
                type="time"
                value={finalHour}
                onChange={(e) => setFinalHour(e.target.value)}
                className="bg-white placeholder:text-gray-400"
                disabled={loading}
                required
              />
            </div>
          </div>
        </div>

        {/* Registration Hours Row */}
        <div className="bg-blue-50/50 rounded-2xl p-3.5 border border-blue-100 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
            <CalendarDays size={14} className="text-blue-600" />
            <span>Apertura y Cierre de Registro de Niños</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Apertura Registro
              </label>
              <Input
                type="time"
                value={initialRegHour}
                onChange={(e) => setInitialRegHour(e.target.value)}
                className="bg-white placeholder:text-gray-400"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Cierre Registro
              </label>
              <Input
                type="time"
                value={finalRegHour}
                onChange={(e) => setFinalRegHour(e.target.value)}
                className="bg-white placeholder:text-gray-400"
                disabled={loading}
                required
              />
            </div>
          </div>
        </div>

        {/* Position & Description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Orden de Visualización
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
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Estado Inicial
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value as ChurchMeetingStateEnum)}
              className="w-full text-sm rounded-xl border border-gray-200 p-2.5 bg-white text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
              disabled={loading}
            >
              <option value={ChurchMeetingStateEnum.ACTIVE}>Activo</option>
              <option value={ChurchMeetingStateEnum.ACTIVE_WITHOUT_DISPLAY}>No visible</option>
              <option value={ChurchMeetingStateEnum.DISABLE}>Inactivo</option>
            </select>
          </div>
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
            {isEditing ? 'Guardar Cambios' : 'Crear Servicio'}
          </Button>
        </div>
      </form>
    </AppDrawer>
  );
};

export default ChurchMeetingModal;
