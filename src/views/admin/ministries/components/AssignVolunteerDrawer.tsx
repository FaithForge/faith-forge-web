import React, { useEffect, useState, useRef } from 'react';
import AppDrawer from '@/components/ui/AppDrawer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import {
  IChurchCampus,
  IMinistryArea,
  IMinistryGroupConfig,
  IServiceAreaGroup,
  IUser,
  IVolunteer,
  IVolunteerAssignment,
  VolunteerRole,
} from '@/libs/models';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetUsers } from '@/libs/state/redux/thunks/user/user.thunk';
import {
  CreateVolunteer,
  CreateVolunteerAssignment,
  GetVolunteers,
  GetVolunteerAssignments,
} from '@/libs/state/redux/thunks/church/volunteer.thunk';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { toast } from 'sonner';
import {
  ShieldCheck,
  UserCheck,
  Search,
  Check,
  User as UserIcon,
  Crown,
  Layers,
  Users,
  Award,
} from 'lucide-react';
import clsx from 'clsx';

interface AssignVolunteerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministryId: string;
  areas: IMinistryArea[];
  groups: IMinistryGroupConfig[];
  campuses: IChurchCampus[];
  serviceAreaGroups: IServiceAreaGroup[];
  existingAssignments?: IVolunteerAssignment[];
  onSuccess?: () => void;
}

const ROLE_DEFINITIONS: Array<{
  role: VolunteerRole;
  label: string;
  description: string;
  badgeClass: string;
  icon: React.ElementType;
}> = [
  {
    role: VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
    label: 'Coordinador General del Ministerio',
    description: 'Supervisa todas las áreas, grupos y sedes del ministerio.',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: Crown,
  },
  {
    role: VolunteerRole.AREA_GENERAL_COORDINATOR,
    label: 'Coordinador General de Área',
    description: 'Coordina una área específica a través de todos los grupos y sedes.',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Layers,
  },
  {
    role: VolunteerRole.GROUP_COORDINATOR,
    label: 'Coordinador de Grupo',
    description: 'Coordina todas las áreas dentro de un mismo grupo o turno.',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: Users,
  },
  {
    role: VolunteerRole.SUPERVISOR,
    label: 'Supervisor de Equipo',
    description: 'Lidera la operación de un equipo específico en una sede (Área × Grupo).',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: ShieldCheck,
  },
  {
    role: VolunteerRole.VOLUNTEER,
    label: 'Servidor / Maestro',
    description: 'Miembro voluntario activo sirviendo en el equipo (Área × Grupo).',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: Award,
  },
];

/**
 * Smart assignment drawer allowing administrators to assign users to any level
 * of the 5-tier role hierarchy with scope validation and auto-volunteer creation.
 *
 * @param {AssignVolunteerDrawerProps} props - Component properties.
 * @returns {JSX.Element} The rendered drawer component.
 */
