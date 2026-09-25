import React, { useState, useEffect } from 'react';
import AppDrawer from '@/components/ui/AppDrawer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  CHURCH_TERMINOLOGY_FIELDS,
  KIDS_TERMINOLOGY_FIELDS,
} from '@/libs/constants/defaultTerminology';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetChurchById, UpdateChurch } from '@/libs/state/redux/thunks/church/church.thunk';
import { MinistryType } from '@/libs/models';
import { toast } from 'sonner';
import {
  Church,
  Sparkles,
  RotateCcw,
  Save,
  Loader2,
  CalendarClock,
  MapPin,
  Users,
  Layers,
  ShieldCheck,
  BookOpen,
  HeartHandshake,
  School,
  UserCheck,
  Compass,
  LucideIcon,
} from 'lucide-react';
import { FaChild } from 'react-icons/fa6';
import clsx from 'clsx';

interface TerminologyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FIELD_ICONS: Record<string, LucideIcon | React.ComponentType<{ size?: number; className?: string }>> = {
  meeting: CalendarClock,
  campus: MapPin,
  volunteer: Users,
  coordinator: UserCheck,
  supervisor: Compass,
  small_group: Sparkles,
  module_alias: Layers,
  registration: ShieldCheck,
  teacher: BookOpen,
  guardian: HeartHandshake,
  classroom: School,
  service_group: Users,
};

/**
 * Drawer para personalizar la terminología institucional de la iglesia y del ministerio infantil.
 * Utiliza los tokens de diseño estándar de Faith Forge con botones inmunes a captura táctil de Vaul.
 *
 * @param {TerminologyDrawerProps} props - Propiedades del componente.
 * @returns {JSX.Element} Drawer renderizado.
 */
