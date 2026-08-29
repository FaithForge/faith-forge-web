import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { X, ShieldPlus, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import { AssignUserRole } from '@/libs/state/redux/thunks/user/user.thunk';
import { IUser } from '@/libs/models';
import { UserRole, ALL_SYSTEM_ROLES_METADATA } from '@/libs/utils/auth';
import SelectSearch from '@/components/ui/SelectSearch';
import Button from '@/components/ui/Button';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';

interface AssignUserRoleModalProps {
  open: boolean;
  onClose: () => void;
  user: Partial<IUser> | IUser | null | undefined;
  onSuccess?: (assignedRole: UserRole) => void;
}

/**
 * Modal Drawer for assigning a new role to a user.
 * Dispatches AssignUserRole (POST /user/assign-role).
 *
 * @param {AssignUserRoleModalProps} props - Component properties.
 * @returns {JSX.Element} Rendered drawer component.
 */
export const AssignUserRoleModal: React.FC<AssignUserRoleModalProps> = ({
  open,
  onClose,
  user,
  onSuccess,
}) => {
  useModalBackClose(open, onClose);
  const dispatch = useAppDispatch();

  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Reset state when opening modal
  useEffect(() => {
    if (open) {
      setSelectedRole('');
      setIsAssigning(false);
    }
  }, [open]);

  // Roles available for assignment (excluding KID and already assigned roles)
  const availableRoles = Object.values(UserRole)
    .filter((role) => role !== UserRole.KID)
    .filter((role) => !user?.roles?.includes(role))
    .map((role) => {
      const meta = ALL_SYSTEM_ROLES_METADATA[role];
      return {
        id: role,
        name: meta ? `${meta.name} (${meta.category})` : role,
      };
    });

  const selectedRoleMeta = selectedRole ? ALL_SYSTEM_ROLES_METADATA[selectedRole as UserRole] : null;

  /**
   * Handles submitting the role assignment.
   *
   * @param {React.FormEvent} e - Form event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error('No se ha especificado un usuario válido');
      return;
    }

    if (!selectedRole) {
      toast.error('Por favor, selecciona un rol para asignar');
      return;
    }

    const roleToAssign = selectedRole as UserRole;
    setIsAssigning(true);

    try {
      await dispatch(
        AssignUserRole({
          userId: user.id,
          userRole: roleToAssign,
        })
      ).unwrap();

      const roleName = ALL_SYSTEM_ROLES_METADATA[roleToAssign]?.name || roleToAssign;
      toast.success(`¡Rol "${roleName}" asignado con éxito!`);
      onSuccess?.(roleToAssign);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || err?.error || 'Error al asignar el rol al usuario');
    } finally {
      setIsAssigning(false);
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
              Asignar Nuevo Rol
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
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-gray-900 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.nationalIdType || 'CC'}: {user.nationalId || 'Sin documento'} • Roles activos:{' '}
                    <span className="font-bold text-gray-700">{user.roles?.length || 0}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Check if user already has all roles */}
            {availableRoles.length === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-center text-xs font-semibold">
                ✨ Este usuario ya cuenta con todos los roles disponibles en la plataforma.
              </div>
            ) : (
              <>
                {/* Role Selector */}
                <SelectSearch
                  label="Seleccionar Rol a Asignar"
                  required
                  value={selectedRole}
                  onChange={(val) => setSelectedRole(val)}
                  options={availableRoles}
                  placeholder="Selecciona el rol..."
                  searchable={true}
                />

                {/* Selected Role Preview Info */}
                {selectedRoleMeta && (
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{selectedRoleMeta.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                          {selectedRoleMeta.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {selectedRoleMeta.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit Action Button */}
                <Button
                  type="submit"
                  block
                  variant="primary"
                  loading={isAssigning}
                  loadingText="Asignando Rol..."
                  disabled={!selectedRole || isAssigning}
                  className="mt-2 py-3 font-bold text-sm flex items-center justify-center gap-2"
                >
                  <ShieldPlus size={18} /> Asignar Rol
                </Button>
              </>
            )}
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default AssignUserRoleModal;
