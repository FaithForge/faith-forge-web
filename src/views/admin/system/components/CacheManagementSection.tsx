import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Printer,
  CalendarClock,
  RotateCcw,
  Loader2,
  Trash2,
  Database,
  Sparkles,
} from 'lucide-react';
import { FaChild } from 'react-icons/fa6';
import { toast } from 'sonner';
import clsx from 'clsx';
import { CacheScope, useClearCacheMutation } from '@/libs/state/redux/api/churchApi';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import { resetChurchPrinterState } from '@/libs/state/redux/slices/church/churchPrinter.slice';
import { clearHttpCache, invalidateHttpCachePattern } from '@/libs/utils/http';
import { useChurchTerm } from '@/libs/hooks/useTerm';

/**
 * Section for granular and global cache purging in the system operations view.
 * Enables administrators to invalidate stale HTTP and Redux state per domain.
 *
 * @returns {JSX.Element} Rendered cache management section.
 */
export const CacheManagementSection: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const dispatch = useAppDispatch();
  const [clearCacheMutation] = useClearCacheMutation();

  const meetingsTerm = useChurchTerm('meetings');
  const campusesTerm = useChurchTerm('campuses');

  const [loadingScope, setLoadingScope] = useState<CacheScope | null>(null);

  /**
   * Executes cache purging for the requested scope and invalidates local caches.
   *
   * @param {CacheScope} scope - Segment to purge ('printers' | 'services' | 'registrations' | 'all').
   * @returns {Promise<void>}
   */
  const handleClearScope = async (scope: CacheScope): Promise<void> => {
    setLoadingScope(scope);
    const toastId = toast.loading(t('admin:dashboard.clear_cache_drawer.clearing_toast'));

    try {
      await clearCacheMutation({ scope }).unwrap();

      if (scope === 'printers' || scope === 'all') {
        invalidateHttpCachePattern('/church-printers');
        dispatch(resetChurchPrinterState());
      }
      if (scope === 'services' || scope === 'all') {
        invalidateHttpCachePattern('/church-meeting');
        invalidateHttpCachePattern('/church-campus');
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
      title: t('admin:system_operations.cache.printers_title'),
      description: t('admin:system_operations.cache.printers_desc'),
      icon: Printer,
      iconBg: 'bg-cyan-50 text-cyan-600 border border-cyan-100',
    },
    {
      scope: 'services' as CacheScope,
      title: t('admin:system_operations.cache.services_title', {
        meetings: meetingsTerm,
        campuses: campusesTerm,
      }),
      description: t('admin:system_operations.cache.services_desc', {
        meetings: meetingsTerm.toLowerCase(),
        campuses: campusesTerm.toLowerCase(),
      }),
      icon: CalendarClock,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
    },
    {
      scope: 'registrations' as CacheScope,
      title: t('admin:system_operations.cache.registrations_title'),
      description: t('admin:system_operations.cache.registrations_desc'),
      icon: FaChild,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Informative Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 shadow-2xs">
            <Database size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">
              <Sparkles size={12} />
              <span>{t('admin:system_operations.cache.title')}</span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              {t('admin:system_operations.cache.title')}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {t('admin:system_operations.cache.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Segmented Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((section) => {
          const IconComponent = section.icon;
          const isLoading = loadingScope === section.scope;
          const isAnyLoading = loadingScope !== null;

          return (
            <div
              key={section.scope}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs',
                    section.iconBg
                  )}
                >
                  <IconComponent size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {section.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  disabled={isAnyLoading}
                  onClick={() => handleClearScope(section.scope)}
                  className={clsx(
                    'h-9 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1.5',
                    'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs hover:border-slate-300',
                    'disabled:opacity-50 disabled:pointer-events-none'
                  )}
                >
                  {isLoading ? (
                    <Loader2 size={13} className="animate-spin text-primary" />
                  ) : (
                    <RotateCcw size={13} className="text-slate-500" />
                  )}
                  <span>
                    {isLoading
                      ? t('admin:dashboard.clear_cache_drawer.clearing_btn')
                      : t('admin:system_operations.cache.clean_btn')}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global System Purge Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rose-50/70 via-white to-rose-50/40 border border-rose-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-2xs">
            <Trash2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                {t('admin:system_operations.cache.all_title')}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                {t('admin:dashboard.clear_cache_drawer.all_tag')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
              {t('admin:system_operations.cache.all_desc')}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={loadingScope !== null}
          onClick={() => handleClearScope('all')}
          className={clsx(
            'h-10 px-5 rounded-2xl text-xs font-bold text-white transition-all cursor-pointer select-none active:scale-95 shadow-xs flex items-center justify-center gap-2 shrink-0',
            'bg-rose-600 hover:bg-rose-700 border border-rose-700/20',
            'disabled:opacity-50 disabled:pointer-events-none'
          )}
        >
          {loadingScope === 'all' ? (
            <Loader2 size={14} className="animate-spin text-white" />
          ) : (
            <Trash2 size={14} className="text-white" />
          )}
          <span>{t('admin:system_operations.cache.clean_all_btn')}</span>
        </button>
      </div>
    </div>
  );
};

export default CacheManagementSection;
