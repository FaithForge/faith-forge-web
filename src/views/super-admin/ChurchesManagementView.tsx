import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Globe,
  ExternalLink,
  Settings,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { EntityState, IChurch } from '@/libs/models';
import { useGetChurchesQuery } from '@/libs/state/redux/api/churchApi';
import { ChurchTenantModal } from '@/components/modal/ChurchTenantModal';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

/**
 * Superadmin view (`admin.lumbrela.app`) for managing all church tenants,
 * their subdomains, custom domains, white-label PWA branding, and local church administrators.
 *
 * @returns {JSX.Element} Rendered churches management view.
 */
const ChurchesManagementView: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const { data: churchesResponse, isLoading } = useGetChurchesQuery({ limit: 100 });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<IChurch | null>(null);

  const churches = useMemo(
    () => (churchesResponse?.data || []).filter((c) => c.state !== EntityState.DELETED),
    [churchesResponse],
  );

  const stats = useMemo(() => {
    const total = churches.length;
    const active = churches.filter((c) => c.state === EntityState.ACTIVE || !c.state).length;
    const inactive = total - active;
    const withCustomDomain = churches.filter(
      (c) => Array.isArray(c.customDomains) && c.customDomains.length > 0,
    ).length;
    return { total, active, inactive, withCustomDomain };
  }, [churches]);

  const filteredChurches = useMemo(() => {
    const query = search.trim().toLowerCase();
    return churches.filter((church) => {
      const isChurchActive = church.state === EntityState.ACTIVE || !church.state;
      if (statusFilter === 'ACTIVE' && !isChurchActive) return false;
      if (statusFilter === 'INACTIVE' && isChurchActive) return false;

      if (!query) return true;
      const matchName = church.name.toLowerCase().includes(query);
      const matchSlug = (church.slug || '').toLowerCase().includes(query);
      const matchDomain = (church.customDomains || []).some((d) =>
        d.toLowerCase().includes(query),
      );
      return matchName || matchSlug || matchDomain;
    });
  }, [churches, search, statusFilter]);

  /**
   * Opens the creation modal for a new church tenant.
   *
   * @returns {void}
   */
  const handleCreateNew = (): void => {
    setSelectedChurch(null);
    setModalOpen(true);
  };

  /**
   * Opens the configuration modal for an existing church tenant.
   *
   * @param {IChurch} church - Church tenant to edit.
   * @returns {void}
   */
  const handleEditChurch = (church: IChurch): void => {
    setSelectedChurch(church);
    setModalOpen(true);
  };

  /**
   * Builds the target URL to preview or open a church tenant portal.
   *
   * @param {IChurch} church - Target church tenant.
   * @returns {string} URL string for the tenant.
   */
  const buildTenantPortalUrl = (church: IChurch): string => {
    if (typeof window === 'undefined') return '#';
    const { protocol, hostname, port } = window.location;
    const slug = church.slug || '';
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.vercel.app')
    ) {
      const portPart = port ? `:${port}` : '';
      return `${protocol}//${hostname}${portPart}/?tenant=${encodeURIComponent(slug || church.id)}`;
    }
    const baseParts = hostname.replace(/^admin\./, '');
    if (slug) {
      return `${protocol}//${slug}.${baseParts}/admin`;
    }
    return `${protocol}//${baseParts}/admin`;
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
            <Globe size={14} />
            <span>{t('admin:super_admin.badge')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('admin:super_admin.title')}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            {t('admin:super_admin.subtitle')}
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={handleCreateNew}
          className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-2xl shadow-lg"
        >
          <span className="flex items-center gap-2">
            <Plus size={18} />
            {t('admin:super_admin.new_church_btn')}
          </span>
        </Button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('admin:super_admin.stat_total')}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Building2 size={22} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('admin:super_admin.stat_active')}
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.active}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('admin:super_admin.stat_custom_domains')}
            </p>
            <p className="text-2xl font-black text-blue-600 mt-1">{stats.withCustomDomain}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Globe size={22} />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <Input
            icon="search"
            placeholder={t('admin:super_admin.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as StatusFilter[]).map((filter) => {
            const label =
              filter === 'ALL'
                ? t('admin:super_admin.filter_all', { count: stats.total })
                : filter === 'ACTIVE'
                ? t('admin:super_admin.filter_active', { count: stats.active })
                : t('admin:super_admin.filter_inactive', { count: stats.inactive });
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  statusFilter === filter
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Churches Grid / Table */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center text-sm text-slate-500">
          {t('common:states.loading')}
        </div>
      ) : filteredChurches.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Building2 size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {t('admin:super_admin.empty_title')}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {t('admin:super_admin.empty_desc')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChurches.map((church) => {
            const isActive = church.state === EntityState.ACTIVE || !church.state;
            const branding = church.branding || {};
            const iconUrl =
              branding.icon192Url || branding.logoUrl || '/icons/icon-192x192.png';
            const primaryColor = branding.primaryColor || '#2563EB';
            const appName = branding.appName || church.name;
            const customDomains = church.customDomains || [];

            return (
              <div
                key={church.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between gap-5"
              >
                <div className="space-y-4">
                  {/* Top Row: PWA Icon + Name + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs"
                        style={{ backgroundColor: branding.backgroundColor || '#FFFFFF' }}
                      >
                        <img
                          src={iconUrl}
                          alt={church.name}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-base text-slate-900 truncate">
                          {church.name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                          <Smartphone size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{appName}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={clsx(
                        'px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0',
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200',
                      )}
                    >
                      {isActive
                        ? t('admin:super_admin.status_active')
                        : t('admin:super_admin.status_inactive')}
                    </span>
                  </div>

                  {/* Domain & Subdomain Details */}
                  <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-semibold">
                        {t('admin:super_admin.subdomain_label')}:
                      </span>
                      <span className="font-mono font-bold text-slate-800 truncate">
                        {church.slug ? `${church.slug}.lumbrela.app` : '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-semibold">
                        {t('admin:super_admin.custom_domains_label')}:
                      </span>
                      <span className="font-medium text-slate-700 truncate">
                        {customDomains.length > 0
                          ? customDomains.join(', ')
                          : t('admin:super_admin.no_custom_domains')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-semibold">
                        {t('admin:super_admin.pwa_brand_label')}:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-300"
                          style={{ backgroundColor: primaryColor }}
                        />
                        <span className="font-mono text-[11px] text-slate-600">
                          {primaryColor}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={buildTenantPortalUrl(church)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    <span>{t('admin:super_admin.open_tenant_btn')}</span>
                    <ExternalLink size={13} />
                  </a>

                  <Button
                    type="button"
                    variant="default"
                    onClick={() => handleEditChurch(church)}
                    className="text-xs px-3.5 py-2 h-auto rounded-xl"
                  >
                    <span className="flex items-center gap-1.5">
                      <Settings size={14} />
                      {t('admin:super_admin.configure_btn')}
                    </span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ChurchTenantModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        church={selectedChurch}
      />
    </div>
  );
};

export default ChurchesManagementView;
