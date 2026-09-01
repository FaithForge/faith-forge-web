import React, { useEffect, useState } from 'react';
import AppDrawer from '@/components/ui/AppDrawer';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import {
  IVolunteer,
  IVolunteerAssignment,
  VolunteerRole,
} from '@/libs/models';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import {
  DeleteVolunteerAssignment,
  GetVolunteerWithAssignments,
  GetVolunteers,
} from '@/libs/state/redux/thunks/church/volunteer.thunk';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { formatPhoneWithDialCode } from '@/libs/utils/text';
import { toast } from 'sonner';
import {
  User as UserIcon,
  Trash2,
  Phone,
  Mail,
  FileText,
  Crown,
  Layers,
  Users,
  ShieldCheck,
  Award,
  Inbox,
  Calendar,
} from 'lucide-react';
import clsx from 'clsx';

interface VolunteerDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volunteer: IVolunteer | null;
  onAssignmentsChange?: () => void;
}

const ROLE_STYLE_MAP: Record<
  VolunteerRole,
  { label: string; badge: string; icon: React.ElementType }
> = {
  [VolunteerRole.MINISTRY_GENERAL_COORDINATOR]: {
    label: 'Coordinador General Ministerio',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Crown,
  },
  [VolunteerRole.AREA_GENERAL_COORDINATOR]: {
    label: 'Coordinador General de Área',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: Layers,
  },
  [VolunteerRole.GROUP_COORDINATOR]: {
    label: 'Coordinador de Grupo',
    badge: 'bg-purple-50 text-purple-800 border-purple-200',
    icon: Users,
  },
  [VolunteerRole.SUPERVISOR]: {
    label: 'Supervisor de Equipo',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: ShieldCheck,
  },
  [VolunteerRole.VOLUNTEER]: {
    label: 'Servidor / Maestro',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: Award,
  },
};

/**
 * Detail drawer displaying a volunteer's profile and comprehensive list of cross-ministry assignments.
 *
 * @param {VolunteerDetailDrawerProps} props - Component properties.
 * @returns {JSX.Element} The rendered detail drawer.
 */
export const VolunteerDetailDrawer: React.FC<VolunteerDetailDrawerProps> = ({
  open,
  onOpenChange,
  volunteer,
  onAssignmentsChange,
}) => {
  useModalBackClose(open, () => onOpenChange(false));

  const dispatch = useAppDispatch();
  const campuses = useAppSelector((state) => state.churchCampusSlice.data);
  const { currentVolunteerAssignments, loadingCurrentAssignments } = useAppSelector(
    (state) => state.volunteerSlice,
  );

  const [assignmentToDelete, setAssignmentToDelete] = useState<IVolunteerAssignment | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (open && volunteer) {
      dispatch(GetVolunteerWithAssignments({ volunteerId: volunteer.id }));
    }
  }, [open, volunteer, dispatch]);

  const user = volunteer?.user;
  const name =
    user && (user.firstName || user.lastName)
      ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
      : 'Servidor';

  const handleOpenDelete = (asg: IVolunteerAssignment) => {
    setAssignmentToDelete(asg);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!assignmentToDelete || !volunteer) return;
    try {
      await dispatch(DeleteVolunteerAssignment({ id: assignmentToDelete.id })).unwrap();
      toast.success('Asignación eliminada exitosamente');
      dispatch(GetVolunteerWithAssignments({ volunteerId: volunteer.id }));
      dispatch(GetVolunteers({ force: true }));
      onAssignmentsChange?.();
      setAssignmentToDelete(null);
    } catch {
      toast.error('Error al remover la asignación');
    }
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Detalle del Servidor"
      icon={<UserIcon className="text-primary" size={20} />}
    >
      <div className="flex flex-col gap-5 p-4">
        {/* Volunteer Identity Header */}
        <div className="bg-slate-50 border border-gray-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-white border border-gray-200 text-primary flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden shadow-xs">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={24} />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-gray-900 truncate">{name}</h3>
            <div className="flex flex-col gap-0.5 mt-1 text-xs text-gray-500">
              {user?.nationalId && (
                <div className="flex items-center gap-1.5">
                  <FileText size={12} className="text-gray-400" />
                  <span>Doc: {user.nationalId}</span>
                </div>
              )}
              {user?.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={12} className="text-gray-400" />
                  <span>
                    {formatPhoneWithDialCode(
                      user.phone,
                      user.dialCodePhone || (user as any).dialCode,
                    )}
                  </span>
                </div>
              )}
              {user?.email && (
                <div className="flex items-center gap-1.5 truncate">
                  <Mail size={12} className="text-gray-400" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assignments List Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Roles y Asignaciones Activas
            </h4>
            <span className="text-xs font-semibold text-primary">
              {currentVolunteerAssignments.length}{' '}
              {currentVolunteerAssignments.length === 1 ? 'asignación' : 'asignaciones'}
            </span>
          </div>

          {loadingCurrentAssignments ? (
            <CellListSkeleton count={3} />
          ) : currentVolunteerAssignments.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-dashed border-gray-200 rounded-2xl text-center flex flex-col items-center gap-2">
              <Inbox size={20} className="text-gray-400" />
              <p className="text-xs text-gray-500">Este servidor no cuenta con asignaciones activas.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {currentVolunteerAssignments.map((asg) => {
                const roleConfig =
                  ROLE_STYLE_MAP[asg.role] || ROLE_STYLE_MAP[VolunteerRole.VOLUNTEER];
                const RoleIcon = roleConfig.icon;

                // Scope description
                const campus =
                  asg.serviceAreaGroup?.churchCampus?.name ||
                  asg.ministry?.churchCampus?.name ||
                  campuses.find(
                    (c) =>
                      c.id ===
                      (asg.serviceAreaGroup?.churchCampusId ||
                        asg.churchCampusId ||
                        asg.ministry?.churchCampusId),
                  )?.name ||
                  '';
                let scopeText = '';
                if (campus) {
                  scopeText = `Sede: ${campus} • `;
                }
                if (asg.ministry) {
                  scopeText += asg.ministry.name;
                }
                if (asg.ministryArea) {
                  scopeText += ` • Área: ${asg.ministryArea.name}`;
                }
                if (asg.ministryGroupConfig) {
                  scopeText += ` • Grupo: ${asg.ministryGroupConfig.name}`;
                }
                if (asg.serviceAreaGroup) {
                  const sag = asg.serviceAreaGroup;
                  const areaName = sag.ministryArea?.name ?? '';
                  const groupName = sag.ministryGroupConfig?.name ?? '';
                  const campusName = sag.churchCampus?.name ?? campus;
                  scopeText = `${areaName} × ${groupName}${campusName ? ` (${campusName})` : ''}`;
                }

                return (
                  <div
                    key={asg.id}
                    className="p-3.5 bg-white border border-gray-200/80 rounded-2xl shadow-xs flex items-center justify-between gap-3 hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-gray-700 shrink-0 mt-0.5">
                        <RoleIcon size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={clsx(
                              'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                              roleConfig.badge,
                            )}
                          >
                            {roleConfig.label}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-gray-800 mt-1 truncate">
                          {scopeText || 'Alcance general'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenDelete(asg)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                      title="Remover Asignación"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="button"
            variant="default"
            block
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Remover Asignación"
        description="¿Estás seguro de que deseas eliminar esta asignación del servidor?"
        confirmText="Sí, remover"
        cancelText="Cancelar"
        type="danger"
        onConfirm={handleConfirmDelete}
      />
    </AppDrawer>
  );
};

export default VolunteerDetailDrawer;
