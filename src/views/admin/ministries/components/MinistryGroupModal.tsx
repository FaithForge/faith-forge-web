import React, { useEffect, useState } from 'react';
import AppDrawer from '@/components/ui/AppDrawer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { IMinistryGroupConfig } from '@/libs/models';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import {
  CreateMinistryGroupConfig,
  UpdateMinistryGroupConfig,
} from '@/libs/state/redux/thunks/church/ministry.thunk';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { toast } from 'sonner';
import { Users2 } from 'lucide-react';

interface MinistryGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministryId: string;
  groupToEdit?: IMinistryGroupConfig | null;
  defaultPosition?: number;
  onSuccess?: () => void;
}

/**
 * Drawer modal to create or edit a Custom Group inside a Ministry.
 *
 * @param {MinistryGroupModalProps} props - Component properties.
 * @returns {JSX.Element} The rendered modal drawer.
 */
export const MinistryGroupModal: React.FC<MinistryGroupModalProps> = ({
  open,
  onOpenChange,
  ministryId,
  groupToEdit,
  defaultPosition = 1,
  onSuccess,
}) => {
  useModalBackClose(open, () => onOpenChange(false));

  const dispatch = useAppDispatch();
  const { loadingAction } = useAppSelector((state) => state.ministrySlice);

  const [name, setName] = useState('');
  const [position, setPosition] = useState<number>(defaultPosition);
  const [active, setActive] = useState(true);
  const [nameError, setNameError] = useState('');

  const isEditing = Boolean(groupToEdit);

  useEffect(() => {
    if (open) {
      if (groupToEdit) {
        setName(groupToEdit.name);
        setPosition(groupToEdit.position);
        setActive(groupToEdit.active);
      } else {
        setName('');
        setPosition(defaultPosition);
        setActive(true);
      }
      setNameError('');
    }
  }, [open, groupToEdit, defaultPosition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('El nombre del grupo es requerido');
      return;
    }

    try {
      if (isEditing && groupToEdit) {
        await dispatch(
          UpdateMinistryGroupConfig({
            id: groupToEdit.id,
            name: name.trim(),
            position: Number(position) || 1,
            active,
          }),
        ).unwrap();
        toast.success('Grupo actualizado correctamente');
      } else {
        await dispatch(
          CreateMinistryGroupConfig({
            ministryId,
            name: name.trim(),
            position: Number(position) || 1,
          }),
        ).unwrap();
        toast.success('Grupo creado con éxito');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const errMsg = typeof err === 'string' ? err : 'Error al guardar el grupo';
      toast.error(errMsg);
    }
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Grupo' : 'Nuevo Grupo'}
      icon={<Users2 className="text-primary" size={20} />}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Nombre del Grupo <span className="text-rose-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError('');
            }}
            placeholder="Ej. Grupo 1, Grupo 2, Turno Mañana, Noche..."
            error={nameError}
            autoFocus
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Posición / Orden de visualización
          </label>
          <Input
            type="number"
            min={1}
            value={position}
            onChange={(e) => setPosition(Number(e.target.value))}
            placeholder="1"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Los grupos se ordenarán numéricamente según este valor.
          </p>
        </div>

        {isEditing && (
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-gray-100 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-800">Estado del Grupo</p>
              <p className="text-xs text-gray-500">
                {active ? 'Activo para equipos y roles' : 'Inactivo temporalmente'}
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
            {isEditing ? 'Guardar Cambios' : 'Crear Grupo'}
          </Button>
        </div>
      </form>
    </AppDrawer>
  );
};

export default MinistryGroupModal;
