import React, { useState, useEffect, useMemo } from 'react';
import AppDrawer from '@/components/ui/AppDrawer';
import { Layers, X, ShieldCheck, Crown, Users, Award, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import {
  CreateVolunteer,
  CreateVolunteerAssignment,
} from '@/libs/state/redux/thunks/church/volunteer.thunk';
import {
  GetMinistries,
  GetMinistryAreas,
  GetMinistryGroupConfigs,
  GetServiceAreaGroups,
} from '@/libs/state/redux/thunks/church/ministry.thunk';
import { GetChurchCampuses } from '@/libs/state/redux/thunks/church/church.thunk';
import {
  IUser,
  IVolunteer,
  VolunteerRole,
  IMinistryArea,
  IMinistryGroupConfig,
  IServiceAreaGroup,
  ServiceAreaGroupStateEnum,
} from '@/libs/models';
import SelectSearch from '@/components/ui/SelectSearch';
import Button from '@/components/ui/Button';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import clsx from 'clsx';

interface AssignUserMinistryModalProps {
  open: boolean;
  onClose: () => void;
  user: Partial<IUser> | IUser | null | undefined;
  existingVolunteer?: IVolunteer | null;
  onSuccess?: () => void;
}

const ROLES: Array<{
  role: VolunteerRole;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    role: VolunteerRole.VOLUNTEER,
    label: 'Servidor',
    description: 'Sirve en una sede, área y horario específico.',
    icon: Award,
  },
  {
    role: VolunteerRole.SUPERVISOR,
    label: 'Supervisor de Equipo',
    description: 'Lidera la operación de un equipo en una sede.',
    icon: ShieldCheck,
  },
  {
    role: VolunteerRole.GROUP_COORDINATOR,
    label: 'Coordinador de Grupo',
    description: 'Coordina todas las áreas dentro de un turno.',
    icon: Users,
  },
  {
    role: VolunteerRole.AREA_GENERAL_COORDINATOR,
    label: 'Coordinador General de Área',
    description: 'Supervisa un área a través de todos los grupos y sedes.',
    icon: Layers,
  },
  {
    role: VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
    label: 'Coordinador General del Ministerio',
    description: 'Supervisa todas las áreas, grupos y sedes del ministerio.',
    icon: Crown,
  },
];

/**
 * Modal drawer to assign a user to a ministry, campus, area, group and volunteer role.
 * Automatically registers the user as a volunteer if not already registered.
 *
 * @param {AssignUserMinistryModalProps} props - Component properties.
 * @returns {JSX.Element} Rendered modal drawer.
 */
