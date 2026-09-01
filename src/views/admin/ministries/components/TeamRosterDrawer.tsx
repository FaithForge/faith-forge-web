import React, { useMemo, useState } from 'react';
import AppDrawer from '@/components/ui/AppDrawer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import {
  IServiceAreaGroup,
  IVolunteer,
  IVolunteerAssignment,
  VolunteerRole,
} from '@/libs/models';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import {
  ShieldCheck,
  Award,
  Plus,
  Trash2,
  Search,
  User as UserIcon,
  Phone,
  Inbox,
  Users,
} from 'lucide-react';

interface TeamRosterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: IServiceAreaGroup | null;
  areaName?: string;
  groupName?: string;
  campusName?: string;
  assignments: IVolunteerAssignment[];
  volunteersList?: IVolunteer[];
  onAssignClick: (role?: VolunteerRole) => void;
  onDeleteAssignment: (asg: IVolunteerAssignment) => void;
}

/**
 * Drawer modal to inspect, search, and manage volunteers and supervisors
 * assigned to a single specific Service Area Group team.
 *
 * @param {TeamRosterDrawerProps} props - Component properties.
 * @returns {JSX.Element} The rendered roster drawer.
 */
export const TeamRosterDrawer: React.FC<TeamRosterDrawerProps> = ({
  open,
  onOpenChange,
  team,
  areaName,
  groupName,
  campusName,
  assignments,
  volunteersList = [],
  onAssignClick,
  onDeleteAssignment,
}) => {
  useModalBackClose(open, () => onOpenChange(false));

  const [searchText, setSearchText] = useState('');

  // Reset search when opening
  React.useEffect(() => {
    if (open) {
      setSearchText('');
    }
  }, [open]);

  // Filter team assignments
  const teamAssignments = useMemo(() => {
    if (!team) return [];
    return assignments.filter((a) => a.serviceAreaGroupId === team.id);
  }, [assignments, team]);

  // Supervisors
  const supervisors = useMemo(() => {
    return teamAssignments.filter((a) => a.role === VolunteerRole.SUPERVISOR);
  }, [teamAssignments]);

  // Volunteers / Teachers
  const volunteers = useMemo(() => {
    return teamAssignments.filter((a) => a.role === VolunteerRole.VOLUNTEER);
  }, [teamAssignments]);

  // Filter volunteers by local search
  const filteredVolunteers = useMemo(() => {
    if (!searchText.trim()) return volunteers;
    const query = searchText.toLowerCase().trim();

    return volunteers.filter((asg) => {
      const vId = asg.volunteerId || asg.ministryVolunteerId;
      const vol =
        asg.volunteer ||
        asg.ministryVolunteer ||
        volunteersList.find((v) => v.id === vId || (v.userId && v.userId === asg.volunteer?.userId));
      const user = asg.volunteer?.user || vol?.user;

      const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.toLowerCase();
      const nationalId = user?.nationalId?.toLowerCase() || '';
      const phone = user?.phone?.toLowerCase() || '';

      return (
        fullName.includes(query) || nationalId.includes(query) || phone.includes(query)
      );
    });
  }, [volunteers, searchText, volunteersList]);

  const renderPersonRow = (asg: IVolunteerAssignment, roleLabel: string) => {
    const vId = asg.volunteerId || asg.ministryVolunteerId;
    const vol =
      asg.volunteer ||
      asg.ministryVolunteer ||
      volunteersList.find((v) => v.id === vId || (v.userId && v.userId === asg.volunteer?.userId));
    const user = asg.volunteer?.user || vol?.user;
    const name =
      user && (user.firstName || user.lastName)
        ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
        : 'Servidor asignado';
    const nationalId = user?.nationalId;
    const phone = user?.phone;
    const photoUrl = user?.photoUrl;

    return (
      <div
        key={asg.id}
        className="flex items-center justify-between p-3 bg-white border border-gray-200/80 rounded-2xl shadow-2xs gap-3 hover:border-gray-300 transition-all"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
            {photoUrl ? (
              <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={16} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{name}</p>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5 flex-wrap">
              <span className="font-semibold text-primary">{roleLabel}</span>
              {nationalId && <span>• Doc: {nationalId}</span>}
              {phone && (
                <span className="inline-flex items-center gap-0.5">
                  <Phone size={10} className="text-gray-400" /> {phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDeleteAssignment(asg)}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
          title="Remover del equipo"
        >
          <Trash2 size={15} />
        </button>
      </div>
    );
  };

  const displayName = `${areaName ?? 'Área'} × ${groupName ?? 'Grupo'}`;

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Plantilla del Equipo"
      icon={<Users className="text-primary" size={20} />}
    >
      <div className="p-4 sm:p-5 flex flex-col gap-5">
        {/* Team Header Info */}
        <div className="bg-slate-50 border border-gray-200/80 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
              {displayName}
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/80">
              {teamAssignments.length}{' '}
              {teamAssignments.length === 1 ? 'miembro' : 'miembros'}
            </span>
          </div>

          {campusName && (
            <p className="text-xs text-gray-500 font-medium">Sede: {campusName}</p>
          )}
        </div>

        {/* SECTION 1: SUPERVISOR */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wide">
              <ShieldCheck size={15} />
              <span>Supervisor de Equipo</span>
            </div>
            {supervisors.length === 0 && (
              <Button
                onClick={() => onAssignClick(VolunteerRole.SUPERVISOR)}
                size="sm"
                variant="default"
                className="text-[11px] py-1 px-2.5 gap-1"
              >
                <Plus size={13} /> Asignar Supervisor
              </Button>
            )}
          </div>

          {supervisors.length === 0 ? (
            <div className="p-3.5 bg-amber-50/60 border border-dashed border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-amber-800">
              <div className="text-xs">
                <p className="font-bold">Sin supervisor asignado</p>
                <p className="text-amber-700 text-[11px]">
                  Este equipo requiere un supervisor responsable de la operación.
                </p>
              </div>
              <Button
                onClick={() => onAssignClick(VolunteerRole.SUPERVISOR)}
                size="sm"
                className="text-xs py-1 px-3 gap-1 shrink-0"
              >
                <Plus size={13} /> Asignar
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {supervisors.map((s) => renderPersonRow(s, 'Supervisor'))}
            </div>
          )}
        </div>

        {/* SECTION 2: SERVIDORES / MAESTROS */}
        <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wide">
              <Award size={15} />
              <span>
                Servidores / Maestros ({volunteers.length})
              </span>
            </div>
            <Button
              onClick={() => onAssignClick(VolunteerRole.VOLUNTEER)}
              size="sm"
              className="text-xs py-1 px-2.5 gap-1"
            >
              <Plus size={14} /> Agregar Servidor
            </Button>
          </div>

          {/* Search bar within team (only if multiple volunteers) */}
          {volunteers.length > 3 && (
            <Input
              placeholder="Filtrar por nombre o documento..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              icon="search"
              className="text-xs py-1.5"
            />
          )}

          {/* Volunteers List */}
          {volunteers.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-dashed border-gray-200 rounded-2xl text-center flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-gray-400">
                <Inbox size={20} />
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Sin servidores asignados a este equipo.
              </p>
              <Button
                onClick={() => onAssignClick(VolunteerRole.VOLUNTEER)}
                size="sm"
                className="text-xs py-1.5 px-3 gap-1 mt-1"
              >
                <Plus size={14} /> Asignar Primer Servidor
              </Button>
            </div>
          ) : filteredVolunteers.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-gray-400">
              No se encontraron servidores que coincidan con &quot;{searchText}&quot;
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredVolunteers.map((v) => renderPersonRow(v, 'Servidor'))}
            </div>
          )}
        </div>
      </div>
    </AppDrawer>
  );
};

export default TeamRosterDrawer;
