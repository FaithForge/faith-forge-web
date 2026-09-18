import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppDrawer from '@/components/ui/AppDrawer';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import { CacheScope, useClearCacheMutation } from '@/libs/state/redux/api/churchApi';
import { resetChurchPrinterState } from '@/libs/state/redux/slices/church/churchPrinter.slice';
import { clearHttpCache, invalidateHttpCachePattern } from '@/libs/utils/http';
import { useChurchTerm } from '@/libs/hooks/useTerm';
import {
  Printer,
  CalendarClock,
  Trash2,
  Database,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { FaChild } from 'react-icons/fa6';
import { toast } from 'sonner';
import clsx from 'clsx';

interface ClearCacheDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Drawer para la gestión y borrado segmentado de memoria caché en backend y cliente.
 * Presenta una lista unificada para actualizar secciones específicas (impresoras, servicios,
 * registros) o ejecutar una purga completa del sistema con espaciado generoso y diseño refinado.
 *
 * @param {ClearCacheDrawerProps} props - Propiedades del componente.
 * @returns {JSX.Element} Drawer con diseño segmentado unificado.
 */
export const ClearCacheDrawer: React.FC<ClearCacheDrawerProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation(['admin', 'common']);
  const dispatch = useAppDispatch();
  const [clearCacheMutation] = useClearCacheMutation();

  const meetingsTerm = useChurchTerm('meetings');
  const campusesTerm = useChurchTerm('campuses');

  const [loadingScope, setLoadingScope] = useState<CacheScope | null>(null);

  /**
   * Ejecuta la limpieza de caché para un scope determinado e invalida
   * selectivamente la memoria temporal de HTTP y los slices de Redux.
   *
   * @param {CacheScope} scope - Segmento a limpiar ('printers' | 'services' | 'registrations' | 'all').
   */
  const handleClearScope = async (scope: CacheScope) => {
    setLoadingScope(scope);
    const toastId = toast.loading(t('admin:dashboard.clear_cache_drawer.clearing_toast'));

    try {
      await clearCacheMutation({ scope }).unwrap();

      // Limpieza selectiva de la memoria HTTP en cliente y estados locales
      if (scope === 'printers' || scope === 'all') {
        invalidateHttpCachePattern('/church-printers');
        dispatch(resetChurchPrinterState());
      }
      if (scope === 'services' || scope === 'all') {
        invalidateHttpCachePattern('/church-meeting');
        invalidateHttpCachePattern('/church-campuses');
      }
      if (scope === 'registrations' || scope === 'all') {
        invalidateHttpCachePattern('/kid-groups');
        invalidateHttpCachePattern('/kid-medical-conditions');
        invalidateHttpCachePattern('/kid-guardian');
      }
      if (scope === 'all') {
        clearHttpCache();
      }

      let successMessage = t('admin:dashboard.clear_cache_drawer.all_success');
      if (scope === 'printers') {
        successMessage = t('admin:dashboard.clear_cache_drawer.printers_success');
      } else if (scope === 'services') {
        successMessage = t('admin:dashboard.clear_cache_drawer.services_success', {
          meetings: meetingsTerm,
          campuses: campusesTerm,
        });
      } else if (scope === 'registrations') {
        successMessage = t('admin:dashboard.clear_cache_drawer.registrations_success');
      }

      toast.success(successMessage, { id: toastId });
    } catch {
      toast.error(t('admin:dashboard.clear_cache_drawer.error_toast'), { id: toastId });
    } finally {
      setLoadingScope(null);
    }
  };

  const sections = [
    {
      scope: 'printers' as CacheScope,
      title: t('admin:dashboard.clear_cache_drawer.printers_title'),
      description: t('admin:dashboard.clear_cache_drawer.printers_desc'),
      icon: Printer,
      iconBg: 'bg-cyan-50 text-cyan-600 border border-cyan-100',
    },
    {
      scope: 'services' as CacheScope,
      title: t('admin:dashboard.clear_cache_drawer.services_title', {
        meetings: meetingsTerm,
        campuses: campusesTerm,
      }),
      description: t('admin:dashboard.clear_cache_drawer.services_desc', {
        meetings: meetingsTerm.toLowerCase(),
        campuses: campusesTerm.toLowerCase(),
      }),
      icon: CalendarClock,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
    },
    {
      scope: 'registrations' as CacheScope,
      title: t('admin:dashboard.clear_cache_drawer.registrations_title'),
      description: t('admin:dashboard.clear_cache_drawer.registrations_desc'),
      icon: FaChild,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    },
  ];

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={t('admin:dashboard.clear_cache_drawer.title')}
      icon={<Database size={18} className="text-primary" />}
      contentClassName="sm:max-w-lg sm:mx-auto shadow-2xl"
      bodyClassName="px-5 py-5 sm:px-6 sm:py-6 bg-slate-50/70"
    >
      <div className="flex flex-col">
        {/* Header subtitle with adequate breathing room */}
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          {t('admin:dashboard.clear_cache_drawer.subtitle')}
        </p>

        {/* Unified Segmented Card */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs divide-y divide-gray-100 overflow-hidden">
          {sections.map((section) => {
            const IconComponent = section.icon;
            const isLoading = loadingScope === section.scope;
            const isAnyLoading = loadingScope !== null;

            return (
              <div
                key={section.scope}
                className="flex items-center justify-between gap-3.5 p-3.5 sm:p-4 hover:bg-slate-50/60 transition-colors"
              >
                {/* Left: Icon & Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={clsx(
                      'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs',
                      section.iconBg
                    )}
                  >
                    <IconComponent size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[13px] sm:text-sm font-bold text-gray-900 leading-tight">
                      {section.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-gray-500 mt-1 leading-snug">
                      {section.description}
                    </p>
                  </div>
                </div>

                {/* Right: Clean, compact action button */}
                <div className="shrink-0">
                  <button
                    type="button"
                    data-vaul-no-drag=""
                    disabled={isAnyLoading}
                    onClick={() => handleClearScope(section.scope)}
                    className={clsx(
                      'h-8 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1.5',
                      'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-2xs hover:border-gray-300',
                      'disabled:opacity-50 disabled:pointer-events-none'
                    )}
                  >
                    {isLoading ? (
                      <Loader2 size={12} className="animate-spin text-primary" />
                    ) : (
                      <RotateCcw size={12} className="text-gray-500" />
                    )}
                    <span>
                      {isLoading
                        ? t('admin:dashboard.clear_cache_drawer.clearing_btn')
                        : t('admin:dashboard.clear_cache_drawer.printers_btn')}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* System-wide Purge Card with proper separation */}
        <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-white border border-rose-200/90 shadow-xs flex items-center justify-between gap-3.5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-2xs">
              <Trash2 size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="text-[13px] sm:text-sm font-bold text-gray-900 leading-tight">
                  {t('admin:dashboard.clear_cache_drawer.all_title')}
                </h4>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  {t('admin:dashboard.clear_cache_drawer.all_tag')}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-1 leading-snug">
                {t('admin:dashboard.clear_cache_drawer.all_desc')}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              data-vaul-no-drag=""
              disabled={loadingScope !== null}
              onClick={() => handleClearScope('all')}
              className={clsx(
                'h-8 px-3.5 rounded-lg text-xs font-bold text-white transition-all cursor-pointer select-none active:scale-95 shadow-2xs flex items-center gap-1.5',
                'bg-rose-600 hover:bg-rose-700',
                'disabled:opacity-50 disabled:pointer-events-none'
              )}
            >
              {loadingScope === 'all' ? (
                <Loader2 size={12} className="animate-spin text-white" />
              ) : (
                <Trash2 size={12} className="text-white" />
              )}
              <span>{t('admin:dashboard.clear_cache_drawer.all_btn')}</span>
            </button>
          </div>
        </div>
      </div>
    </AppDrawer>
  );
};

export default ClearCacheDrawer;
