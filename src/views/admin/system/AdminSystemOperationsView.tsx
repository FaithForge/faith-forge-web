import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  SlidersHorizontal,
  Terminal,
  Database,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import clsx from 'clsx';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { APP_ROUTES } from '@/config/routes';
import { usePermissions } from '@/libs/hooks/usePermissions';
import CodeMigrationsSection from './components/CodeMigrationsSection';
import CacheManagementSection from './components/CacheManagementSection';

type OperationsTab = 'migrations' | 'cache';

/**
 * Main System Operations View at /admin/system.
 * Unifies technical maintenance, segmented cache clearing, and on-demand code migrations
 * for Super Administrators and General Administrators.
 *
 * @returns {JSX.Element} Rendered admin system operations view.
 */
export const AdminSystemOperationsView: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { can } = usePermissions();

  const canManageOperations = can('admin:manage-system-operations');

  const initialTab = (searchParams.get('tab') as OperationsTab) || 'migrations';
  const [activeTab, setActiveTab] = useState<OperationsTab>(
    initialTab === 'cache' ? 'cache' : 'migrations'
  );

  /**
   * Switches active operational tab and syncs with query parameter.
   *
   * @param {OperationsTab} tab - Target tab to activate.
   */
  const handleTabChange = (tab: OperationsTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (!canManageOperations) {
    return (
      <div className="min-h-full flex-1 w-full bg-slate-50/60 pb-20 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-md text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mb-4">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            Acceso Restringido
          </h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Se requieren permisos de Administrador General o Super Administrador para ejecutar operaciones técnicas de sistema.
          </p>
          <Button
            variant="default"
            size="md"
            onClick={() => navigate(APP_ROUTES.admin.root)}
          >
            Volver al Panel Principal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex-1 w-full bg-slate-50/60 pb-20">
      {/* Mobile Top Header */}
      <PageHeader
        title={t('admin:system_operations.header_title')}
        onBack={() => navigate(APP_ROUTES.admin.root)}
        className="lg:hidden"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex flex-col gap-6">
        {/* Desktop Header Summary Banner */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 shadow-2xs">
              <SlidersHorizontal size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">
                <Sparkles size={12} />
                <span>{t('admin:system_operations.badge')}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {t('admin:system_operations.header_title')}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {t('admin:system_operations.header_subtitle')}
              </p>
            </div>
          </div>

          {/* Segmented Tab Pill Navigation */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => handleTabChange('migrations')}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none',
                activeTab === 'migrations'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <Terminal size={14} className={activeTab === 'migrations' ? 'text-indigo-600' : 'text-slate-400'} />
              <span>{t('admin:system_operations.tabs.migrations')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('cache')}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none',
                activeTab === 'cache'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <Database size={14} className={activeTab === 'cache' ? 'text-indigo-600' : 'text-slate-400'} />
              <span>{t('admin:system_operations.tabs.cache')}</span>
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'migrations' ? (
          <CodeMigrationsSection />
        ) : (
          <CacheManagementSection />
        )}
      </div>
    </div>
  );
};

export default AdminSystemOperationsView;
