import React, { useEffect, useMemo, useState } from 'react';
import {
  Crown,
  Layers,
  Users,
  ShieldCheck,
  Award,
  Plus,
  Trash2,
  MapPin,
  Inbox,
  User as UserIcon,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import SelectSearch from '@/components/ui/SelectSearch';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetChurchCampuses } from '@/libs/state/redux/thunks/church/church.thunk';
import {
  DeleteVolunteerAssignment,
  GetVolunteerAssignments,
  GetVolunteers,
} from '@/libs/state/redux/thunks/church/volunteer.thunk';
import {
  IVolunteerAssignment,
  VolunteerRole,
} from '@/libs/models';
import AssignVolunteerDrawer from '../components/AssignVolunteerDrawer';
import { toast } from 'sonner';
import clsx from 'clsx';

interface VolunteerAssignmentsTabProps {
  ministryId: string;
}

/**
 * Tab component managing the 5-tier role hierarchy and volunteer assignments
 * within a specific ministry.
 *
 * @param {VolunteerAssignmentsTabProps} props - Component properties.
 * @returns {JSX.Element} The rendered assignments hierarchy tab.
 */
export const VolunteerAssignmentsTab: React.FC<VolunteerAssignmentsTabProps> = ({
  ministryId,
}) => {
  const dispatch = useAppDispatch();

  const campusesState = useAppSelector((state) => state.churchCampusSlice);
  const { areasByMinistry, groupsByMinistry, serviceAreaGroups } = useAppSelector(
    (state) => state.ministrySlice,
  );
  const { volunteers, assignments, loadingAssignments } = useAppSelector(
    (state) => state.volunteerSlice,
  );

  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<IVolunteerAssignment | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const areas = areasByMinistry[ministryId] || [];
  const groups = groupsByMinistry[ministryId] || [];
  const campuses = campusesState.data;

  useEffect(() => {
    if (campuses.length === 0) {
      dispatch(GetChurchCampuses());
    }
    dispatch(GetVolunteers({ ministryId, force: false }));
    dispatch(GetVolunteerAssignments({ ministryId, force: false }));
  }, [dispatch, ministryId, campuses.length]);

  useEffect(() => {
    if (!selectedCampusId && campuses.length > 0) {
      setSelectedCampusId(campuses[0].id);
    }
  }, [campuses, selectedCampusId]);

  const campusOptions = useMemo(() => {
    return campuses.map((c) => ({
      id: c.id,
      name: c.name,
    }));
  }, [campuses]);

  // Section 1: Coordinadores Generales de Ministerio
  const ministryCoordinators = useMemo(() => {
    return assignments.filter(
      (a) =>
        a.role === VolunteerRole.MINISTRY_GENERAL_COORDINATOR &&
        (a.ministryId === ministryId || !a.ministryId),
    );
  }, [assignments, ministryId]);

  // Section 2: Coordinadores Generales de Área
  const areaCoordinatorsByAreaId = useMemo(() => {
    const map: Record<string, IVolunteerAssignment[]> = {};
    areas.forEach((a) => {
      map[a.id] = assignments.filter(
        (asg) =>
          asg.role === VolunteerRole.AREA_GENERAL_COORDINATOR && asg.ministryAreaId === a.id,
      );
    });
    return map;
  }, [assignments, areas]);

  // Section 3: Coordinadores de Grupo
  const groupCoordinatorsByGroupId = useMemo(() => {
    const map: Record<string, IVolunteerAssignment[]> = {};
    groups.forEach((g) => {
      map[g.id] = assignments.filter(
        (asg) =>
          asg.role === VolunteerRole.GROUP_COORDINATOR && asg.ministryGroupConfigId === g.id,
      );
    });
    return map;
  }, [assignments, groups]);

  // Section 4: Equipos por Sede (ServiceAreaGroups)
  const currentCampusTeams = useMemo(() => {
    const areaIdSet = new Set(areas.map((a) => a.id));
    return serviceAreaGroups.filter(
      (sag) => sag.churchCampusId === selectedCampusId && areaIdSet.has(sag.ministryAreaId),
    );
  }, [serviceAreaGroups, selectedCampusId, areas]);

  const handleOpenDeleteConfirm = (asg: IVolunteerAssignment) => {
    setAssignmentToDelete(asg);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!assignmentToDelete) return;
    try {
      await dispatch(DeleteVolunteerAssignment({ id: assignmentToDelete.id })).unwrap();
      toast.success('Asignación eliminada exitosamente');
      setAssignmentToDelete(null);
    } catch (err) {
      toast.error('Error al remover la asignación');
    }
  };

  const renderPersonItem = (asg: IVolunteerAssignment, roleLabel?: string) => {
    const vId = asg.volunteerId || asg.ministryVolunteerId;
    const vol =
      asg.volunteer ||
      asg.ministryVolunteer ||
      volunteers.find((v) => v.id === vId || (v.userId && v.userId === asg.volunteer?.userId));
    const user = asg.volunteer?.user || vol?.user;
    const name =
      user && (user.firstName || user.lastName)
        ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
        : 'Servidor asignado';
    const nationalId = user?.nationalId;
    const photoUrl = user?.photoUrl;

    return (
      <div
        key={asg.id}
        className="flex items-center justify-between p-2.5 bg-slate-50 border border-gray-200/70 rounded-xl gap-2 hover:bg-slate-100/70 transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
            {photoUrl ? (
              <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={14} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{name}</p>
            <p className="text-[11px] text-gray-500 truncate">
              {roleLabel ? `${roleLabel} • ` : ''}
              {nationalId ? `Doc: ${nationalId}` : 'Sin documento'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenDeleteConfirm(asg)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
          title="Remover Asignación"
        >
          <Trash2 size={13} />
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Estructura y Roles</h2>
          <p className="text-xs text-gray-500">
            Jerarquía de coordinación, supervisión y servidores por equipo.
          </p>
        </div>
        <Button
          onClick={() => setAssignDrawerOpen(true)}
          size="sm"
          className="text-xs gap-1.5 py-1.5"
        >
          <Plus size={14} /> Asignar Rol
        </Button>
      </div>

      {loadingAssignments && assignments.length === 0 ? (
        <CellListSkeleton count={4} />
      ) : (
        <>
          {/* LEVEL 1: COORDINACIÓN GENERAL DEL MINISTERIO */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                  <Crown size={14} />
                </div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  1. Coordinación General del Ministerio
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                Nivel Global
              </span>
            </div>

            {ministryCoordinators.length === 0 ? (
              <div className="p-3 bg-slate-50 border border-dashed border-gray-200 rounded-xl text-center">
                <p className="text-xs text-gray-500">
                  Sin coordinadores generales asignados a este ministerio.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {ministryCoordinators.map((c) => renderPersonItem(c, 'Coordinador General'))}
              </div>
            )}
          </div>

          {/* LEVEL 2: COORDINACIÓN GENERAL DE ÁREA */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                  <Layers size={14} />
                </div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  2. Coordinación General de Área
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-800 rounded-full border border-blue-200">
                Por Área
              </span>
            </div>

            {areas.length === 0 ? (
              <p className="text-xs text-gray-500">No hay áreas de servicio configuradas.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {areas.map((area) => {
                  const assigned = areaCoordinatorsByAreaId[area.id] || [];
                  return (
                    <div
                      key={area.id}
                      className="p-3 rounded-xl border border-gray-200/80 bg-slate-50/40 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-800">{area.name}</span>
                        <span className="text-[10px] text-gray-500">
                          {assigned.length} {assigned.length === 1 ? 'coordinador' : 'coordinadores'}
                        </span>
                      </div>

                      {assigned.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic">
                          Sin coordinador de área asignado.
                        </p>
                      ) : (
                        assigned.map((a) => renderPersonItem(a, 'Coord. Área'))
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* LEVEL 3: COORDINACIÓN DE GRUPO */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                  <Users size={14} />
                </div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  3. Coordinación de Grupo
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-800 rounded-full border border-purple-200">
                Por Grupo
              </span>
            </div>

            {groups.length === 0 ? (
              <p className="text-xs text-gray-500">No hay grupos configurados.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {groups.map((group) => {
                  const assigned = groupCoordinatorsByGroupId[group.id] || [];
                  return (
                    <div
                      key={group.id}
                      className="p-3 rounded-xl border border-gray-200/80 bg-slate-50/40 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-800">
                          {group.name} (Posición {group.position})
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {assigned.length} {assigned.length === 1 ? 'coordinador' : 'coordinadores'}
                        </span>
                      </div>

                      {assigned.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic">
                          Sin coordinador de grupo asignado.
                        </p>
                      ) : (
                        assigned.map((g) => renderPersonItem(g, 'Coord. Grupo'))
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* LEVEL 4 & 5: EQUIPOS POR SEDE (SUPERVISOR Y SERVIDORES) */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                  <ShieldCheck size={14} />
                </div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  4 & 5. Equipos por Sede (Supervisores y Servidores)
                </h3>
              </div>
            </div>

            {/* Campus Selector */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold">
                <MapPin size={13} className="text-primary" />
                <span>Sede Activa</span>
              </div>
              <SelectSearch
                label=""
                placeholder="Seleccionar sede..."
                options={campusOptions}
                value={selectedCampusId}
                onChange={(val) => setSelectedCampusId(val)}
                searchable={campusOptions.length > 4}
              />
            </div>

            {currentCampusTeams.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-dashed border-gray-200 rounded-xl text-center flex flex-col items-center gap-2">
                <Inbox size={20} className="text-gray-400" />
                <p className="text-xs text-gray-500">
                  No hay combinaciones de equipos (Área × Grupo) creadas para esta sede.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {currentCampusTeams.map((team) => {
                  const area =
                    areas.find((a) => a.id === team.ministryAreaId) || team.ministryArea;
                  const group =
                    groups.find((g) => g.id === team.ministryGroupConfigId) ||
                    team.ministryGroupConfig;

                  const teamAssignments = assignments.filter(
                    (a) => a.serviceAreaGroupId === team.id,
                  );
                  const supervisors = teamAssignments.filter(
                    (a) => a.role === VolunteerRole.SUPERVISOR,
                  );
                  const volunteers = teamAssignments.filter(
                    (a) => a.role === VolunteerRole.VOLUNTEER,
                  );

                  return (
                    <div
                      key={team.id}
                      className="p-3.5 rounded-2xl border border-gray-200/80 bg-white shadow-xs flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">
                            {area?.name ?? 'Área'}
                          </span>
                          <span className="text-gray-300">×</span>
                          <span className="text-xs font-bold text-primary">
                            {group?.name ?? 'Grupo'}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          {teamAssignments.length} miembros
                        </span>
                      </div>

                      {/* Supervisor Section */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700">
                          <ShieldCheck size={13} />
                          <span>Supervisor de Equipo</span>
                        </div>
                        {supervisors.length === 0 ? (
                          <p className="text-[11px] text-gray-400 italic pl-1">
                            Sin supervisor asignado.
                          </p>
                        ) : (
                          supervisors.map((s) => renderPersonItem(s, 'Supervisor'))
                        )}
                      </div>

                      {/* Volunteers Section */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                          <Award size={13} />
                          <span>Servidores / Maestros ({volunteers.length})</span>
                        </div>
                        {volunteers.length === 0 ? (
                          <p className="text-[11px] text-gray-400 italic pl-1">
                            Sin servidores asignados a este equipo.
                          </p>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {volunteers.map((v) => renderPersonItem(v, 'Servidor'))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Assignment Modal Drawer */}
      <AssignVolunteerDrawer
        open={assignDrawerOpen}
        onOpenChange={setAssignDrawerOpen}
        ministryId={ministryId}
        areas={areas}
        groups={groups}
        campuses={campuses}
        serviceAreaGroups={serviceAreaGroups}
        existingAssignments={assignments}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Remover Asignación"
        description={`¿Estás seguro de que deseas remover esta asignación de rol?`}
        confirmText="Sí, remover"
        cancelText="Cancelar"
        type="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default VolunteerAssignmentsTab;
