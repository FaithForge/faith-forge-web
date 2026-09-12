import React, { useState, useEffect, useMemo } from 'react';
import AppDrawer from '@/components/ui/AppDrawer';
import { Clock, ShieldAlert, X, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import { CreateVolunteerPermissionGrant } from '@/libs/state/redux/thunks/church/volunteer.thunk';
import { IUser } from '@/libs/models';
import {
  UserRole,
  ALL_SYSTEM_ROLES_METADATA,
  MINISTRY_ROLE_GROUPS,
} from '@/libs/utils/auth';
import SelectSearch from '@/components/ui/SelectSearch';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import clsx from 'clsx';

interface GrantTemporaryPermissionModalProps {
  open: boolean;
  onClose: () => void;
  user: Partial<IUser> | IUser | null | undefined;
  onSuccess?: () => void;
}

type DurationPreset = '24_HOURS' | 'WEEKEND' | '7_DAYS' | '30_DAYS' | 'CUSTOM';

const PRESETS: Array<{ id: DurationPreset; label: string; description: string }> = [
  { id: '24_HOURS', label: '24 Horas', description: 'Vence exactamente en un día' },
  { id: 'WEEKEND', label: 'Fin de Semana', description: 'Hasta el domingo a las 11:59 PM' },
  { id: '7_DAYS', label: '7 Días', description: 'Vence en una semana' },
  { id: '30_DAYS', label: '30 Días', description: 'Vence en un mes' },
  { id: 'CUSTOM', label: 'Personalizado', description: 'Elegir fecha y hora específica' },
];

/**
 * Modal drawer for granting a time-based temporary permission or system role to a user.
 *
 * @param {GrantTemporaryPermissionModalProps} props - Component properties.
 * @returns {JSX.Element} Rendered drawer component.
 */
export const GrantTemporaryPermissionModal: React.FC<GrantTemporaryPermissionModalProps> = ({
  open,
  onClose,
  user,
  onSuccess,
}) => {
  useModalBackClose(open, onClose);
  const dispatch = useAppDispatch();
  const churchId = import.meta.env.VITE_CHURCH_ID;

  const [selectedMinistry, setSelectedMinistry] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<DurationPreset>('24_HOURS');
  const [customExpiresAt, setCustomExpiresAt] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedMinistry('ALL');
      setSelectedRole('');
      setSelectedPreset('24_HOURS');
      setCustomExpiresAt(dayjs().add(2, 'day').format('YYYY-MM-DDTHH:mm'));
      setReason('');
      setIsSubmitting(false);
    }
  }, [open]);

  // Roles available for temporary grants based on selected ministry
  const filteredRoles: UserRole[] = useMemo(() => {
    if (selectedMinistry === 'ALL') {
      return MINISTRY_ROLE_GROUPS.flatMap((g) => g.roles);
    }
    const group = MINISTRY_ROLE_GROUPS.find((g) => g.id === selectedMinistry);
    return group ? group.roles : [];
  }, [selectedMinistry]);

  const roleOptions = useMemo(
    () =>
      filteredRoles.map((role) => {
        const meta = ALL_SYSTEM_ROLES_METADATA[role];
        return {
          id: role,
          name: meta ? `${meta.name} (${meta.category})` : role,
        };
      }),
    [filteredRoles],
  );

  const selectedRoleMeta = selectedRole
    ? ALL_SYSTEM_ROLES_METADATA[selectedRole as UserRole]
    : null;

  /**
   * Computes the expiration ISO timestamp based on preset or custom input.
   */
  const calculateExpirationDate = (): string => {
    const now = dayjs();
    switch (selectedPreset) {
      case '24_HOURS':
        return now.add(24, 'hour').toISOString();
      case 'WEEKEND': {
        // Calculate coming Sunday at 23:59:59
        const dayOfWeek = now.day(); // 0 is Sunday
        const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        return now.add(daysUntilSunday, 'day').hour(23).minute(59).second(59).toISOString();
      }
      case '7_DAYS':
        return now.add(7, 'day').toISOString();
      case '30_DAYS':
        return now.add(30, 'day').toISOString();
      case 'CUSTOM':
        return customExpiresAt ? dayjs(customExpiresAt).toISOString() : now.add(1, 'day').toISOString();
      default:
        return now.add(24, 'hour').toISOString();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error('No se ha especificado un usuario válido');
      return;
    }

    if (!selectedRole) {
      toast.error('Por favor, selecciona un rol o permiso');
      return;
    }

    if (!reason.trim()) {
      toast.error('Por favor, ingresa el motivo o justificación del permiso');
      return;
    }

    const expiresAt = calculateExpirationDate();

    setIsSubmitting(true);
    try {
      await dispatch(
        CreateVolunteerPermissionGrant({
          userId: user.id,
          churchId,
          permission: selectedRole,
          reason: reason.trim(),
          expiresAt,
        }),
      ).unwrap();

      const roleName = ALL_SYSTEM_ROLES_METADATA[selectedRole as UserRole]?.name || selectedRole;
      toast.success(`¡Permiso temporal "${roleName}" otorgado con éxito!`);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || err?.error || 'Error al conceder el permiso temporal');
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
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">
                Conceder Permiso Temporal
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Para:{' '}
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
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5">
            <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed">
              Los permisos temporales otorgan acceso temporal a funciones del sistema y se revocarán
              automáticamente al expirar el tiempo establecido.
            </p>
          </div>

          {/* Filtro por Ministerio / Módulo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700">
              Ministerio / Módulo
            </label>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedMinistry('ALL')}
                className={clsx(
                  'flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer',
                  selectedMinistry === 'ALL'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800'
                )}
              >
                Todos
              </button>
              {MINISTRY_ROLE_GROUPS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setSelectedMinistry(g.id);
                    if (selectedRole && !g.roles.includes(selectedRole as UserRole)) {
                      setSelectedRole('');
                    }
                  }}
                  className={clsx(
                    'flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer',
                    selectedMinistry === g.id
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-800'
                  )}
                >
                  {g.label === 'Administración General' ? 'General' : g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Role selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700">
              Rol / Permiso a Otorgar <span className="text-rose-500">*</span>
            </label>
            <SelectSearch
              label="Rol / Permiso Temporal"
              options={roleOptions}
              value={selectedRole}
              onChange={setSelectedRole}
              placeholder="Selecciona el rol o permiso temporal..."
            />
            {selectedRoleMeta && (
              <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                {selectedRoleMeta.description}
              </p>
            )}
          </div>

          {/* Expiration Preset Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700">
              Duración del Permiso <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPreset(preset.id)}
                  className={clsx(
                    'p-2.5 text-left rounded-xl border transition-all text-xs flex flex-col justify-between',
                    selectedPreset === preset.id
                      ? 'border-primary bg-primary/5 text-primary font-bold shadow-2xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                  )}
                >
                  <span className="font-bold">{preset.label}</span>
                  <span className="text-[10px] text-gray-500 font-normal mt-0.5">
                    {preset.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Input */}
          {selectedPreset === 'CUSTOM' && (
            <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Calendar size={13} className="text-primary" /> Fecha y Hora de Expiración
              </label>
              <Input
                type="datetime-local"
                value={customExpiresAt}
                onChange={(e) => setCustomExpiresAt(e.target.value)}
                className="bg-white text-xs"
              />
            </div>
          )}

          {/* Reason */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700">
              Motivo / Justificación <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Reemplazo de coordinador de área durante retiro pastoral este fin de semana..."
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400 resize-none"
            />
          </div>

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
              disabled={isSubmitting || !selectedRole || !reason.trim()}
              loading={isSubmitting}
              className="flex-1 py-2 text-xs font-bold shadow-xs"
            >
              Conceder Permiso
            </Button>
          </div>
        </form>
      </div>
    </AppDrawer>
  );
};

export default GrantTemporaryPermissionModal;
