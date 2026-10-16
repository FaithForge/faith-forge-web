import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  UserPlus, 
  UserCog, 
  CalendarClock, 
  ChevronRight, 
  Users, 
  Church, 
  Sparkles, 
  Trash2, 
  Layers, 
  MapPin, 
  Printer, 
  UserCheck,
  Building2,
  ArrowRight,
} from 'lucide-react';

import { APP_ROUTES } from '@/config/routes';
import clsx from 'clsx';
import { ClearCacheModal } from '@/components/modal/ClearCacheModal';
import { TerminologyModal } from '@/components/modal/TerminologyModal';
import { useChurchTerm } from '@/libs/hooks/useTerm';
import { useAppSelector } from '@/libs/state/redux/hooks';

interface AdminActionItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  iconBg: string;
  iconColor: string;
  badge?: string;
}

interface AdminCategory {
  title: string;
  description: string;
  icon: React.ElementType;
  items: AdminActionItem[];
}

/**
 * Main Dashboard View of Church Administration workspace (/admin).
 * Desktop-First responsive view featuring KPI summary cards, structured categories,
 * and direct links to facilities, ministries, people, and system utilities.
 *
 * @returns {JSX.Element} Rendered admin dashboard view.
 */
export const AdminDashboardView: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const [clearCacheOpen, setClearCacheOpen] = useState(false);
  const [terminologyOpen, setTerminologyOpen] = useState(false);

  const activeChurch = useAppSelector((state) => state.churchCampusSlice.church);
  const campuses = useAppSelector((state) => state.churchCampusSlice.data);
  const user = useAppSelector((state) => state.authSlice.user);

  const volunteersTerm = useChurchTerm('volunteers');
  const campusesTerm = useChurchTerm('campuses');
  const campusTerm = useChurchTerm('campus');
  const meetingsTerm = useChurchTerm('meetings');

  const adminCategories: AdminCategory[] = useMemo(() => [
    {
      title: t('admin:dashboard.facilities_cat', { campuses: campusesTerm }),
      description: t('admin:dashboard.facilities_cat_desc', { campuses: campusesTerm.toLowerCase(), meetings: meetingsTerm.toLowerCase() }),
      icon: Church,
      items: [
        {
          id: 'campuses-management',
          title: t('admin:dashboard.campuses_management_title', { campuses: campusesTerm }),
          description: t('admin:dashboard.campuses_management_desc', { campuses: campusesTerm.toLowerCase() }),
          icon: MapPin,
          route: APP_ROUTES.admin.campuses,
          iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
          iconColor: 'text-emerald-600',
        },
        {
          id: 'service-status',
          title: t('admin:dashboard.meetings_schedule_title', { meetings: meetingsTerm, campus: campusTerm }),
          description: t('admin:dashboard.meetings_schedule_desc', { meetings: meetingsTerm.toLowerCase() }),
          icon: CalendarClock,
          route: APP_ROUTES.admin.churchMeetings,
          iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
          iconColor: 'text-blue-600',
        },
        {
          id: 'printers-management',
          title: t('admin:dashboard.printers_management_title'),
          description: t('admin:dashboard.printers_management_desc', { campus: campusTerm.toLowerCase() }),
          icon: Printer,
          route: APP_ROUTES.admin.printers,
          iconBg: 'bg-cyan-50 text-cyan-600 border border-cyan-100',
          iconColor: 'text-cyan-600',
        },
      ],
    },
    {
      title: t('admin:dashboard.user_management_cat'),
      description: t('admin:dashboard.user_management_cat_desc'),
      icon: Users,
      items: [
        {
          id: 'user-management',
          title: t('admin:dashboard.users_directory_title', { volunteers: volunteersTerm }),
          description: t('admin:dashboard.users_directory_desc', { volunteers: volunteersTerm.toLowerCase() }),
          icon: UserCog,
          route: APP_ROUTES.admin.users,
          iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
          iconColor: 'text-indigo-600',
        },
        {
          id: 'create-user',
          title: t('admin:dashboard.create_user_title'),
          description: t('admin:dashboard.create_user_desc'),
          icon: UserPlus,
          route: APP_ROUTES.admin.createUser,
          iconBg: 'bg-teal-50 text-teal-600 border border-teal-100',
          iconColor: 'text-teal-600',
        },
      ],
    },
    {
      title: t('admin:dashboard.ministries_cat', { volunteers: volunteersTerm }),
      description: t('admin:dashboard.ministries_cat_desc', { volunteers: volunteersTerm.toLowerCase() }),
      icon: Layers,
      items: [
        {
          id: 'ministry-management',
          title: t('admin:dashboard.ministries_management_title'),
          description: t('admin:dashboard.ministries_management_desc', { campus: campusTerm.toLowerCase() }),
          icon: Layers,
          route: APP_ROUTES.admin.ministries,
          iconBg: 'bg-purple-50 text-purple-600 border border-purple-100',
          iconColor: 'text-purple-600',
        },
        {
          id: 'volunteer-applications',
          title: t('admin:dashboard.volunteer_applications_title', { volunteers: volunteersTerm }),
          description: t('admin:dashboard.volunteer_applications_desc'),
          icon: UserCheck,
          route: APP_ROUTES.admin.volunteerApplications,
          iconBg: 'bg-violet-50 text-violet-600 border border-violet-100',
          iconColor: 'text-violet-600',
        },
      ],
    },
    {
      title: t('admin:dashboard.system_cat'),
      description: t('admin:dashboard.system_cat_desc'),
      icon: Sparkles,
      items: [
        {
          id: 'terminology-settings',
          title: t('admin:dashboard.terminology_title'),
          description: t('admin:dashboard.terminology_desc', { meetings: meetingsTerm.toLowerCase(), campuses: campusesTerm.toLowerCase() }),
          icon: Sparkles,
          route: '',
          iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
          iconColor: 'text-amber-600',
        },
        {
          id: 'clear-cache',
          title: t('admin:dashboard.clear_cache_title'),
          description: t('admin:dashboard.clear_cache_desc'),
          icon: Trash2,
          route: '',
          iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
          iconColor: 'text-rose-600',
        },
      ],
    },
  ], [t, volunteersTerm, campusesTerm, campusTerm, meetingsTerm]);

  return (
    <div className="min-h-full flex-1 w-full bg-slate-50/60 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex flex-col gap-6">
        {/* Welcome Header Banner */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 lg:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
              <Sparkles size={13} />
              <span>{t('admin:dashboard.badge')}</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight truncate">
              {activeChurch?.name || t('admin:dashboard.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl line-clamp-2">
              {t('admin:dashboard.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.admin.campuses)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-primary text-white shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Building2 size={16} />
              <span>Gestionar {campusesTerm}</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate(APP_ROUTES.admin.campuses)}
            className="group bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {campusesTerm}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MapPin size={16} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {campuses?.length || 0}
              </span>
              <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Ver todas <ArrowRight size={12} />
              </span>
            </div>
          </div>

          <div
            onClick={() => navigate(APP_ROUTES.admin.churchMeetings)}
            className="group bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {meetingsTerm}
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CalendarClock size={16} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-extrabold text-slate-900">
                Horarios y Estado
              </span>
              <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Configurar <ArrowRight size={12} />
              </span>
            </div>
          </div>

          <div
            onClick={() => navigate(APP_ROUTES.admin.ministries)}
            className="group bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Ministerios
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers size={16} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-extrabold text-slate-900">
                Equipos y Áreas
              </span>
              <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Explorar <ArrowRight size={12} />
              </span>
            </div>
          </div>

          <div
            onClick={() => navigate(APP_ROUTES.admin.users)}
            className="group bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {volunteersTerm}
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-extrabold text-slate-900">
                Directorio
              </span>
              <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Gestionar <ArrowRight size={12} />
              </span>
            </div>
          </div>
        </div>

        {/* Categories 2-Column Grid on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminCategories.map((category, catIndex) => {
            const CategoryIcon = category.icon;
            return (
              <section key={catIndex} className="flex flex-col gap-3">
                {/* Category Header */}
                <div className="flex items-center gap-2.5 px-1">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <CategoryIcon size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                      {category.title}
                    </h2>
                  </div>
                </div>

                {/* Action Items List */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                  {category.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.id === 'clear-cache') {
                            setClearCacheOpen(true);
                          } else if (item.id === 'terminology-settings') {
                            setTerminologyOpen(true);
                          } else {
                            navigate(item.route);
                          }
                        }}
                        className={clsx(
                          'group flex items-center gap-4 p-4 sm:p-5 cursor-pointer transition-all duration-200',
                          'hover:bg-slate-50/80 active:bg-slate-100/80'
                        )}
                      >
                        {/* Icon */}
                        <div className={clsx('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-105', item.iconBg)}>
                          <ItemIcon size={20} className={item.iconColor} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                              {item.title}
                            </h3>
                            {item.badge && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                            {item.description}
                          </p>
                        </div>

                        {/* Action Chevron */}
                        <div className="shrink-0 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Drawer for Segmented System Cache Management */}
      <ClearCacheModal
        open={clearCacheOpen}
        onOpenChange={setClearCacheOpen}
      />

      {/* Drawer for Church and Ministry Terminology Customization */}
      <TerminologyModal
        open={terminologyOpen}
        onOpenChange={setTerminologyOpen}
      />
    </div>
  );
};

export default AdminDashboardView;
