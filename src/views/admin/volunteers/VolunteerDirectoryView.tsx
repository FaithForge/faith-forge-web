import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  ChevronRight,
  Sparkles,
  Inbox,
  User as UserIcon,
  Phone,
  FileText,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetMinistries } from '@/libs/state/redux/thunks/church/ministry.thunk';
import {
  GetVolunteers,
  GetVolunteerAssignments,
} from '@/libs/state/redux/thunks/church/volunteer.thunk';
import { IVolunteer, VolunteerRole } from '@/libs/models';
import { APP_ROUTES } from '@/config/routes';
import RegisterVolunteerModal from './components/RegisterVolunteerModal';
import VolunteerDetailDrawer from './components/VolunteerDetailDrawer';
import clsx from 'clsx';

const ROLE_LABEL_SHORT: Record<VolunteerRole, string> = {
  [VolunteerRole.MINISTRY_GENERAL_COORDINATOR]: 'Coord. General',
  [VolunteerRole.AREA_GENERAL_COORDINATOR]: 'Coord. Área',
  [VolunteerRole.GROUP_COORDINATOR]: 'Coord. Grupo',
  [VolunteerRole.SUPERVISOR]: 'Supervisor',
  [VolunteerRole.VOLUNTEER]: 'Servidor',
};

/**
 * Global Volunteers Directory View at /admin/volunteers.
 * Allows administrators to query volunteers across all ministries and campuses,
 * check their cross-ministry roles, and inspect details in a bottom sheet.
 *
 * @returns {JSX.Element} Rendered volunteer directory.
 */