export const AssignVolunteerDrawer: React.FC<AssignVolunteerDrawerProps> = ({
  open,
  onOpenChange,
  ministryId,
  areas,
  groups,
  campuses,
  serviceAreaGroups,
  existingAssignments = [],
  onSuccess,
}) => {
  useModalBackClose(open, () => onOpenChange(false));

  const dispatch = useAppDispatch();
  const volunteersState = useAppSelector((state) => state.volunteerSlice.volunteers);

  // Step 1: User selection
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<IUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Step 2: Role selection
  const [selectedRole, setSelectedRole] = useState<VolunteerRole>(VolunteerRole.VOLUNTEER);

  // Step 3: Scope selection
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedCampusId, setSelectedCampusId] = useState('');
  const [selectedServiceAreaGroupId, setSelectedServiceAreaGroupId] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setSearchText('');
      setSearchResults([]);
      setSelectedUser(null);
      setSelectedRole(VolunteerRole.VOLUNTEER);

      const activeAreas = areas.filter((a) => a.active);
      const activeGroups = groups.filter((g) => g.active);
      setSelectedAreaId(activeAreas[0]?.id || '');
      setSelectedGroupId(activeGroups[0]?.id || '');
      setSelectedCampusId(campuses[0]?.id || '');
    }
  }, [open, areas, groups, campuses]);

  // Debounced user search
  useEffect(() => {
    if (!searchText.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await dispatch(GetUsers({ findText: searchText.trim() })).unwrap();
        const usersList: IUser[] = res?.data || [];
        setSearchResults(usersList);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText, dispatch]);

  // Filter service area groups based on selected campus
  const availableTeams = serviceAreaGroups.filter((sag) => {
    return sag.churchCampusId === selectedCampusId && sag.active;
  });

  // Set default team when campus changes
  useEffect(() => {
    if (availableTeams.length > 0) {
      setSelectedServiceAreaGroupId(availableTeams[0].id);
    } else {
      setSelectedServiceAreaGroupId('');
    }
  }, [selectedCampusId, serviceAreaGroups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      toast.error('Por favor busca y selecciona un usuario');
      return;
    }

    // Determine scope arguments
    let targetServiceAreaGroupId: string | undefined;
    let targetMinistryGroupConfigId: string | undefined;
    let targetMinistryAreaId: string | undefined;
    let targetMinistryId: string | undefined = ministryId;

    if (
      selectedRole === VolunteerRole.VOLUNTEER ||
      selectedRole === VolunteerRole.SUPERVISOR
    ) {
      if (!selectedServiceAreaGroupId) {
        toast.error('Debes seleccionar un equipo de servicio');
        return;
      }
      targetServiceAreaGroupId = selectedServiceAreaGroupId;
      targetMinistryAreaId = undefined;
      targetMinistryGroupConfigId = undefined;
      targetMinistryId = undefined;

      // Check single role constraint per ServiceAreaGroup
      const conflict = existingAssignments.find((a) => {
        const isSameVolunteer =
          a.volunteer?.userId === selectedUser.id ||
          a.volunteerId === selectedUser.id;
        const isSameSAG = a.serviceAreaGroupId === targetServiceAreaGroupId;
        return isSameVolunteer && isSameSAG && a.active;
      });

      if (conflict) {
        toast.error(
          `Este usuario ya tiene el rol de ${conflict.role} en este equipo de servicio`,
        );
        return;
      }
    } else if (selectedRole === VolunteerRole.GROUP_COORDINATOR) {
      if (!selectedGroupId) {
        toast.error('Debes seleccionar un grupo');
        return;
      }
      targetMinistryGroupConfigId = selectedGroupId;
    } else if (selectedRole === VolunteerRole.AREA_GENERAL_COORDINATOR) {
      if (!selectedAreaId) {
        toast.error('Debes seleccionar un área');
        return;
      }
      targetMinistryAreaId = selectedAreaId;
    } else if (selectedRole === VolunteerRole.MINISTRY_GENERAL_COORDINATOR) {
      targetMinistryId = ministryId;
    }

    setSubmitting(true);
    try {
      // Step 1: Find the volunteer record by userId in the local state
      let volunteer: IVolunteer | undefined = volunteersState.find(
        (v) => v.userId === selectedUser.id,
      );

      if (!volunteer) {
        try {
          // Attempt to auto-register as a new volunteer
          volunteer = await dispatch(CreateVolunteer({ userId: selectedUser.id })).unwrap();
        } catch (createErr: unknown) {
          // 409 Conflict means the volunteer already exists in another ministry.
          // Fetch the full list (force) and look up the existing record.
          const isConflict =
            typeof createErr === 'object' &&
            createErr !== null &&
            (
              (createErr as { statusCode?: number }).statusCode === 409 ||
              (createErr as { message?: string }).message
                ?.toLowerCase()
                .includes('already exists')
            );

          if (isConflict) {
            const freshList = await dispatch(GetVolunteers({ force: true })).unwrap();
            volunteer = (freshList as IVolunteer[]).find((v) => v.userId === selectedUser.id);
          }

          if (!volunteer) {
            throw createErr;
          }
        }
      }

      await dispatch(
        CreateVolunteerAssignment({
          volunteerId: volunteer.id,
          role: selectedRole,
          serviceAreaGroupId: targetServiceAreaGroupId,
          ministryGroupConfigId: targetMinistryGroupConfigId,
          ministryAreaId: targetMinistryAreaId,
          ministryId: targetMinistryId,
        }),
      ).unwrap();

      // Refresh assignments
      await dispatch(GetVolunteerAssignments({ ministryId, force: true }));
      toast.success('Servidor asignado exitosamente');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const errMsg =
        typeof err === 'string' ? err : 'Error al guardar la asignación del servidor';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const isTeamScope =
    selectedRole === VolunteerRole.VOLUNTEER ||
    selectedRole === VolunteerRole.SUPERVISOR;

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Asignar Servidor / Rol"
      icon={<ShieldCheck className="text-primary" size={20} />}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-4">
        {/* Step 1: User Search & Selection */}
        <div>
          <label className="text-xs font-bold text-gray-800 uppercase tracking-wide block mb-1.5">
            1. Seleccionar Usuario <span className="text-rose-500">*</span>
          </label>

          {selectedUser ? (
            <div className="bg-slate-50 border border-primary/40 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                  {selectedUser.photoUrl ? (
                    <img
                      src={selectedUser.photoUrl}
                      alt={selectedUser.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon size={20} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Doc: {selectedUser.nationalId || 'S/N'} • Tel: {selectedUser.phone || 'S/T'}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUser(null)}
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Cambiar
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Buscar por nombre o número de cédula..."
                icon="search"
                onClear={() => setSearchText('')}
                autoFocus
              />

              {searching && (
                <p className="text-xs text-gray-400 px-1">Buscando usuarios en la base de datos...</p>
              )}

              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-white divide-y divide-gray-100 shadow-sm">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        setSearchText('');
                        setSearchResults([]);
                      }}
                      className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-gray-600 flex items-center justify-center shrink-0">
                          {user.photoUrl ? (
                            <img
                              src={user.photoUrl}
                              alt={user.firstName}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <UserIcon size={14} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">
                            Doc: {user.nationalId || 'S/N'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded-md">
                        Seleccionar
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Role Selection */}
        <div>
          <label className="text-xs font-bold text-gray-800 uppercase tracking-wide block mb-1.5">
            2. Seleccionar Rol Jerárquico <span className="text-rose-500">*</span>
          </label>
          <div className="flex flex-col gap-2">
            {ROLE_DEFINITIONS.map((item) => {
              const isSelected = selectedRole === item.role;
              const Icon = item.icon;
              return (
                <div
                  key={item.role}
                  onClick={() => setSelectedRole(item.role)}
                  className={clsx(
                    'p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-xs'
                      : 'border-gray-200 bg-white hover:border-gray-300',
                  )}
                >
                  <div
                    className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                      isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-gray-600',
                    )}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-900">{item.label}</p>
                      {isSelected && <Check size={16} className="text-primary shrink-0" />}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Dynamic Scope Selection */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200/80 flex flex-col gap-3">
          <label className="text-xs font-bold text-gray-800 uppercase tracking-wide block">
            3. Alcance de la Asignación
          </label>

          {selectedRole === VolunteerRole.MINISTRY_GENERAL_COORDINATOR && (
            <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-700">
              <span className="font-bold">Alcance global:</span> El servidor coordinará todas las
              áreas, grupos y sedes de este ministerio.
            </div>
          )}

          {selectedRole === VolunteerRole.AREA_GENERAL_COORDINATOR && (
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Área de Servicio a Coordinar <span className="text-rose-500">*</span>
              </label>
              <Select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {selectedRole === VolunteerRole.GROUP_COORDINATOR && (
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Grupo a Coordinar <span className="text-rose-500">*</span>
              </label>
              <Select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} (Posición {g.position})
                  </option>
                ))}
              </Select>
            </div>
          )}

          {isTeamScope && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Sede (Campus) <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={selectedCampusId}
                  onChange={(e) => setSelectedCampusId(e.target.value)}
                >
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Equipo (Área × Grupo) <span className="text-rose-500">*</span>
                </label>
                {availableTeams.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    No hay combinaciones de equipos creadas en esta sede. Créalas primero en la pestaña "Equipos por Sede".
                  </p>
                ) : (
                  <Select
                    value={selectedServiceAreaGroupId}
                    onChange={(e) => setSelectedServiceAreaGroupId(e.target.value)}
                  >
                    {availableTeams.map((team) => {
                      const area = areas.find((a) => a.id === team.ministryAreaId) || team.ministryArea;
                      const group = groups.find((g) => g.id === team.ministryGroupConfigId) || team.ministryGroupConfig;
                      return (
                        <option key={team.id} value={team.id}>
                          {area?.name ?? 'Área'} × {group?.name ?? 'Grupo'}
                        </option>
                      );
                    })}
                  </Select>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="pt-2 flex gap-3">
          <Button
            type="button"
            variant="default"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            loading={submitting}
            loadingText="Asignando..."
            disabled={
              !selectedUser || (isTeamScope && availableTeams.length === 0)
            }
          >
            Confirmar Asignación
          </Button>
        </div>
      </form>
    </AppDrawer>
  );
};

export default AssignVolunteerDrawer;
