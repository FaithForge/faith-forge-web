import React, { useEffect, useState } from 'react';
import AppDrawer from '@/components/ui/AppDrawer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { IMinistry } from '@/libs/models';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { CreateMinistry, UpdateMinistry } from '@/libs/state/redux/thunks/church/ministry.thunk';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { toast } from 'sonner';
import { Layers, Loader2, MapPin, Sparkles } from 'lucide-react';

interface MinistryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministryToEdit?: IMinistry | null;
  churchCampusId?: string;
  onSuccess?: () => void;
}

/**
 * Drawer modal to create or edit a Ministry.
 *
 * @param {MinistryModalProps} props - Component properties.
 * @returns {JSX.Element} The rendered modal drawer.
 */
export const MinistryModal: React.FC<MinistryModalProps> = ({
  open,
  onOpenChange,
  ministryToEdit,
  churchCampusId,
  onSuccess,
}) => {
  useModalBackClose(open, () => onOpenChange(false));

  const dispatch = useAppDispatch();
  const { loadingAction } = useAppSelector((state) => state.ministrySlice);
  const campuses = useAppSelector((state) => state.churchCampusSlice.data);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [nameError, setNameError] = useState('');

  const isEditing = Boolean(ministryToEdit);
  const activeCampusId = churchCampusId || ministryToEdit?.churchCampusId;
  const activeCampus = campuses.find((c) => c.id === activeCampusId);

  useEffect(() => {
    if (open) {
      if (ministryToEdit) {
        setName(ministryToEdit.name);
        setDescription(ministryToEdit.description || '');
        setActive(ministryToEdit.active);
      } else {
        setName('');
        setDescription('');
        setActive(true);
      }
      setNameError('');
    }
  }, [open, ministryToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('El nombre del ministerio es requerido');
      return;
    }

    try {
      if (isEditing && ministryToEdit) {
        await dispatch(
          UpdateMinistry({
            id: ministryToEdit.id,
            name: name.trim(),
            description: description.trim() || undefined,
            active,
          }),
        ).unwrap();
        toast.success('Ministerio actualizado correctamente');
      } else {
        if (!activeCampusId) {
          toast.error('Debe seleccionar una sede para asociar el ministerio');
          return;
        }
        await dispatch(
          CreateMinistry({
            churchCampusId: activeCampusId,
            churchId: import.meta.env.VITE_CHURCH_ID,
            name: name.trim(),
            description: description.trim() || undefined,
          }),
        ).unwrap();
        toast.success('Ministerio creado exitosamente');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const errMsg = typeof err === 'string' ? err : 'Error al guardar el ministerio';
      toast.error(errMsg);
    }
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Ministerio' : 'Nuevo Ministerio'}
      icon={<Layers className="text-primary" size={20} />}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        {activeCampus && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50/70 border border-indigo-100/80 rounded-xl text-xs text-indigo-900 font-medium">
            <MapPin size={13} className="text-indigo-600 shrink-0" />
            <span>
              Sede asociada: <strong className="font-bold text-indigo-950">{activeCampus.name}</strong>
            </span>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Nombre del Ministerio <span className="text-rose-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError('');
            }}
            placeholder="Ej. Iglekids, Consolidación, Alabanza..."
            error={nameError}
            autoFocus
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Descripción (opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripción del propósito de este ministerio..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
          />
        </div>

        {isEditing && (
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-gray-100 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-800">Estado del Ministerio</p>
              <p className="text-xs text-gray-500">
                {active ? 'Activo y disponible para asignaciones' : 'Inactivo temporalmente'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        )}

        <div className="pt-2 flex gap-3">
          <Button
            type="button"
            variant="default"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={loadingAction}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            loading={loadingAction}
            loadingText="Guardando..."
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Ministerio'}
          </Button>
        </div>
      </form>
    </AppDrawer>
  );
};

export default MinistryModal;