const VolunteerDirectoryView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const churchId = import.meta.env.VITE_CHURCH_ID;

  const { ministries } = useAppSelector((state) => state.ministrySlice);
  const { volunteers, assignments, loadingVolunteers } = useAppSelector(
    (state) => state.volunteerSlice,
  );

  const [searchText, setSearchText] = useState('');
  const [selectedMinistryFilter, setSelectedMinistryFilter] = useState<string>('ALL');
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<IVolunteer | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  useEffect(() => {
    dispatch(GetMinistries({ churchId }));
    dispatch(GetVolunteers({ force: false }));
    dispatch(GetVolunteerAssignments({ force: false }));
  }, [dispatch, churchId]);

  const handleRefresh = async () => {
    await Promise.all([
      dispatch(GetVolunteers({ force: true })),
      dispatch(GetVolunteerAssignments({ force: true })),
    ]);
  };

  // Group assignments by volunteerId and userId
  const assignmentsByVolunteerId = useMemo(() => {
    const map: Record<string, typeof assignments> = {};
    assignments.forEach((asg) => {
      const vId = asg.volunteerId || asg.ministryVolunteerId;
      if (vId) {
        if (!map[vId]) {
          map[vId] = [];
        }
        map[vId].push(asg);
      }
      const uId = asg.volunteer?.userId || asg.ministryVolunteer?.userId;
      if (uId) {
        if (!map[uId]) {
          map[uId] = [];
        }
        map[uId].push(asg);
      }
    });
    return map;
  }, [assignments]);

  // Filter volunteers based on searchText and selectedMinistryFilter
  const filteredVolunteers = useMemo(() => {
    return volunteers.filter((vol) => {
      const user = vol.user;
      const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.toLowerCase();
      const nationalId = user?.nationalId?.toLowerCase() ?? '';
      const phone = user?.phone?.toLowerCase() ?? '';

      // Text search
      const query = searchText.trim().toLowerCase();
      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        nationalId.includes(query) ||
        phone.includes(query);

      if (!matchesSearch) return false;

      // Ministry filter
      if (selectedMinistryFilter !== 'ALL') {
        const userAssignments = assignmentsByVolunteerId[vol.id] || [];
        const hasAssignmentInMinistry = userAssignments.some((a) => {
          return (
            a.ministryId === selectedMinistryFilter ||
            a.ministry?.id === selectedMinistryFilter ||
            a.ministryArea?.ministryId === selectedMinistryFilter ||
            a.ministryGroupConfig?.ministryId === selectedMinistryFilter ||
            a.serviceAreaGroup?.ministryArea?.ministryId === selectedMinistryFilter
          );
        });
        return hasAssignmentInMinistry;
      }

      return true;
    });
  }, [volunteers, searchText, selectedMinistryFilter, assignmentsByVolunteerId]);

  const handleOpenDetail = (vol: IVolunteer) => {
    setSelectedVolunteer(vol);
    setDetailDrawerOpen(true);
  };

  return (
    <div className="min-h-full bg-slate-50/60 pb-20">
      <PageHeader
        title="Directorio de Servidores"
        onBack={() => navigate(APP_ROUTES.admin.root)}
        rightAction={
          <button
            type="button"
            onClick={() => setRegisterModalOpen(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all"
            title="Registrar Servidor"
          >
            <Plus size={18} />
          </button>
        }
      />

      <div className="max-w-2xl mx-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* Info Header Card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
            <Sparkles size={14} />
            <span>Módulo de Servidores</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Directorio Global de Servidores
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Visualiza todos los servidores de la iglesia, sus asignaciones entre ministerios y roles
            activos.
          </p>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600">
              Total: {volunteers.length}{' '}
              {volunteers.length === 1 ? 'servidor registrado' : 'servidores registrados'}
            </span>
            <Button
              onClick={() => setRegisterModalOpen(true)}
              size="sm"
              className="text-xs gap-1 py-1.5"
            >
              <Plus size={14} /> Registrar Servidor
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Buscar por nombre o número de documento..."
          icon="search"
          onClear={() => setSearchText('')}
        />

        {/* Ministry Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedMinistryFilter('ALL')}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
              selectedMinistryFilter === 'ALL'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-slate-50',
            )}
          >
            Todos los Ministerios
          </button>
          {ministries.map((m) => {
            const isSelected = selectedMinistryFilter === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMinistryFilter(m.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
                  isSelected
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-slate-50',
                )}
              >
                {m.name}
              </button>
            );
          })}
        </div>

        {/* Volunteers List */}
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="flex flex-col gap-3">
            {loadingVolunteers && volunteers.length === 0 ? (
              <CellListSkeleton count={5} />
            ) : filteredVolunteers.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-200/80 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-gray-400">
                  <Inbox size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">
                    {searchText
                      ? 'No se encontraron servidores'
                      : 'Sin servidores registrados en esta selección'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {searchText
                      ? 'Prueba con otro nombre o documento.'
                      : 'Registra usuarios existentes para asignarles responsabilidades.'}
                  </p>
                </div>
                {!searchText && (
                  <Button
                    onClick={() => setRegisterModalOpen(true)}
                    size="sm"
                    className="mt-2 text-xs"
                  >
                    <Plus size={14} /> Registrar Servidor
                  </Button>
                )}
              </div>
            ) : (
              filteredVolunteers.map((volunteer) => {
                const user = volunteer.user;
                const name =
                  user && (user.firstName || user.lastName)
                    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
                    : 'Servidor';
                const userAssignments =
                  assignmentsByVolunteerId[volunteer.id] ||
                  (volunteer.userId ? assignmentsByVolunteerId[volunteer.userId] : []) ||
                  [];

                return (
                  <div
                    key={volunteer.id}
                    onClick={() => handleOpenDetail(volunteer)}
                    className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs hover:border-primary/40 hover:shadow-sm cursor-pointer transition-all active:scale-[0.99] flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-slate-100 border border-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden mt-0.5">
                        {user?.photoUrl ? (
                          <img src={user.photoUrl} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon size={18} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h2 className="text-sm font-bold text-gray-900 truncate">{name}</h2>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5 flex-wrap">
                          {user?.nationalId && (
                            <span className="flex items-center gap-1">
                              <FileText size={11} className="text-gray-400" />
                              <span>{user.nationalId}</span>
                            </span>
                          )}
                          {user?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={11} className="text-gray-400" />
                              <span>{user.phone}</span>
                            </span>
                          )}
                        </div>

                        {/* Cross-Ministry Badges */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {userAssignments.length === 0 ? (
                            <span className="text-[10px] text-gray-400 italic">
                              Sin asignaciones activas
                            </span>
                          ) : (
                            userAssignments.map((a) => {
                              const ministryName =
                                a.ministry?.name ||
                                ministries.find(
                                  (m) =>
                                    m.id ===
                                    (a.ministryId ||
                                      a.ministryArea?.ministryId ||
                                      a.serviceAreaGroup?.ministryArea?.ministryId),
                                )?.name ||
                                'Ministerio';
                              const roleLabel = ROLE_LABEL_SHORT[a.role] || a.role;
                              return (
                                <span
                                  key={a.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80"
                                >
                                  <span className="text-primary font-extrabold">{ministryName}:</span>{' '}
                                  {roleLabel}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="w-6 h-6 flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </PullToRefresh>
      </div>

      <RegisterVolunteerModal
        open={registerModalOpen}
        onOpenChange={setRegisterModalOpen}
      />

      <VolunteerDetailDrawer
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        volunteer={selectedVolunteer}
        onAssignmentsChange={() => {
          dispatch(GetVolunteerAssignments({ force: true }));
        }}
      />
    </div>
  );
};

export default VolunteerDirectoryView;