export const TerminologyDrawer: React.FC<TerminologyDrawerProps> = ({
  open,
  onOpenChange,
}) => {
  const dispatch = useAppDispatch();

  const church = useAppSelector((state) => state.churchCampusSlice.church);
  const stateChurchOverrides = useAppSelector(
    (state) => state.churchCampusSlice.churchTerminologyOverrides,
  );
  const stateMinistryOverrides = useAppSelector(
    (state) => state.churchCampusSlice.ministryTerminologyOverrides,
  );

  const [activeTab, setActiveTab] = useState<'church' | 'kids'>('church');
  const [churchTerms, setChurchTerms] = useState<Record<string, string>>({});
  const [kidsTerms, setKidsTerms] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetChurchId = church?.id || import.meta.env.VITE_CHURCH_ID;

  // Asegura la carga de datos de la iglesia al abrir el drawer
  useEffect(() => {
    if (open && targetChurchId && !church) {
      dispatch(GetChurchById(targetChurchId));
    }
  }, [open, targetChurchId, church, dispatch]);

  // Sincroniza el estado local con los overrides de la iglesia
  useEffect(() => {
    if (open) {
      const churchOverrides =
        church?.terminologyOverrides ||
        stateChurchOverrides ||
        {};
      setChurchTerms({ ...churchOverrides });

      const kidsOverrides =
        church?.ministryTerminologyOverrides?.[MinistryType.KIDS] ||
        stateMinistryOverrides?.[MinistryType.KIDS] ||
        {};
      setKidsTerms({ ...kidsOverrides });
    }
  }, [open, church, stateChurchOverrides, stateMinistryOverrides]);

  const handleChurchTermChange = (key: string, value: string) => {
    setChurchTerms((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleKidsTermChange = (key: string, value: string) => {
    setKidsTerms((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetField = (tab: 'church' | 'kids', key: string) => {
    if (tab === 'church') {
      setChurchTerms((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      setKidsTerms((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSave = async () => {
    if (!targetChurchId) {
      toast.warning('No se encontró el identificador de la organización');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanChurchTerms: Record<string, string> = {};
      Object.entries(churchTerms).forEach(([k, v]) => {
        if (v && v.trim()) cleanChurchTerms[k] = v.trim();
      });

      const cleanKidsTerms: Record<string, string> = {};
      Object.entries(kidsTerms).forEach(([k, v]) => {
        if (v && v.trim()) cleanKidsTerms[k] = v.trim();
      });

      const currentMinistryOverrides =
        church?.ministryTerminologyOverrides || stateMinistryOverrides || {};

      await dispatch(
        UpdateChurch({
          id: targetChurchId,
          terminologyOverrides: cleanChurchTerms,
          ministryTerminologyOverrides: {
            ...currentMinistryOverrides,
            [MinistryType.KIDS]: cleanKidsTerms,
          },
        }),
      ).unwrap();

      toast.success('Vocabulario actualizado correctamente');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar el vocabulario');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Vocabulario y Nomenclatura"
      icon={<Sparkles size={18} className="text-primary shrink-0" />}
      bodyClassName="p-4 sm:p-5 flex flex-col gap-4 pb-8"
    >
      {/* Banner Superior Informativo */}
      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-3.5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={16} />
        </div>
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Personalización de Términos
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">
            Adapta la terminología de la aplicación para que coincida con el vocabulario y cultura de tu congregación.
          </p>
        </div>
      </div>

      {/* Selector de Nivel (Segmented Tabs) */}
      <div
        className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-gray-200/60"
        data-vaul-no-drag=""
      >
        <button
          type="button"
          data-vaul-no-drag=""
          onClick={() => setActiveTab('church')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-98',
            activeTab === 'church'
              ? 'bg-white text-gray-900 shadow-xs border border-gray-200/80'
              : 'text-gray-500 hover:text-gray-800',
          )}
        >
          <Church size={15} className={activeTab === 'church' ? 'text-primary' : 'text-gray-400'} />
          <span>Nivel Iglesia</span>
        </button>
        <button
          type="button"
          data-vaul-no-drag=""
          onClick={() => setActiveTab('kids')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-98',
            activeTab === 'kids'
              ? 'bg-white text-gray-900 shadow-xs border border-gray-200/80'
              : 'text-gray-500 hover:text-gray-800',
          )}
        >
          <FaChild
            className={clsx(
              'w-3.5 h-3.5',
              activeTab === 'kids' ? 'text-emerald-600' : 'text-gray-400',
            )}
          />
          <span>Ministerio Infantil</span>
        </button>
      </div>

      {/* Contenido Pestaña 1: Términos Iglesia */}
      {activeTab === 'church' && (
        <div className="flex flex-col gap-3">
          {CHURCH_TERMINOLOGY_FIELDS.map((field) => {
            const currentValue = churchTerms[field.key] || '';
            const isOverridden = Boolean(churchTerms[field.key]);
            const IconComponent = FIELD_ICONS[field.key] || Church;

            return (
              <div
                key={field.key}
                className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <IconComponent size={15} className="text-primary shrink-0" />
                    <span>{field.label}</span>
                  </label>
                  {isOverridden && (
                    <button
                      type="button"
                      data-vaul-no-drag=""
                      onClick={() => handleResetField('church', field.key)}
                      className="text-[11px] font-semibold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Restablecer al término predeterminado"
                    >
                      <RotateCcw size={12} />
                      <span>Por defecto</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-500 leading-snug">
                  {field.description}
                </p>

                {field.suggestedOptions && (
                  <div className="flex flex-wrap gap-1.5" data-vaul-no-drag="">
                    {field.suggestedOptions.map((opt) => {
                      const isSelected = (currentValue || field.defaultValue) === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          data-vaul-no-drag=""
                          onClick={() => handleChurchTermChange(field.key, opt)}
                          className={clsx(
                            'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer select-none active:scale-95',
                            isSelected
                              ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-2xs'
                              : 'bg-gray-50/80 border-gray-200/80 text-gray-600 hover:bg-gray-100 hover:text-gray-800',
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                <Input
                  value={currentValue}
                  onChange={(e) => handleChurchTermChange(field.key, e.target.value)}
                  placeholder={`Por defecto: "${field.defaultValue}"`}
                  className="placeholder:text-gray-400 bg-gray-50/50 text-xs"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Contenido Pestaña 2: Términos Ministerio Infantil */}
      {activeTab === 'kids' && (
        <div className="flex flex-col gap-3">
          {KIDS_TERMINOLOGY_FIELDS.map((field) => {
            const currentValue = kidsTerms[field.key] || '';
            const isOverridden = Boolean(kidsTerms[field.key]);
            const IconComponent = FIELD_ICONS[field.key] || FaChild;

            return (
              <div
                key={field.key}
                className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <IconComponent size={15} className="text-emerald-600 shrink-0" />
                    <span>{field.label}</span>
                  </label>
                  {isOverridden && (
                    <button
                      type="button"
                      data-vaul-no-drag=""
                      onClick={() => handleResetField('kids', field.key)}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Restablecer al término predeterminado"
                    >
                      <RotateCcw size={12} />
                      <span>Por defecto</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-500 leading-snug">
                  {field.description}
                </p>

                {field.suggestedOptions && (
                  <div className="flex flex-wrap gap-1.5" data-vaul-no-drag="">
                    {field.suggestedOptions.map((opt) => {
                      const isSelected = (currentValue || field.defaultValue) === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          data-vaul-no-drag=""
                          onClick={() => handleKidsTermChange(field.key, opt)}
                          className={clsx(
                            'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer select-none active:scale-95',
                            isSelected
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold shadow-2xs'
                              : 'bg-gray-50/80 border-gray-200/80 text-gray-600 hover:bg-gray-100 hover:text-gray-800',
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                <Input
                  value={currentValue}
                  onChange={(e) => handleKidsTermChange(field.key, e.target.value)}
                  placeholder={`Por defecto: "${field.defaultValue}"`}
                  className="placeholder:text-gray-400 bg-gray-50/50 text-xs"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Botones de Acción en el Pie */}
      <div className="pt-2 flex items-center justify-end gap-2.5">
        <Button
          type="button"
          data-vaul-no-drag=""
          variant="secondary"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
          className="text-xs font-semibold px-4 py-2.5 rounded-xl"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          data-vaul-no-drag=""
          onClick={handleSave}
          disabled={isSubmitting}
          className="text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 bg-primary hover:bg-primary/90 text-white shadow-xs"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save size={15} />
              <span>Guardar Cambios</span>
            </>
          )}
        </Button>
      </div>
    </AppDrawer>
  );
};