export const AssignUserMinistryModal: React.FC<AssignUserMinistryModalProps> = ({
  open,
  onClose,
  user,
  existingVolunteer,
  onSuccess,
}) => {
  useModalBackClose(open, onClose);
  const dispatch = useAppDispatch();
  const churchId = import.meta.env.VITE_CHURCH_ID;

  const { ministries, areasByMinistry, groupsByMinistry, serviceAreaGroups } =
    useAppSelector((state) => state.ministrySlice);
  const campuses = useAppSelector((state) => state.churchCampusSlice.data);

  const [selectedMinistryId, setSelectedMinistryId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<VolunteerRole>(VolunteerRole.VOLUNTEER);
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial catalog load
  useEffect(() => {
    if (open) {
      if (campuses.length === 0) {
        dispatch(GetChurchCampuses());
      }
      if (ministries.length === 0) {
        dispatch(GetMinistries({ churchId }));
      }
      setSelectedRole(VolunteerRole.VOLUNTEER);
      setIsSubmitting(false);
    }
  }, [open, campuses.length, ministries.length, churchId, dispatch]);

  // Auto-select initial campus when available
  useEffect(() => {
    if (open && campuses.length > 0 && !selectedCampusId) {
      setSelectedCampusId(campuses[0].id);
    }
  }, [open, campuses, selectedCampusId]);

  // Filter ministries by selected campus
  const filteredMinistries = useMemo(() => {
    if (!selectedCampusId) return ministries;
    return ministries.filter((m) => m.churchCampusId === selectedCampusId);
  }, [ministries, selectedCampusId]);

  // Auto-select initial or updated ministry when campus or ministries change
  useEffect(() => {
    if (filteredMinistries.length > 0) {
      const isCurrentInCampus = filteredMinistries.some((m) => m.id === selectedMinistryId);
      if (!isCurrentInCampus) {
        setSelectedMinistryId(filteredMinistries[0].id);
        setSelectedAreaId('');
        setSelectedGroupId('');
      }
    } else {
      setSelectedMinistryId('');
      setSelectedAreaId('');
      setSelectedGroupId('');
    }
  }, [filteredMinistries, selectedMinistryId]);

  // Load ministry dependencies when ministry changes
  useEffect(() => {
    if (selectedMinistryId) {
      dispatch(GetMinistryAreas({ ministryId: selectedMinistryId }));
      dispatch(GetMinistryGroupConfigs({ ministryId: selectedMinistryId }));
      dispatch(GetServiceAreaGroups({ ministryId: selectedMinistryId }));
    }
  }, [selectedMinistryId, dispatch]);

  const areas: IMinistryArea[] = useMemo(() => {
    return areasByMinistry[selectedMinistryId] || [];
  }, [areasByMinistry, selectedMinistryId]);

  const groups: IMinistryGroupConfig[] = useMemo(() => {
    return groupsByMinistry[selectedMinistryId] || [];
  }, [groupsByMinistry, selectedMinistryId]);

  const activeServiceAreaGroups: IServiceAreaGroup[] = useMemo(() => {
    return (serviceAreaGroups || []).filter(
      (t: IServiceAreaGroup) => t.state === ServiceAreaGroupStateEnum.ACTIVE,
    );
  }, [serviceAreaGroups]);

  // Auto-select initial area and group
  useEffect(() => {
    if (areas.length > 0 && !selectedAreaId) {
      setSelectedAreaId(areas[0].id);
    }
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [areas, groups, selectedAreaId, selectedGroupId]);

  const campusOptions = useMemo(
    () => campuses.map((c) => ({ id: c.id, name: c.name })),
    [campuses],
  );
  const ministryOptions = useMemo(
    () => filteredMinistries.map((m) => ({ id: m.id, name: m.name })),
    [filteredMinistries],
  );
  const areaOptions = useMemo(() => areas.map((a) => ({ id: a.id, name: a.name })), [areas]);
  const groupOptions = useMemo(() => groups.map((g) => ({ id: g.id, name: g.name })), [groups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error('No se ha especificado un usuario válido');
      return;
    }

    if (!selectedMinistryId) {
      toast.error('Por favor selecciona un ministerio');
      return;
    }

    let targetServiceAreaGroupId: string | undefined;
    let targetMinistryAreaId: string | undefined;
    let targetMinistryGroupConfigId: string | undefined;
    let targetMinistryId: string | undefined;

    if (
      selectedRole === VolunteerRole.VOLUNTEER ||
      selectedRole === VolunteerRole.SUPERVISOR
    ) {
      if (!selectedCampusId) {
        toast.error('Por favor selecciona una sede');
        return;
      }
      if (!selectedAreaId) {
        toast.error('Por favor selecciona un área');
        return;
      }
      if (!selectedGroupId) {
        toast.error('Por favor selecciona un grupo/horario');
        return;
      }

      // Find matching ServiceAreaGroup
      const matchingTeam = activeServiceAreaGroups.find(
        (t: IServiceAreaGroup) =>
          t.churchCampusId === selectedCampusId &&
          t.ministryAreaId === selectedAreaId &&
          t.ministryGroupConfigId === selectedGroupId,
      );

      if (matchingTeam) {
        targetServiceAreaGroupId = matchingTeam.id;
      } else {
        targetMinistryAreaId = selectedAreaId;
        targetMinistryGroupConfigId = selectedGroupId;
      }
    } else if (selectedRole === VolunteerRole.GROUP_COORDINATOR) {
      if (!selectedGroupId) {
        toast.error('Por favor selecciona un grupo');
        return;
      }
      targetMinistryGroupConfigId = selectedGroupId;
    } else if (selectedRole === VolunteerRole.AREA_GENERAL_COORDINATOR) {
      if (!selectedAreaId) {
        toast.error('Por favor selecciona un área');
        return;
      }
      targetMinistryAreaId = selectedAreaId;
    } else if (selectedRole === VolunteerRole.MINISTRY_GENERAL_COORDINATOR) {
      targetMinistryId = selectedMinistryId;
    }

    setIsSubmitting(true);
    try {
      let volunteerId = existingVolunteer?.id;

      // Register volunteer record if not exists
      if (!volunteerId) {
        try {
          const res = await dispatch(CreateVolunteer({ userId: user.id })).unwrap();
          volunteerId = res.id;
        } catch (err: any) {
          // If conflict, volunteer already exists, can proceed
          if (!volunteerId) {
            volunteerId = existingVolunteer?.id;
          }
        }
      }

      if (!volunteerId) {
        toast.error('No se pudo inicializar la ficha del servidor');
        return;
      }

      await dispatch(
        CreateVolunteerAssignment({
          volunteerId,
          role: selectedRole,
          serviceAreaGroupId: targetServiceAreaGroupId,
          ministryGroupConfigId: targetMinistryGroupConfigId,
          ministryAreaId: targetMinistryAreaId,
          ministryId: targetMinistryId || selectedMinistryId,
        }),
      ).unwrap();

      toast.success('¡Asignación de servicio guardada exitosamente!');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || err?.error || 'Error al guardar la asignación');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppDrawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <div className="flex flex-col h-full max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">
                Vincular a Ministerio
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Servidor:{' '}
                <span className="font-semibold text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Sede / Campus Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700">
              Sede / Campus <span className="text-rose-500">*</span>
            </label>
            <SelectSearch
              label="Sede / Campus"
              options={campusOptions}
              value={selectedCampusId}
              onChange={(newCampusId) => {
                setSelectedCampusId(newCampusId);
                const campusMins = ministries.filter((m) => m.churchCampusId === newCampusId);
                setSelectedMinistryId(campusMins[0]?.id || '');
                setSelectedAreaId('');
                setSelectedGroupId('');
              }}
              placeholder="Selecciona la sede física..."
            />
          </div>

          {/* Ministry Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700">
              Ministerio <span className="text-rose-500">*</span>
            </label>
            <SelectSearch
              label="Ministerio"
              options={ministryOptions}
              value={selectedMinistryId}
              onChange={setSelectedMinistryId}
              placeholder={
                filteredMinistries.length > 0
                  ? 'Selecciona el ministerio...'
                  : 'No hay ministerios registrados en esta sede'
              }
            />
            {filteredMinistries.length === 0 && selectedCampusId && (
              <p className="text-[11px] text-amber-600 font-medium">
                Esta sede aún no tiene ministerios registrados.
              </p>
            )}
          </div>

          {/* Role selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700">
              Rol de Servicio <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-col gap-1.5">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.role;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setSelectedRole(r.role)}
                    className={clsx(
                      'p-2.5 text-left rounded-xl border transition-all text-xs flex items-start gap-2.5 cursor-pointer',
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary font-bold shadow-2xs'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                    )}
                  >
                    <div
                      className={clsx(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                        isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500',
                      )}
                    >
                      <Icon size={14} />
                    </div>
                    <div>
                      <p className="font-bold">{r.label}</p>
                      <p className="text-[10px] text-gray-500 font-normal mt-0.5">
                        {r.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Area Selector (For Volunteer, Supervisor, or Area Coordinator) */}
          {(selectedRole === VolunteerRole.VOLUNTEER ||
            selectedRole === VolunteerRole.SUPERVISOR ||
            selectedRole === VolunteerRole.AREA_GENERAL_COORDINATOR) && (
            <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
              <label className="text-xs font-bold text-gray-700">
                Área de Servicio <span className="text-rose-500">*</span>
              </label>
              <SelectSearch
                label="Área de Servicio"
                options={areaOptions}
                value={selectedAreaId}
                onChange={setSelectedAreaId}
                placeholder={
                  areaOptions.length > 0
                    ? 'Selecciona el área de servicio...'
                    : 'No hay áreas configuradas en este ministerio'
                }
              />
            </div>
          )}

          {/* Group Selector (For Volunteer, Supervisor, or Group Coordinator) */}
          {(selectedRole === VolunteerRole.VOLUNTEER ||
            selectedRole === VolunteerRole.SUPERVISOR ||
            selectedRole === VolunteerRole.GROUP_COORDINATOR) && (
            <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
              <label className="text-xs font-bold text-gray-700">
                Grupo / Horario / Turno <span className="text-rose-500">*</span>
              </label>
              <SelectSearch
                label="Grupo / Horario / Turno"
                options={groupOptions}
                value={selectedGroupId}
                onChange={setSelectedGroupId}
                placeholder={
                  groupOptions.length > 0
                    ? 'Selecciona el grupo o turno...'
                    : 'No hay grupos configurados en este ministerio'
                }
              />
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center gap-3 mt-auto">
            <Button
              type="button"
              variant="default"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !selectedMinistryId}
              loading={isSubmitting}
              className="flex-1 py-2 text-xs font-bold shadow-xs"
            >
              Guardar Asignación
            </Button>
          </div>
        </form>
      </div>
    </AppDrawer>
  );
};

export default AssignUserMinistryModal;
