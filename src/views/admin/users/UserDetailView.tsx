import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Pencil, 
  ShieldPlus, 
  Trash2, 
  User as UserIcon, 
  CheckCircle2, 
  ShieldCheck, 
  Eye, 
  X,
  UserCheck,
  KeyRound,
  Clock,
  Layers,
  Award,
  MapPin,
  CalendarClock,
  AlertCircle
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { toast } from 'sonner';
import clsx from 'clsx';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import PhoneDisplay from '@/components/ui/PhoneDisplay';
import { KidCheckInSkeleton } from '@/components/ui/DetailSkeleton';
import AssignUserRoleModal from '@/components/modal/AssignUserRoleModal';
import UserAccountModal from '@/components/modal/UserAccountModal';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetUser, UnassignUserRole } from '@/libs/state/redux/thunks/user/user.thunk';
import {
  GetVolunteerByUserId,
  GetUserPermissionGrants,
  RevokeVolunteerPermissionGrant,
  DeleteVolunteerAssignment,
} from '@/libs/state/redux/thunks/church/volunteer.thunk';
import { GetChurchCampuses } from '@/libs/state/redux/thunks/church/church.thunk';
import { GetMinistries } from '@/libs/state/redux/thunks/church/ministry.thunk';
import { APP_ROUTES } from '@/config/routes';
import { capitalizeWords } from '@/libs/utils/text';
import { formatDateOnly, toDateOnlyInputValue } from '@/libs/utils/date';
import { UserRole, ALL_SYSTEM_ROLES_METADATA } from '@/libs/utils/auth';
import {
  UserGenderCode,
  UserState,
  ID_TYPE_CODE_MAPPER,
  IVolunteerAssignment,
  IVolunteerPermissionGrant,
} from '@/libs/models';
import { AssignUserMinistryModal } from './components/AssignUserMinistryModal';
import { GrantTemporaryPermissionModal } from './components/GrantTemporaryPermissionModal';

dayjs.locale('es');

/**
 * Detailed User Profile View.
 * Displays user personal data, contact information, and assigned roles.
 * Allows quick editing of personal details and direct role assignment / deletion.
 *
 * @returns {JSX.Element} Rendered user detail view.
 */
const UserDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { current: currentUserInSlice, data: usersList, loading } = useAppSelector((state) => state.userSlice);

  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<UserRole | null>(null);
  const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(false);
  const [isDeletingRole, setIsDeletingRole] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Volunteer and Temporary Permission Grants state
  const {
    activeUserVolunteer,
    loadingUserVolunteer,
    userPermissionGrants,
    loadingUserPermissionGrants,
  } = useAppSelector((state) => state.volunteerSlice);

  // Campus and Ministry catalogs for assignment metadata resolution
  const campuses = useAppSelector((state) => state.churchCampusSlice.data);
  const { ministries, areasByMinistry } = useAppSelector((state) => state.ministrySlice);

  useEffect(() => {
    if (!campuses || campuses.length === 0) {
      dispatch(GetChurchCampuses());
    }
    if (!ministries || ministries.length === 0) {
      dispatch(GetMinistries({ churchId: import.meta.env.VITE_CHURCH_ID }));
    }
  }, [dispatch, campuses?.length, ministries?.length]);

  const campusesMap = useMemo(() => new Map(campuses.map((c) => [c.id, c])), [campuses]);
  const ministriesMap = useMemo(() => new Map(ministries.map((m) => [m.id, m])), [ministries]);
  const allAreas = useMemo(() => Object.values(areasByMinistry).flat(), [areasByMinistry]);
  const areasMap = useMemo(() => new Map(allAreas.map((a) => [a.id, a])), [allAreas]);

  const [showAssignMinistryModal, setShowAssignMinistryModal] = useState(false);
  const [showGrantPermissionModal, setShowGrantPermissionModal] = useState(false);
  const [grantToRevoke, setGrantToRevoke] = useState<IVolunteerPermissionGrant | null>(null);
  const [showRevokeGrantModal, setShowRevokeGrantModal] = useState(false);
  const [isRevokingGrant, setIsRevokingGrant] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<IVolunteerAssignment | null>(null);
  const [showDeleteAssignmentModal, setShowDeleteAssignmentModal] = useState(false);
  const [isDeletingAssignment, setIsDeletingAssignment] = useState(false);

  // Derive user from current slice selection or from loaded list in memory
  const user = useMemo(() => {
    if (currentUserInSlice && currentUserInSlice.id === id) {
      return currentUserInSlice;
    }
    if (id && usersList && usersList.length > 0) {
      const found = usersList.find((u) => u.id === id);
      if (found) return found;
    }
    return currentUserInSlice?.id === id ? currentUserInSlice : undefined;
  }, [currentUserInSlice, usersList, id]);

  // Only fallback to GetUser if user is not already available in Redux (e.g. direct URL refresh)
  useEffect(() => {
    if (id && (!user || user.id !== id)) {
      dispatch(GetUser({ id }));
    }
  }, [id, user, dispatch]);

  // Fetch volunteer profile and permission grants when user ID is available
  useEffect(() => {
    if (user?.id) {
      dispatch(GetVolunteerByUserId({ userId: user.id }));
      dispatch(GetUserPermissionGrants({ userId: user.id }));
    }
  }, [user?.id, dispatch]);

  // Reset image error state when photo changes
  useEffect(() => {
    setImageError(false);
  }, [user?.photoUrl]);

  // Calculate formatted age if birthday exists
  const formattedAge = useMemo(() => {
    if (user?.birthday) {
      const birth = dayjs.utc(toDateOnlyInputValue(user.birthday));
      if (birth.isValid()) {
        const years = dayjs().diff(birth, 'year');
        return `${years} ${years === 1 ? 'año' : 'años'}`;
      }
    }
    return '';
  }, [user?.birthday]);

  const assignedRoles = user?.roles || [];
  const specialRoles = useMemo(
    () => assignedRoles.filter((r) => r !== UserRole.USER && (r as string) !== 'USER'),
    [assignedRoles],
  );

  /**
   * Confirms and dispatches the unassignment of a specific role.
   */
  const handleConfirmDeleteRole = async () => {
    if (!user?.id || !roleToDelete) return;

    if (roleToDelete === UserRole.USER || (roleToDelete as string) === 'USER') {
      toast.error('El rol básico de usuario no puede ser eliminado');
      setShowDeleteRoleModal(false);
      setRoleToDelete(null);
      return;
    }

    setIsDeletingRole(true);
    const roleMeta = ALL_SYSTEM_ROLES_METADATA[roleToDelete];
    const roleName = roleMeta?.name || roleToDelete;

    try {
      await dispatch(
        UnassignUserRole({
          userId: user.id,
          userRole: roleToDelete,
        })
      ).unwrap();

      toast.success(`¡Rol "${roleName}" eliminado con éxito!`);
      setShowDeleteRoleModal(false);
      setRoleToDelete(null);
      if (id) {
        dispatch(GetUser({ id }));
      }
    } catch (err: any) {
      toast.error(err?.message || err?.error || 'Error al eliminar el rol del usuario');
    } finally {
      setIsDeletingRole(false);
    }
  };

  /**
   * Confirms and dispatches the deletion of a volunteer ministry assignment.
   */
  const handleConfirmDeleteAssignment = async () => {
    if (!assignmentToDelete?.id || !user?.id) return;

    setIsDeletingAssignment(true);
    try {
      await dispatch(DeleteVolunteerAssignment({ id: assignmentToDelete.id })).unwrap();
      toast.success('Asignación ministerial eliminada con éxito');
      setShowDeleteAssignmentModal(false);
      setAssignmentToDelete(null);
      dispatch(GetVolunteerByUserId({ userId: user.id }));
    } catch (err: any) {
      toast.error(err?.message || err?.error || 'Error al eliminar la asignación');
    } finally {
      setIsDeletingAssignment(false);
    }
  };

  /**
   * Confirms and dispatches the revocation of a temporary permission grant.
   */
  const handleConfirmRevokeGrant = async () => {
    if (!grantToRevoke?.id || !user?.id) return;

    setIsRevokingGrant(true);
    try {
      await dispatch(
        RevokeVolunteerPermissionGrant({ grantId: grantToRevoke.id, userId: user.id }),
      ).unwrap();
      toast.success('Permiso temporal revocado con éxito');
      setShowRevokeGrantModal(false);
      setGrantToRevoke(null);
      dispatch(GetUserPermissionGrants({ userId: user.id }));
    } catch (err: any) {
      toast.error(err?.message || err?.error || 'Error al revocar el permiso temporal');
    } finally {
      setIsRevokingGrant(false);
    }
  };

  const roleToDeleteMeta = roleToDelete ? ALL_SYSTEM_ROLES_METADATA[roleToDelete] : null;

  return (
    <div className="min-h-full flex-1 w-full bg-slate-50 pb-20">
      <PageHeader
        title="Perfil de Usuario"
        onBack={() => navigate(APP_ROUTES.admin.users)}
      />

      <div className="p-4 max-w-3xl mx-auto animate-in fade-in duration-300">
        {(!user || user.id !== id || loading) && <KidCheckInSkeleton />}

        {user && user.id === id && !loading && (
          <div className="flex flex-col gap-4">
            {/* Header Profile Card */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex gap-4 items-center">
                <div className="relative shrink-0 group">
                  <div
                    onClick={() => {
                      if (user?.photoUrl && !imageError) setShowPhotoModal(true);
                    }}
                    className={clsx(
                      'w-20 h-20 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative border-2 border-primary/20',
                      user?.photoUrl && !imageError
                        ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95'
                        : '',
                      (!user?.photoUrl || imageError) &&
                        (user?.gender === UserGenderCode.FEMALE || (user?.gender as string)?.toUpperCase() === 'FEMALE'
                          ? 'bg-pink-100 text-pink-500'
                          : 'bg-blue-100 text-blue-500')
                    )}
                  >
                    {user?.photoUrl && !imageError ? (
                      <>
                        <img
                          src={user.photoUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                          onError={() => setImageError(true)}
                        />
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <Eye size={24} className="text-white drop-shadow-md" />
                        </div>
                      </>
                    ) : (
                      <UserIcon size={38} />
                    )}
                  </div>

                  {user?.photoUrl && !imageError && (
                    <button
                      type="button"
                      onClick={() => setShowPhotoModal(true)}
                      className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-primary transition-transform active:scale-90"
                    >
                      <Eye size={12} />
                    </button>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-black text-gray-900 leading-snug break-words">
                      {capitalizeWords(`${user.firstName || ''} ${user.lastName || ''}`)}
                    </h1>
                  </div>

                  <h2 className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
                    ID: #{user.faithForgeId || (user.id ? user.id.slice(0, 8) : '')} • {user.nationalIdType || 'CC'}:{' '}
                    <span className="font-bold text-gray-700">{user.nationalId || 'Sin documento'}</span>
                  </h2>

                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    <span
                      className={clsx(
                        'px-2.5 py-0.5 text-xs font-bold rounded-full border',
                        user.state === UserState.ACTIVE
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : user.state === UserState.DISABLE || user.state === UserState.INACTIVE
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : user.state === UserState.DELETED
                          ? 'bg-gray-100 text-gray-800 border-gray-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      )}
                    >
                      {user.state === UserState.ACTIVE
                        ? 'Activo'
                        : user.state === UserState.DISABLE || user.state === UserState.INACTIVE
                        ? 'Deshabilitado'
                        : user.state === UserState.DELETED
                        ? 'Eliminado'
                        : 'Verificación Pendiente'}
                    </span>

                    <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 flex items-center gap-1">
                      <ShieldCheck size={13} /> {specialRoles.length}{' '}
                      {specialRoles.length === 1 ? 'rol especial' : 'roles especiales'}
                    </span>

                    {activeUserVolunteer && (activeUserVolunteer.assignments?.length || 0) > 0 && (
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-violet-50 text-violet-700 rounded-full border border-violet-200 flex items-center gap-1">
                        <Award size={13} /> Servidor Activo
                      </span>
                    )}

                    {userPermissionGrants.length > 0 && (
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-50 text-amber-700 rounded-full border border-amber-200 flex items-center gap-1">
                        <Clock size={13} /> {userPermissionGrants.length}{' '}
                        {userPermissionGrants.length === 1 ? 'permiso temporal' : 'permisos temporales'}
                      </span>
                    )}

                    {user.username ? (
                      <button
                        type="button"
                        onClick={() => setShowAccountModal(true)}
                        className="px-2.5 py-0.5 text-xs font-bold font-mono bg-primary/10 hover:bg-primary/20 text-primary rounded-full border border-primary/20 flex items-center gap-1 transition-colors active:scale-95 cursor-pointer"
                        title="Gestionar credenciales de acceso"
                      >
                        <KeyRound size={11} /> {user.username}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAccountModal(true)}
                        className="px-2.5 py-0.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-full border border-amber-200 flex items-center gap-1 transition-colors active:scale-95 cursor-pointer"
                        title="Crear cuenta de acceso"
                      >
                        <KeyRound size={11} /> Sin cuenta de acceso
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta: Datos del Usuario */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3.5">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                  <UserCheck size={16} className="text-primary" /> Datos Personales y de Contacto
                </h3>

                <Button
                  type="button"
                  variant="default"
                  onClick={() => {
                    if (user?.id) navigate(APP_ROUTES.admin.updateUser(user.id));
                  }}
                  className="py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 shadow-2xs border border-gray-200"
                >
                  <Pencil size={13} className="text-gray-600" /> Editar Datos
                </Button>
              </div>

              <div className="flex flex-col gap-y-2.5 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="font-semibold text-gray-500 text-xs">Tipo de Documento</span>
                  <span className="font-bold text-gray-800 text-xs sm:text-sm">
                    {user.nationalIdType ? `${user.nationalIdType} - ${ID_TYPE_CODE_MAPPER[user.nationalIdType] || ''}` : 'No registrado'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="font-semibold text-gray-500 text-xs">Número de Documento</span>
                  <span className="font-bold text-gray-800 text-xs sm:text-sm">{user.nationalId || 'No registrado'}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="font-semibold text-gray-500 text-xs">Género</span>
                  <span className="font-bold text-gray-800 text-xs sm:text-sm">
                    {user.gender === UserGenderCode.FEMALE || (user.gender as unknown) === 'FEMALE'
                      ? 'Femenino'
                      : 'Masculino'}
                  </span>
                </div>

                {user.birthday && (
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="font-semibold text-gray-500 text-xs">Fecha de Nacimiento</span>
                    <span className="font-bold text-gray-800 text-xs sm:text-sm">
                      {formatDateOnly(user.birthday)}
                      {formattedAge ? ` (${formattedAge})` : ''}
                    </span>
                  </div>
                )}

                {user.phone && (
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="font-semibold text-gray-500 text-xs">Teléfono / Celular</span>
                    <div className="flex items-center gap-2">
                      <PhoneDisplay
                        phone={user.phone}
                        dialCode={user.dialCodePhone}
                        phoneClassName="font-bold text-gray-800 text-xs sm:text-sm"
                      />
                      <a
                        href={`https://api.whatsapp.com/send?phone=${(user.dialCodePhone || '+57').replace(/\D/g, '')}${user.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#25D366] hover:text-[#20bd5a] p-1 bg-emerald-50 rounded-lg transition-colors"
                        title="Abrir WhatsApp"
                      >
                        <FaWhatsapp size={15} />
                      </a>
                    </div>
                  </div>
                )}

                {user.email && (
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="font-semibold text-gray-500 text-xs">Correo Electrónico</span>
                    <a
                      href={`mailto:${user.email}`}
                      className="font-bold text-primary hover:underline text-xs sm:text-sm truncate max-w-[200px] sm:max-w-none"
                    >
                      {user.email}
                    </a>
                  </div>
                )}

                {user.healthSecurityEntity && (
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="font-semibold text-gray-500 text-xs">EPS / Entidad de Salud</span>
                    <span className="font-bold text-gray-800 text-xs sm:text-sm">{user.healthSecurityEntity}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1">
                  <span className="font-semibold text-gray-500 text-xs">Estado de Cuenta</span>
                  <span className="font-bold text-gray-800 text-xs sm:text-sm">
                    {user.state === UserState.ACTIVE
                      ? 'Activo'
                      : user.state === UserState.DISABLE || user.state === UserState.INACTIVE
                      ? 'Deshabilitado'
                      : user.state === UserState.DELETED
                      ? 'Eliminado'
                      : 'Pendiente de verificación'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tarjeta: Cuenta y Credenciales de Acceso */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <KeyRound size={16} />
                  </div>
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Cuenta y Credenciales de Acceso
                  </h3>
                </div>

                <Button
                  type="button"
                  variant={user.username ? 'default' : 'primary'}
                  onClick={() => setShowAccountModal(true)}
                  className="py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 shadow-2xs border border-gray-200"
                >
                  <KeyRound size={13} className={user.username ? 'text-gray-600' : 'text-white'} />{' '}
                  {user.username ? 'Actualizar Credenciales' : 'Crear Cuenta'}
                </Button>
              </div>

              {user.username ? (
                <div className="flex flex-col gap-y-2.5 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="font-semibold text-gray-500 text-xs">Nombre de Usuario</span>
                    <span className="font-mono font-bold text-primary text-xs sm:text-sm">
                      {user.username}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="font-semibold text-gray-500 text-xs">Estado de Acceso</span>
                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Credenciales activas
                    </span>
                  </div>

                  {user.email && (
                    <div className="flex justify-between items-center py-1">
                      <span className="font-semibold text-gray-500 text-xs">Correo de Inicio de Sesión</span>
                      <span className="font-medium text-gray-800 text-xs sm:text-sm">{user.email}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <KeyRound size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-amber-900">Usuario sin cuenta de acceso</p>
                      <p className="text-[11px] text-amber-700 mt-0.5 leading-snug">
                        Esta persona no tiene usuario ni contraseña asignados para iniciar sesión en la plataforma.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setShowAccountModal(true)}
                    className="py-1.5 px-3 text-xs font-bold shrink-0 self-end sm:self-center"
                  >
                    Crear Cuenta Ahora
                  </Button>
                </div>
              )}
            </div>

            {/* Tarjeta: Roles Asignados */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <ShieldCheck size={16} />
                      </div>
                      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                        Roles Asignados ({specialRoles.length})
                      </h3>
                    </div>

                    <Button
                      type="button"
                      variant="default"
                      onClick={() => setShowAssignRoleModal(true)}
                      className="py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 shadow-2xs border border-gray-200"
                    >
                      <ShieldPlus size={14} className="text-emerald-600" /> Asignar Rol
                    </Button>
                  </div>

                  {assignedRoles.length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-2xl text-center flex flex-col items-center">
                      <p className="text-xs text-gray-500 mb-3">
                        Este usuario no tiene ningún rol de sistema asignado actualmente.
                      </p>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => setShowAssignRoleModal(true)}
                        className="py-2 px-4 text-xs font-bold flex items-center gap-1.5"
                      >
                        <ShieldPlus size={15} /> Asignar Primer Rol
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {assignedRoles.map((role) => {
                        const isBaseUserRole = role === UserRole.USER || (role as string) === 'USER';
                        const meta = ALL_SYSTEM_ROLES_METADATA[role];
                        return (
                          <div
                            key={role}
                            className="p-3.5 rounded-2xl border border-gray-100 bg-slate-50/80 flex items-center justify-between gap-3 shadow-2xs hover:bg-slate-100/70 transition-colors"
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                                <CheckCircle2 size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-xs text-gray-900 truncate">
                                    {meta?.name || role}
                                  </span>
                                  <span className={clsx(
                                    "text-[9px] font-bold px-1.5 py-0.5 rounded-md border uppercase tracking-wider",
                                    isBaseUserRole
                                      ? "bg-slate-100 border-slate-200 text-slate-600"
                                      : role.startsWith('KID_')
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                      : "bg-white border-gray-200 text-gray-600"
                                  )}>
                                    {isBaseUserRole ? 'Rol Base' : role.startsWith('KID_') ? 'Voluntariado' : meta?.category || 'Sistema'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-snug">
                                  {isBaseUserRole
                                    ? 'Rol básico asignado por defecto a todos los miembros de la plataforma.'
                                    : role.startsWith('KID_')
                                    ? 'Permiso ministerial derivado automáticamente del Directorio de Voluntarios.'
                                    : meta?.description || 'Rol del sistema con permisos específicos'}
                                </p>
                              </div>
                            </div>

                            {/* Individual Delete Role Button (Desbloqueado solo para roles no básicos) */}
                            {!isBaseUserRole ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setRoleToDelete(role);
                                  setShowDeleteRoleModal(true);
                                }}
                                className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-rose-300 hover:bg-rose-50 text-gray-400 hover:text-rose-600 flex items-center justify-center transition-all shadow-2xs shrink-0 active:scale-95 cursor-pointer"
                                title={`Eliminar rol ${meta?.name || role}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            ) : (
                              <span
                                className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200/80 shrink-0 select-none"
                                title="El rol básico no puede eliminarse"
                              >
                                Por defecto
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

            {/* Tarjeta: Servicio Ministerial (Servidor) */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                    <Layers size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                    Servicio Ministerial ({activeUserVolunteer?.assignments?.length || 0})
                  </h3>
                </div>

                <Button
                  type="button"
                  variant="default"
                  onClick={() => setShowAssignMinistryModal(true)}
                  className="py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 shadow-2xs border border-gray-200"
                >
                  <Layers size={14} className="text-violet-600" /> Vincular a Ministerio
                </Button>
              </div>

              {loadingUserVolunteer ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  Cargando información de servicio ministerial...
                </div>
              ) : !activeUserVolunteer || !activeUserVolunteer.assignments || activeUserVolunteer.assignments.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl text-center flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mb-2">
                    <Award size={20} />
                  </div>
                  <h4 className="text-xs font-bold text-gray-800">Persona sin servicio ministerial</h4>
                  <p className="text-xs text-gray-500 max-w-sm mt-1 mb-3">
                    Esta persona no está vinculada como servidora activa en ningún ministerio o sede actualmente.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setShowAssignMinistryModal(true)}
                    className="py-2 px-4 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Award size={15} /> Habilitar como Servidor
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {activeUserVolunteer.assignments.map((asg) => {
                    const roleLabel =
                      asg.role === 'MINISTRY_GENERAL_COORDINATOR'
                        ? 'Coordinador General'
                        : asg.role === 'AREA_GENERAL_COORDINATOR'
                        ? 'Coordinador de Área'
                        : asg.role === 'GROUP_COORDINATOR'
                        ? 'Coordinador de Grupo'
                        : asg.role === 'SUPERVISOR'
                        ? 'Supervisor'
                        : 'Servidor';

                    // 1. Resolve Ministry
                    const resolvedMinistry =
                      asg.ministry ||
                      asg.ministryArea?.ministry ||
                      asg.ministryGroupConfig?.ministry ||
                      asg.serviceAreaGroup?.ministryArea?.ministry ||
                      (asg.ministryId ? ministriesMap.get(asg.ministryId) : undefined) ||
                      (asg.ministryArea?.ministryId ? ministriesMap.get(asg.ministryArea.ministryId) : undefined) ||
                      (asg.ministryGroupConfig?.ministryId ? ministriesMap.get(asg.ministryGroupConfig.ministryId) : undefined) ||
                      (asg.serviceAreaGroup?.ministryAreaId ? areasMap.get(asg.serviceAreaGroup.ministryAreaId)?.ministry : undefined);

                    const ministryName = resolvedMinistry?.name || asg.ministry?.name || 'Iglekids';

                    // 2. Resolve Campus Name
                    const resolvedCampusId =
                      asg.serviceAreaGroup?.churchCampusId ||
                      asg.serviceAreaGroup?.churchCampus?.id ||
                      resolvedMinistry?.churchCampusId ||
                      resolvedMinistry?.churchCampus?.id ||
                      asg.ministryArea?.churchCampusId ||
                      asg.ministryGroupConfig?.churchCampusId ||
                      asg.churchCampusId;

                    const campusName =
                      asg.serviceAreaGroup?.churchCampus?.name ||
                      resolvedMinistry?.churchCampus?.name ||
                      (resolvedCampusId ? campusesMap.get(resolvedCampusId)?.name : null) ||
                      null;

                    // 3. Resolve Area and Group names
                    const areaName =
                      asg.serviceAreaGroup?.ministryArea?.name ||
                      asg.ministryArea?.name ||
                      (asg.ministryAreaId ? areasMap.get(asg.ministryAreaId)?.name : null);

                    const groupName =
                      asg.serviceAreaGroup?.ministryGroupConfig?.name ||
                      asg.ministryGroupConfig?.name;

                    return (
                      <div
                        key={asg.id}
                        className="p-3.5 rounded-2xl border border-gray-100 bg-slate-50/80 flex items-center justify-between gap-3 shadow-2xs hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-violet-600 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                            <Award size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-gray-900 truncate">
                                {ministryName}
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border uppercase tracking-wider bg-violet-50 border-violet-200 text-violet-700">
                                {roleLabel}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-gray-500">
                              {campusName && (
                                <span className="flex items-center gap-0.5 font-medium text-gray-600">
                                  <MapPin size={11} className="text-gray-400" /> {campusName}
                                </span>
                              )}
                              {(areaName || groupName) && (
                                <span>
                                  {campusName ? '• ' : ''}{areaName || ''} {groupName ? `(${groupName})` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setAssignmentToDelete(asg);
                            setShowDeleteAssignmentModal(true);
                          }}
                          className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-rose-300 hover:bg-rose-50 text-gray-400 hover:text-rose-600 flex items-center justify-center transition-all shadow-2xs shrink-0 active:scale-95"
                          title="Eliminar asignación ministerial"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tarjeta: Permisos Temporales */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                    Permisos Temporales ({userPermissionGrants.length})
                  </h3>
                </div>

                <Button
                  type="button"
                  variant="default"
                  onClick={() => setShowGrantPermissionModal(true)}
                  className="py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 shadow-2xs border border-gray-200"
                >
                  <Clock size={14} className="text-amber-600" /> Conceder Permiso
                </Button>
              </div>

              {loadingUserPermissionGrants ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  Cargando permisos temporales...
                </div>
              ) : userPermissionGrants.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl text-center flex flex-col items-center">
                  <p className="text-xs text-gray-500 mb-3">
                    No se han concedido permisos temporales a este usuario.
                  </p>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => setShowGrantPermissionModal(true)}
                    className="py-2 px-4 text-xs font-bold flex items-center gap-1.5 border-dashed"
                  >
                    <Clock size={15} /> Otorgar Permiso Temporal
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {userPermissionGrants.map((grant) => {
                    const meta = ALL_SYSTEM_ROLES_METADATA[grant.permission as UserRole];
                    const isExpired = grant.expiresAt && dayjs(grant.expiresAt).isBefore(dayjs());

                    return (
                      <div
                        key={grant.id}
                        className={clsx(
                          'p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-2xs transition-colors',
                          isExpired
                            ? 'border-gray-200 bg-gray-50/70 opacity-75'
                            : 'border-amber-100 bg-amber-50/30 hover:bg-amber-50/50',
                        )}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className={clsx(
                              'w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs mt-0.5',
                              isExpired
                                ? 'bg-white border-gray-200 text-gray-400'
                                : 'bg-white border-amber-200 text-amber-600',
                            )}
                          >
                            <Clock size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-gray-900 truncate">
                                {meta?.name || grant.permission}
                              </span>
                              <span
                                className={clsx(
                                  'text-[9px] font-bold px-1.5 py-0.5 rounded-md border uppercase tracking-wider',
                                  isExpired
                                    ? 'bg-gray-100 text-gray-600 border-gray-200'
                                    : 'bg-amber-100 text-amber-800 border-amber-200',
                                )}
                              >
                                {isExpired ? 'Expirado' : 'Temporal'}
                              </span>
                            </div>

                            {grant.reason && (
                              <p className="text-[11px] text-gray-600 italic mt-0.5 leading-snug">
                                &ldquo;{grant.reason}&rdquo;
                              </p>
                            )}

                            <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[10px] text-gray-500">
                              <span
                                className={clsx(
                                  'font-semibold',
                                  isExpired ? 'text-gray-500' : 'text-amber-700',
                                )}
                              >
                                {grant.expiresAt
                                  ? isExpired
                                    ? `Expiró el ${dayjs(grant.expiresAt).format('DD/MM/YYYY hh:mm A')}`
                                    : `Vence el ${dayjs(grant.expiresAt).format('DD/MM/YYYY hh:mm A')}`
                                  : 'Sin fecha de expiración'}
                              </span>
                              {grant.grantedByUser && (
                                <span>
                                  • Otorgado por:{' '}
                                  <span className="font-medium">
                                    {grant.grantedByUser.firstName} {grant.grantedByUser.lastName}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setGrantToRevoke(grant);
                            setShowRevokeGrantModal(true);
                          }}
                          className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-rose-300 hover:bg-rose-50 text-gray-400 hover:text-rose-600 flex items-center justify-center transition-all shadow-2xs shrink-0 active:scale-95"
                          title="Revocar permiso temporal"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Assign User to Ministry Modal */}
      <AssignUserMinistryModal
        open={showAssignMinistryModal}
        onClose={() => setShowAssignMinistryModal(false)}
        user={user}
        existingVolunteer={activeUserVolunteer}
        onSuccess={() => {
          if (user?.id) {
            dispatch(GetVolunteerByUserId({ userId: user.id }));
          }
        }}
      />

      {/* Grant Temporary Permission Modal */}
      <GrantTemporaryPermissionModal
        open={showGrantPermissionModal}
        onClose={() => setShowGrantPermissionModal(false)}
        user={user}
        onSuccess={() => {
          if (user?.id) {
            dispatch(GetUserPermissionGrants({ userId: user.id }));
          }
        }}
      />

      {/* Confirm Delete Volunteer Assignment */}
      <ConfirmModal
        open={showDeleteAssignmentModal}
        onOpenChange={setShowDeleteAssignmentModal}
        title="¿Eliminar asignación ministerial?"
        description={`¿Estás seguro de que deseas eliminar esta asignación de servicio para ${user?.firstName || ''} ${user?.lastName || ''}? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar asignación"
        cancelText="Cancelar"
        type="danger"
        onConfirm={handleConfirmDeleteAssignment}
      />

      {/* Confirm Revoke Temporary Permission Grant */}
      <ConfirmModal
        open={showRevokeGrantModal}
        onOpenChange={setShowRevokeGrantModal}
        title="¿Revocar permiso temporal?"
        description={`¿Estás seguro de que deseas revocar inmediatamente este permiso temporal concedido a ${user?.firstName || ''} ${user?.lastName || ''}? Perderá los accesos asociados de inmediato.`}
        confirmText="Sí, revocar permiso"
        cancelText="Cancelar"
        type="danger"
        onConfirm={handleConfirmRevokeGrant}
      />

      {/* Role Assignment Modal */}
      <AssignUserRoleModal
        open={showAssignRoleModal}
        onClose={() => setShowAssignRoleModal(false)}
        user={user}
        onSuccess={() => {
          if (id) {
            dispatch(GetUser({ id }));
          }
        }}
      />

      {/* User Account / Credentials Modal */}
      <UserAccountModal
        open={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        user={user}
        onSuccess={() => {
          if (id) {
            dispatch(GetUser({ id }));
          }
        }}
      />

      {/* Confirmation Modal for Role Deletion */}
      <ConfirmModal
        open={showDeleteRoleModal}
        onOpenChange={setShowDeleteRoleModal}
        title={`¿Eliminar rol "${roleToDeleteMeta?.name || roleToDelete}"?`}
        description={`¿Estás seguro de que deseas revocar el rol "${roleToDeleteMeta?.name || roleToDelete}" a ${user?.firstName || ''} ${user?.lastName || ''}? El usuario perderá de inmediato los accesos y permisos asociados a este rol en la plataforma.`}
        confirmText="Sí, eliminar rol"
        cancelText="Cancelar"
        type="danger"
        onConfirm={handleConfirmDeleteRole}
      />

      {/* Photo Preview Modal */}
      {showPhotoModal && user?.photoUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowPhotoModal(false)}
        >
          <div className="relative max-w-sm w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowPhotoModal(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors z-10"
            >
              <X size={18} />
            </button>
            <div className="w-64 h-64 rounded-2xl overflow-hidden mb-3 border border-gray-100 shadow-inner">
              <img src={user.photoUrl} alt="Foto completa" className="w-full h-full object-cover" />
            </div>
            <h4 className="font-black text-gray-900 text-base text-center">
              {user.firstName} {user.lastName}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              {user.nationalIdType || 'CC'}: {user.nationalId}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetailView;
