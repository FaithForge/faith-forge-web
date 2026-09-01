import React, { useEffect, useState } from 'react';
import AppDrawer from '@/components/ui/AppDrawer';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { IChurchCampus, IMinistryArea, IMinistryGroupConfig } from '@/libs/models';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { CreateServiceAreaGroup } from '@/libs/state/redux/thunks/church/ministry.thunk';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { toast } from 'sonner';
import { Network } from 'lucide-react';

interface ServiceAreaGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  areas: IMinistryArea[];
  groups: IMinistryGroupConfig[];
  campuses: IChurchCampus[];
  selectedCampusId: string;
  defaultAreaId?: string;
  onSuccess?: () => void;
}

/**
 * Drawer modal to create an Area × Group × Campus team combination.
 *
 * @param {ServiceAreaGroupModalProps} props - Component properties.
 * @returns {JSX.Element} Rendered drawer modal.
 */
export const ServiceAreaGroupModal: React.FC<ServiceAreaGroupModalProps> = ({
  open,
  onOpenChange,
  areas,
  groups,
  campuses,
  selectedCampusId,
  defaultAreaId,
  onSuccess,
}) => {
  useModalBackClose(open, () => onOpenChange(false));

  const dispatch = useAppDispatch();
  const { loadingAction } = useAppSelector((state) => state.ministrySlice);

  const [ministryAreaId, setMinistryAreaId] = useState('');
  const [ministryGroupConfigId, setMinistryGroupConfigId] = useState('');
  const [churchCampusId, setChurchCampusId] = useState(selectedCampusId);

  useEffect(() => {
    if (open) {
      setChurchCampusId(selectedCampusId || (campuses[0]?.id ?? ''));
      const activeAreas = areas.filter((a) => a.active);
      const activeGroups = groups.filter((g) => g.active);
      setMinistryAreaId(defaultAreaId || activeAreas[0]?.id || '');
      setMinistryGroupConfigId(activeGroups[0]?.id || '');
    }
  }, [open, selectedCampusId, campuses, areas, groups, defaultAreaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ministryAreaId) {
      toast.error('Por favor selecciona un área de servicio');
      return;
    }
    if (!ministryGroupConfigId) {
      toast.error('Por favor selecciona un grupo');
      return;
    }
    if (!churchCampusId) {
      toast.error('Por favor selecciona una sede');
      return;
    }

    try {
      await dispatch(
        CreateServiceAreaGroup({
          ministryAreaId,
          ministryGroupConfigId,
          churchCampusId,
        }),
      ).unwrap();
      toast.success('Equipo de servicio creado exitosamente');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const errorMsg =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : typeof err === 'string'
            ? err
            : 'Error al crear el equipo de servicio';
      toast.error(errorMsg);
    }
  };

  const areaOptions = areas.map((a) => ({
    value: a.id,
    label: `${a.name} ${!a.active ? '(Inactiva)' : ''}`,
  }));

  const groupOptions = groups.map((g) => ({
    value: g.id,
    label: `${g.name} ${!g.active ? '(Inactivo)' : ''}`,
  }));

  const campusOptions = campuses.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Nuevo Equipo de Servicio"
      icon={<Network className="text-primary" size={20} />}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Sede (Campus) <span className="text-rose-500">*</span>
          </label>
          <Select
            value={churchCampusId}
            onChange={(e) => setChurchCampusId(e.target.value)}
          >
            {campusOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Área de Servicio <span className="text-rose-500">*</span>
          </label>
          <Select
            value={ministryAreaId}
            onChange={(e) => setMinistryAreaId(e.target.value)}
          >
            {areaOptions.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Grupo <span className="text-rose-500">*</span>
          </label>
          <Select
            value={ministryGroupConfigId}
            onChange={(e) => setMinistryGroupConfigId(e.target.value)}
          >
            {groupOptions.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </Select>
        </div>

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
            loadingText="Creando..."
          >
            Crear Equipo
          </Button>
        </div>
      </form>
    </AppDrawer>
  );
};

export default ServiceAreaGroupModal;
