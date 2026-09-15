import React, { useState, useEffect } from 'react';
import AppDrawer from '@/components/ui/AppDrawer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  CHURCH_TERMINOLOGY_FIELDS,
  KIDS_TERMINOLOGY_FIELDS,
  DEFAULT_CHURCH_TERMINOLOGY,
  DEFAULT_MINISTRY_TERMINOLOGY,
} from '@/libs/constants/defaultTerminology';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { UpdateChurch } from '@/libs/state/redux/thunks/church/church.thunk';
import { UpdateMinistry } from '@/libs/state/redux/thunks/church/ministry.thunk';
import { MinistryType } from '@/libs/models';
import { toast } from 'sonner';
import { Church, Sparkles, RotateCcw, Save, Loader2 } from 'lucide-react';
import { FaChild } from 'react-icons/fa6';
import clsx from 'clsx';

interface TerminologyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TerminologyDrawer: React.FC<TerminologyDrawerProps> = ({
  open,
  onOpenChange,
}) => {
  const dispatch = useAppDispatch();

  const churchId = import.meta.env.VITE_CHURCH_ID;
  const churchOverrides = useAppSelector(
    (state) =>
      state.churchCampusSlice.churchTerminologyOverrides ||
      state.churchCampusSlice.church?.terminologyOverrides ||
      {},
  );

  const kidsMinistry = useAppSelector((state) =>
    state.ministrySlice.ministries.find(
      (m) =>
        m.type === MinistryType.KIDS ||
        m.name.toLowerCase().includes('niño') ||
        m.name.toLowerCase().includes('kid'),
    ),
  );

  const [activeTab, setActiveTab] = useState<'church' | 'kids'>('church');
  const [churchTerms, setChurchTerms] = useState<Record<string, string>>({});
  const [kidsTerms, setKidsTerms] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setChurchTerms(churchOverrides || {});
      setKidsTerms(kidsMinistry?.terminologyOverrides || {});
    }
  }, [open, churchOverrides, kidsMinistry]);

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
    setIsSubmitting(true);
    try {
      // 1. Save church-level terminology
      if (churchId) {
        // Clean empty strings so they fallback cleanly to defaults
        const cleanChurchTerms: Record<string, string> = {};
        Object.entries(churchTerms).forEach(([k, v]) => {
          if (v && v.trim()) cleanChurchTerms[k] = v.trim();
        });

        await dispatch(
          UpdateChurch({
            id: churchId,
            terminologyOverrides: cleanChurchTerms,
          }),
        ).unwrap();
      }

      // 2. Save kids ministry terminology if ministry exists
      if (kidsMinistry) {
        const cleanKidsTerms: Record<string, string> = {};
        Object.entries(kidsTerms).forEach(([k, v]) => {
          if (v && v.trim()) cleanKidsTerms[k] = v.trim();
        });

        await dispatch(
          UpdateMinistry({
            id: kidsMinistry.id,
            type: MinistryType.KIDS,
            terminologyOverrides: cleanKidsTerms,
          }),
        ).unwrap();
      }

      toast.success('Vocabulario y nomenclatura actualizados');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar la nomenclatura');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Vocabulario y Nomenclatura"
      contentClassName="max-w-xl mx-auto"
    >
      <div className="flex flex-col h-full space-y-4">
        <p className="text-xs text-gray-500">
          Personaliza los términos institucionales y de los ministerios según la cultura de tu congregación.
        </p>
        {/* Navigation Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('church')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all',
              activeTab === 'church'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <Church className="w-4 h-4 text-indigo-600" />
            <span>Nivel Iglesia</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kids')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all',
              activeTab === 'kids'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <FaChild className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ministerio Infantil</span>
          </button>
        </div>

        {/* Tab 1: Church Terms */}
        {activeTab === 'church' && (
          <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-800 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                Estos términos son transversales a toda la plataforma (reuniones, sedes y servidores en general).
              </span>
            </div>

            {CHURCH_TERMINOLOGY_FIELDS.map((field) => {
              const currentValue = churchTerms[field.key] || '';
              const isOverridden = !!churchTerms[field.key];

              return (
                <div
                  key={field.key}
                  className="p-3.5 bg-white border border-gray-100 rounded-xl shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">
                        {field.label}
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        {field.description}
                      </p>
                    </div>
                    {isOverridden && (
                      <button
                        type="button"
                        onClick={() => handleResetField('church', field.key)}
                        className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                        title="Restablecer a valor por defecto"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Por defecto</span>
                      </button>
                    )}
                  </div>

                  {/* Suggestion Chips */}
                  {field.suggestedOptions && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {field.suggestedOptions.map((opt) => {
                        const isSelected =
                          (currentValue || field.defaultValue) === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              handleChurchTermChange(field.key, opt)
                            }
                            className={clsx(
                              'text-[11px] px-2.5 py-1 rounded-md font-medium border transition-all',
                              isSelected
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100',
                            )}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Custom Input */}
                  <div>
                    <Input
                      value={currentValue}
                      onChange={(e) =>
                        handleChurchTermChange(field.key, e.target.value)
                      }
                      placeholder={`Por defecto: "${field.defaultValue}"`}
                      className="text-xs placeholder:text-gray-400"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Kids Ministry Terms */}
        {activeTab === 'kids' && (
          <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <FaChild className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Configura el vocabulario del Ministerio Infantil (aulas, maestros, tutores y mesas de registro).
              </span>
            </div>

            {KIDS_TERMINOLOGY_FIELDS.map((field) => {
              const currentValue = kidsTerms[field.key] || '';
              const isOverridden = !!kidsTerms[field.key];

              return (
                <div
                  key={field.key}
                  className="p-3.5 bg-white border border-gray-100 rounded-xl shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">
                        {field.label}
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        {field.description}
                      </p>
                    </div>
                    {isOverridden && (
                      <button
                        type="button"
                        onClick={() => handleResetField('kids', field.key)}
                        className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                        title="Restablecer a valor por defecto"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Por defecto</span>
                      </button>
                    )}
                  </div>

                  {/* Suggestion Chips */}
                  {field.suggestedOptions && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {field.suggestedOptions.map((opt) => {
                        const isSelected =
                          (currentValue || field.defaultValue) === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              handleKidsTermChange(field.key, opt)
                            }
                            className={clsx(
                              'text-[11px] px-2.5 py-1 rounded-md font-medium border transition-all',
                              isSelected
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100',
                            )}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Custom Input */}
                  <div>
                    <Input
                      value={currentValue}
                      onChange={(e) =>
                        handleKidsTermChange(field.key, e.target.value)
                      }
                      placeholder={`Por defecto: "${field.defaultValue}"`}
                      className="text-xs placeholder:text-gray-400"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="text-xs flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </AppDrawer>
  );
};
