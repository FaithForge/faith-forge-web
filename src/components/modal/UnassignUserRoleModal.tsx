import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { X, ShieldAlert, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import { UnassignUserRole } from '@/libs/state/redux/thunks/user/user.thunk';
import { IUser } from '@/libs/models';
import { UserRole, ALL_SYSTEM_ROLES_METADATA } from '@/libs/utils/auth';
import Button from '@/components/ui/Button';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';

interface UnassignUserRoleModalProps {
  open: boolean;
  onClose: () => void;
  user: Partial<IUser> | IUser | null | undefined;
  onSuccess?: (unassignedRole: UserRole) => void;
}

/**
 * Modal Drawer for removing/unassigning an existing role from a user.
 * Dispatches UnassignUserRole (DELETE /user/unassign-role).
 *
 * @param {UnassignUserRoleModalProps} props - Component properties.
 * @returns {JSX.Element} Rendered drawer component.
 */
export const UnassignUserRoleModal: React.FC<UnassignUserRoleModalProps> = ({
  open,
  onClose,
  user,
  onSuccess,
}) => {
  useModalBackClose(open, onClose);
  const dispatch = useAppDispatch();

  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset selected role on open
  useEffect(() => {
    if (open) {
      setSelectedRole('');
      setIsDeleting(false);
    }
  }, [open]);

  const userRoles = user?.roles || [];

  /**
   * Handles submitting role deletion / unassignment.
   *
   * @param {React.FormEvent} e - Form submit event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error('No se ha especificado un usuario válido');
      return;
    }

    if (!selectedRole) {
      toast.error('Por favor, selecciona el rol que deseas eliminar');
      return;
    }

    setIsDeleting(true);

    try {
      await dispatch(
        UnassignUserRole({
          userId: user.id,
          userRole: selectedRole,
        })
      ).unwrap();

      const roleName = ALL_SYSTEM_ROLES_METADATA[selectedRole]?.name || selectedRole;
      toast.success(`¡Rol "${roleName}" eliminado con éxito!`);
      onSuccess?.(selectedRole);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || err?.error || 'Error al eliminar el rol del usuario');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Drawer.Root handleOnly repositionInputs={false} open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/50 z-[300]" />
        <Drawer.Content
          className="bg-surface flex flex-col rounded-t-[24px] fixed bottom-0 left-0 right-0 z-[301] max-h-[90dvh] outline-none"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="w-full bg-white rounded-t-[24px] border-b border-gray-100 shadow-xs z-10 flex items-center justify-between px-4 py-3.5 shrink-0 sticky top-0">
            <div className="w-8 shrink-0" />
            <Drawer.Title className="font-bold text-gray-800 text-base flex-1 text-center truncate px-2">
              Eliminar Rol Asignado
            </Drawer.Title>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 active:scale-95 transition-all shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto overscroll-contain flex-1 min-h-0 flex flex-col gap-4 pb-12">
            {/* User Target Header */}
            {user && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-gray-900 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.nationalIdType || 'CC'}: {user.nationalId || 'Sin documento'} • Roles asignados:{' '}
                    <span className="font-bold text-gray-700">{userRoles.length}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Check if user has zero roles */}
            {userRoles.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-center text-xs font-semibold">
                Este usuario no tiene ningún rol asignado actualmente para eliminar.
              </div>
            ) : (
              <>
                {/* Warning note */}
                <div className="bg-rose-50/80 border border-rose-200 text-rose-900 p-3.5 rounded-2xl flex items-start gap-3 text-xs leading-relaxed">
                  <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <p>
                    Selecciona el rol que deseas revocar. El usuario perderá de inmediato los accesos y permisos asociados a este rol en la plataforma.
                  </p>
                </div>

                {/* List of roles to select for deletion */}
                <div className="flex flex-col gap-2.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Selecciona el rol a eliminar <span className="text-red-500">*</span>
                  </label>

                  {userRoles.map((role) => {
                    const meta = ALL_SYSTEM_ROLES_METADATA[role];
                    const isSelected = selectedRole === role;

                    return (
                      <label
                        key={role}
                        className={clsx(
                          'flex items-start gap-3.5 p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 select-none',
                          isSelected
                            ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                            : 'border-gray-200 bg-white hover:bg-gray-50/80'
                        )}
                      >
                        <input
                          type="radio"
                          name="roleToDelete"
                          value={role}
                          checked={isSelected}
                          onChange={() => setSelectedRole(role)}
                          className="mt-0.5 w-4 h-4 text-rose-600 focus:ring-rose-500 border-gray-300 shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={clsx('font-bold text-sm', isSelected ? 'text-rose-900' : 'text-gray-900')}>
                              {meta?.name || role}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase">
                              {meta?.category || 'Sistema'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {meta?.description || 'Sin descripción disponible'}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  block
                  variant="danger"
                  loading={isDeleting}
                  loadingText="Eliminando Rol..."
                  disabled={!selectedRole || isDeleting}
                  className="mt-2 py-3 font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} /> Confirmar y Eliminar Rol
                </Button>
              </>
            )}
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default UnassignUserRoleModal;
