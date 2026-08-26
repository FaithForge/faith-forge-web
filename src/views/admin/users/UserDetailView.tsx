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
  UserCheck
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { toast } from 'sonner';
import clsx from 'clsx';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { KidCheckInSkeleton } from '@/components/ui/DetailSkeleton';
import AssignUserRoleModal from '@/components/modal/AssignUserRoleModal';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetUser, UnassignUserRole } from '@/libs/state/redux/thunks/user/user.thunk';
import { APP_ROUTES } from '@/config/routes';
import { capitalizeWords } from '@/libs/utils/text';
import { UserRole, ALL_SYSTEM_ROLES_METADATA } from '@/libs/utils/auth';
import { UserGenderCode, UserState, ID_TYPE_CODE_MAPPER } from '@/libs/models';

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
  const [roleToDelete, setRoleToDelete] = useState<UserRole | null>(null);
  const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(false);
  const [isDeletingRole, setIsDeletingRole] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  // Reset image error state when photo changes
  useEffect(() => {
    setImageError(false);
  }, [user?.photoUrl]);

  // Calculate formatted age if birthday exists
  const formattedAge = useMemo(() => {
    if (user?.birthday) {
      const birth = dayjs(user.birthday);
      if (birth.isValid()) {
        const years = dayjs().diff(birth, 'year');
        return `${years} ${years === 1 ? 'año' : 'años'}`;
      }
    }
    return '';
  }, [user?.birthday]);

  const assignedRoles = user?.roles || [];

  /**
   * Confirms and dispatches the unassignment of a specific role.
   */
  const handleConfirmDeleteRole = async () => {
    if (!user?.id || !roleToDelete) return;

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
    } catch (err: any) {
      toast.error(err?.message || err?.error || 'Error al eliminar el rol del usuario');
    } finally {
      setIsDeletingRole(false);
    }
  };

  const roleToDeleteMeta = roleToDelete ? ALL_SYSTEM_ROLES_METADATA[roleToDelete] : null;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
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
                          : user.state === UserState.DISABLE
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      )}
                    >
                      {user.state === UserState.ACTIVE
                        ? 'Activo'
                        : user.state === UserState.DISABLE
                        ? 'Deshabilitado'
                        : 'Verificación Pendiente'}
                    </span>

                    <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 flex items-center gap-1">
                      <ShieldCheck size={13} /> {assignedRoles.length}{' '}
                      {assignedRoles.length === 1 ? 'rol' : 'roles'}
                    </span>

                    {user.username && (
                      <span className="px-2.5 py-0.5 text-xs font-bold font-mono bg-primary/10 text-primary rounded-full border border-primary/20">
                        @{user.username}
                      </span>
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
                      {dayjs(user.birthday).format('D [de] MMMM [de] YYYY')}
                      {formattedAge ? ` (${formattedAge})` : ''}
                    </span>
                  </div>
                )}

                {user.phone && (
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="font-semibold text-gray-500 text-xs">Teléfono / Celular</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800 text-xs sm:text-sm">
                        {user.dialCodePhone || '+57'} {user.phone}
                      </span>
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
                      : user.state === UserState.DISABLE
                      ? 'Deshabilitado'
                      : 'Pendiente de verificación'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tarjeta: Roles Asignados */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ShieldCheck size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                    Roles Asignados ({assignedRoles.length})
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
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600 uppercase tracking-wider">
                                {meta?.category || 'Rol'}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-snug">
                              {meta?.description || 'Rol del sistema con permisos específicos'}
                            </p>
                          </div>
                        </div>

                        {/* Individual Delete Role Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setRoleToDelete(role);
                            setShowDeleteRoleModal(true);
                          }}
                          className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-rose-300 hover:bg-rose-50 text-gray-400 hover:text-rose-600 flex items-center justify-center transition-all shadow-2xs shrink-0 active:scale-95"
                          title={`Eliminar rol ${meta?.name || role}`}
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

      {/* Role Assignment Modal */}
      <AssignUserRoleModal
        open={showAssignRoleModal}
        onClose={() => setShowAssignRoleModal(false)}
        user={user}
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
