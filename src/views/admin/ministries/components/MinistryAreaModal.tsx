import React, { useEffect, useState } from 'react';
import AppDrawer from '@/components/ui/AppDrawer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { IKidGroup, IMinistryArea, MinistryAreaScope } from '@/libs/models';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import {
  CreateMinistryArea,
  UpdateMinistryArea,
} from '@/libs/state/redux/thunks/church/ministry.thunk';
import { GetKidGroups } from '@/libs/state/redux/thunks/kid-church/kid-group.thunk';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { toast } from 'sonner';
import { Layers, Sparkles, Check, Shield } from 'lucide-react';
import clsx from 'clsx';

interface MinistryAreaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministryId: string;
  areaToEdit?: IMinistryArea | null;
  onSuccess?: () => void;
}

/**
 * Drawer modal to create or edit a Service Area inside a Ministry.
 * Allows associating Iglekids classrooms (kid groups) with the area.
 *
 * @param {MinistryAreaModalProps} props - Component properties.
 * @returns {JSX.Element} The rendered modal drawer.
 */
export const MinistryAreaModal: React.FC<MinistryAreaModalProps> = ({
  open,
  onOpenChange,
  ministryId,
  areaToEdit,
  onSuccess,
}) => {
  useModalBackClose(open, () => onOpenChange(false));

  const dispatch = useAppDispatch();
  const { loadingAction } = useAppSelector((state) => state.ministrySlice);
  const availableKidGroups = useAppSelector((state) => state.kidGroupSlice.data);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<MinistryAreaScope | null>(null);
  const [active, setActive] = useState(true);
  const [selectedKidGroupIds, setSelectedKidGroupIds] = useState<string[]>([]);
  const [nameError, setNameError] = useState('');

  const isEditing = Boolean(areaToEdit);

  // Load classrooms master catalog if empty
  useEffect(() => {
    if (open && (!availableKidGroups || availableKidGroups.length === 0)) {
      dispatch(GetKidGroups({ force: false }));
    }
  }, [open, availableKidGroups, dispatch]);

  useEffect(() => {
    if (open) {
      if (areaToEdit) {
        setName(areaToEdit.name);
        setDescription(areaToEdit.description || '');
        setScope(areaToEdit.scope || null);
        setActive(areaToEdit.active);

        // Pre-populate already assigned classrooms strictly matching valid availableKidGroups
        const validGroupIds = new Set((availableKidGroups || []).map((g) => g.id));
        const resolvedIds: string[] = [];

        // 1. Check direct kidGroupId
        if (areaToEdit.kidGroupId && (validGroupIds.size === 0 || validGroupIds.has(areaToEdit.kidGroupId))) {
          resolvedIds.push(areaToEdit.kidGroupId);
        }

        // 2. Check kidGroups relations array (kg.kidGroupId is the classroom ID)
        if (Array.isArray(areaToEdit.kidGroups)) {
          areaToEdit.kidGroups.forEach((kg: any) => {
            const id =
              kg.kidGroupId && (validGroupIds.size === 0 || validGroupIds.has(kg.kidGroupId))
                ? kg.kidGroupId
                : validGroupIds.has(kg.id)
                  ? kg.id
                  : null;
            if (id && !resolvedIds.includes(id)) {
              resolvedIds.push(id);
            }
          });
        }

        // 3. Check kidGroupIds array
        if (Array.isArray(areaToEdit.kidGroupIds)) {
          areaToEdit.kidGroupIds.forEach((id) => {
            if ((validGroupIds.size === 0 || validGroupIds.has(id)) && !resolvedIds.includes(id)) {
              resolvedIds.push(id);
            }
          });
        }

        setSelectedKidGroupIds(resolvedIds);
      } else {
        setName('');
        setDescription('');
        setScope(null);
        setActive(true);
        setSelectedKidGroupIds([]);
      }
      setNameError('');
    }
  }, [open, areaToEdit, availableKidGroups]);

  const toggleKidGroupSelection = (groupId: string) => {
    setSelectedKidGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('El nombre del área es requerido');
      return;
    }

    try {
      const primaryKidGroupId = selectedKidGroupIds[0] || undefined;
      const kidGroupIdsPayload = selectedKidGroupIds.length > 0 ? selectedKidGroupIds : undefined;

      if (isEditing && areaToEdit) {
        await dispatch(
          UpdateMinistryArea({
            id: areaToEdit.id,
            ministryId,
            name: name.trim(),
            description: description.trim() || undefined,
            scope: scope ?? null,
            active,
            kidGroupId: primaryKidGroupId,
            kidGroupIds: kidGroupIdsPayload,
          }),
        ).unwrap();
      } else {
        await dispatch(
          CreateMinistryArea({
            ministryId,
            name: name.trim(),
            description: description.trim() || undefined,
            scope: scope ?? undefined,
            kidGroupId: primaryKidGroupId,
            kidGroupIds: kidGroupIdsPayload,
          }),
        ).unwrap();
      }

      toast.success(
        isEditing
          ? 'Área de servicio actualizada correctamente'
          : 'Área de servicio creada con éxito',
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const errMsg = typeof err === 'string' ? err : 'Error al guardar el área de servicio';
      toast.error(errMsg);
    }
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Área de Servicio' : 'Nueva Área de Servicio'}
      icon={<Layers className="text-primary" size={20} />}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Nombre del Área <span className="text-rose-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError('');
            }}
            placeholder="Ej. Regikids, SaludKids, Alabanza Kids, Zaqueos..."
            error={nameError}
            autoFocus
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Descripción (opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles sobre las responsabilidades de esta área..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
          />
        </div>

        {/* Functional Scope (Permissions) Selector */}
        <div className="flex flex-col gap-1.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <Shield size={14} className="text-primary" />
              Alcance Ministerial / Permisos del Sistema
            </label>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed mb-1">
            Determina qué permisos y módulos (Regikids, Iglekids, etc.) recibirán automáticamente los voluntarios asignados a esta área (Coordinadores, Supervisores y Maestros).
          </p>

          <div className="grid grid-cols-1 gap-2 pt-1">
            {[
              {
                id: null,
                label: 'Sin alcance específico (General)',
                desc: 'Área estándar sin permisos automáticos de módulos infantiles.',
                badge: 'General',
              },
              {
                id: MinistryAreaScope.KID_REGISTRATION,
                label: 'Registro y Check-in de Niños (Regikids)',
                desc: 'Otorga permisos de Check-in, escáner QR y creación de niños.',
                badge: 'Regikids',
              },
              {
                id: MinistryAreaScope.KID_GROUP_MANAGEMENT,
                label: 'Gestión de Salones y Asistencia (Iglekids)',
                desc: 'Otorga permisos de pase de lista en salones y reporte de asistencia.',
                badge: 'Iglekids',
              },
            ].map((option) => {
              const isSelected = scope === option.id;
              return (
                <div
                  key={option.id ?? 'none'}
                  onClick={() => setScope(option.id as any)}
                  className={clsx(
                    'p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 select-none',
                    isSelected
                      ? 'bg-primary/5 border-primary shadow-2xs'
                      : 'bg-white border-gray-200 hover:border-gray-300',
                  )}
                >
                  <div
                    className={clsx(
                      'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all',
                      isSelected ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white',
                    )}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={clsx('text-xs font-bold', isSelected ? 'text-primary' : 'text-gray-900')}>
                        {option.label}
                      </p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-gray-600">
                        {option.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{option.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Classrooms Association Section (POST /ministry-area/:id/kid-groups) */}
        {availableKidGroups && availableKidGroups.length > 0 && (
          <div className="flex flex-col gap-1.5 p-3 bg-slate-50 border border-gray-100 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Sparkles size={13} className="text-primary" />
                Salones de Iglekids Asociados (Opcional)
              </label>
              <span className="text-[10px] text-gray-500 font-medium">
                {selectedKidGroupIds.length} seleccionado(s)
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mb-1">
              Asocia el o los salones correspondientes para vincular supervisores y asistencia.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {availableKidGroups.map((group: IKidGroup) => {
                const isSelected = selectedKidGroupIds.includes(group.id);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleKidGroupSelection(group.id)}
                    className={clsx(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none',
                      isSelected
                        ? 'bg-primary text-white shadow-2xs'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-slate-100',
                    )}
                  >
                    {isSelected && <Check size={12} className="stroke-[3]" />}
                    <span>{group.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isEditing && (
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-gray-100 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-800">Estado del Área</p>
              <p className="text-xs text-gray-500">
                {active ? 'Activa para asignaciones' : 'Inactiva temporalmente'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        )}

        <div className="pt-2 flex gap-3">
          <Button
            type="button"
            variant="default"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={loadingAction}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            loading={loadingAction}
            loadingText="Guardando..."
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Área'}
          </Button>
        </div>
      </form>
    </AppDrawer>
  );
};

export default MinistryAreaModal;
