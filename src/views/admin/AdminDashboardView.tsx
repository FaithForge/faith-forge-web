import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  UserPlus, 
  CalendarClock, 
  ChevronRight, 
  Users, 
  Sparkles, 
  RotateCcw, 
  Layers, 
  MapPin, 
  Printer, 
  UserCheck,
  Building2,
  ArrowRight,
  SlidersHorizontal,
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
  id: string;
  title: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
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

  const volunteersTerm = useChurchTerm('volunteers');
  const campusesTerm = useChurchTerm('campuses');
  const campusTerm = useChurchTerm('campus');
  const meetingsTerm = useChurchTerm('meetings');

  const adminCategories: AdminCategory[] = useMemo(() => [
    {
      id: 'facilities',
      title: t('admin:dashboard.facilities_cat', { campuses: campusesTerm }),
      icon: Building2,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      items: [
        {
          id: 'campuses-management',
          title: t('admin:dashboard.campuses_management_title', { campuses: campusesTerm }),
          description: t('admin:dashboard.campuses_management_desc', { campuses: campusesTerm.toLowerCase() }),
          icon: MapPin,
          route: APP_ROUTES.admin.campuses,
          iconBg: 'bg-emerald-50 border border-emerald-100/60',
          iconColor: 'text-emerald-600',
        },
        {
          id: 'service-status',
          title: t('admin:dashboard.meetings_schedule_title', { meetings: meetingsTerm, campus: campusTerm }),
          description: t('admin:dashboard.meetings_schedule_desc', { meetings: meetingsTerm.toLowerCase() }),
          icon: CalendarClock,
          route: APP_ROUTES.admin.churchMeetings,
          iconBg: 'bg-blue-50 border border-blue-100/60',
          iconColor: 'text-blue-600',
        },
        {
          id: 'printers-management',
          title: t('admin:dashboard.printers_management_title'),
          badge: t('admin:dashboard.printers_management_badge', { defaultValue: 'Bluetooth / Red' }),
          description: t('admin:dashboard.printers_management_desc', { campus: campusTerm.toLowerCase() }),
          icon: Printer,
          route: APP_ROUTES.admin.printers,
          iconBg: 'bg-cyan-50 border border-cyan-100/60',
          iconColor: 'text-cyan-600',
        },
      ],
    },
    {
      id: 'users',
      title: t('admin:dashboard.user_management_cat'),
      icon: Users,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      items: [
        {
          id: 'user-management',
          title: t('admin:dashboard.users_directory_title', { volunteers: volunteersTerm }),
          description: t('admin:dashboard.users_directory_desc', { volunteers: volunteersTerm.toLowerCase() }),
          icon: Users,
          route: APP_ROUTES.admin.users,
          iconBg: 'bg-indigo-50 border border-indigo-100/60',
          iconColor: 'text-indigo-600',
        },
        {
          id: 'create-user',
          title: t('admin:dashboard.create_user_title'),
          description: t('admin:dashboard.create_user_desc'),
          icon: UserPlus,
          route: APP_ROUTES.admin.createUser,
          iconBg: 'bg-teal-50 border border-teal-100/60',
          iconColor: 'text-teal-600',
        },
      ],
    },
    {
      id: 'ministries',
      title: t('admin:dashboard.ministries_cat', { volunteers: volunteersTerm }),
      icon: Layers,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      items: [
        {
          id: 'ministry-management',
          title: t('admin:dashboard.ministries_management_title'),
          description: t('admin:dashboard.ministries_management_desc', { campus: campusTerm.toLowerCase() }),
          icon: Layers,
          route: APP_ROUTES.admin.ministries,
          iconBg: 'bg-purple-50 border border-purple-100/60',
          iconColor: 'text-purple-600',
        },
        {
          id: 'volunteer-applications',
          title: t('admin:dashboard.volunteer_applications_title', { volunteers: volunteersTerm }),
          description: t('admin:dashboard.volunteer_applications_desc'),
          icon: UserCheck,
          route: APP_ROUTES.admin.volunteerApplications,
          iconBg: 'bg-violet-50 border border-violet-100/60',
          iconColor: 'text-violet-600',
        },
      ],
    },
    {
      id: 'system',
      title: t('admin:dashboard.system_cat'),
      icon: SlidersHorizontal,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      items: [
        {
          id: 'terminology-settings',
          title: t('admin:dashboard.terminology_title'),
          description: t('admin:dashboard.terminology_desc', { meetings: meetingsTerm.toLowerCase(), campuses: campusesTerm.toLowerCase() }),
          icon: Sparkles,
          route: '',
          iconBg: 'bg-amber-50 border border-amber-100/60',
          iconColor: 'text-amber-600',
        },
        {
          id: 'clear-cache',
          title: t('admin:dashboard.clear_cache_title'),
          description: t('admin:dashboard.clear_cache_desc'),
          icon: RotateCcw,
          route: '',
          iconBg: 'bg-rose-50 border border-rose-100/60',
          iconColor: 'text-rose-600',
        },
      ],
    },
  ], [t, volunteersTerm, campusesTerm, campusTerm, meetingsTerm]);

  /**
   * Handles click events for individual action cards.
   *
   * @param {AdminActionItem} item - Action item configuration.
   */
  const handleItemClick = (item: AdminActionItem) => {
    if (item.id === 'clear-cache') {
      setClearCacheOpen(true);
    } else if (item.id === 'terminology-settings') {
      setTerminologyOpen(true);
    } else if (item.route) {
      navigate(item.route);
    }
  };

  return (
    <div className="min-h-full flex-1 w-full bg-slate-50/60 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex flex-col gap-6">
        {/* Welcome Header Banner */}
        <div className="bg-gradient-to-r from-[#0d162a] via-[#151f38] to-[#0d162a] rounded-3xl p-6 sm:p-7 lg:p-8 text-white border border-slate-800/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="min-w-0 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 text-[11px] font-bold uppercase tracking-wider mb-2.5">
              <Sparkles size={12} className="text-indigo-400" />
              <span>{t('admin:dashboard.badge', { defaultValue: 'MÓDULO DE ADMINISTRACIÓN' })}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              {activeChurch?.name || t('admin:dashboard.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              {t('admin:dashboard.hero_desc', {
                campuses: campusesTerm.toLowerCase(),
                defaultValue: 'Selecciona una categoría para gestionar los usuarios, roles, sedes y servicios pastorales de la congregación de forma centralizada.',
              })}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0 z-10">
            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.admin.campuses)}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-white text-slate-900 shadow-sm hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100"
            >
              <Building2 size={18} className="text-indigo-600" />
              <span>{t('admin:dashboard.manage_campuses_btn', { campuses: campusesTerm, defaultValue: `Gestionar ${campusesTerm}` })}</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Campuses */}
          <div
            onClick={() => navigate(APP_ROUTES.admin.campuses)}
            className="group bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between gap-3 min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {campusesTerm}
              </span>
              <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center">
                <MapPin size={15} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                {campuses?.length || 5}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {t('admin:dashboard.kpi_campuses_subtitle', {
                  campuses: campusesTerm,
                  defaultValue: `${campusesTerm} activas en el país`,
                })}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                {t('admin:dashboard.kpi_campuses_action', { defaultValue: 'Ver todas' })} <ArrowRight size={12} />
              </span>
            </div>
          </div>

          {/* Card 2: Meetings */}
          <div
            onClick={() => navigate(APP_ROUTES.admin.churchMeetings)}
            className="group bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between gap-3 min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {meetingsTerm}
              </span>
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 flex items-center justify-center">
                <CalendarClock size={15} />
              </div>
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {t('admin:dashboard.kpi_meetings_title', { defaultValue: 'Horarios y Estado' })}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {t('admin:dashboard.kpi_meetings_subtitle', { defaultValue: 'Cultos regulares sincronizados' })}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                {t('admin:dashboard.kpi_meetings_action', { defaultValue: 'Configurar' })} <ArrowRight size={12} />
              </span>
            </div>
          </div>

          {/* Card 3: Ministries */}
          <div
            onClick={() => navigate(APP_ROUTES.admin.ministries)}
            className="group bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between gap-3 min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Ministerios
              </span>
              <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 border border-purple-100/80 flex items-center justify-center">
                <Layers size={15} />
              </div>
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {t('admin:dashboard.kpi_ministries_title', { defaultValue: 'Equipos y Áreas' })}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {t('admin:dashboard.kpi_ministries_subtitle', { defaultValue: 'Alabanza, ujieres, niños & medios' })}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-purple-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                {t('admin:dashboard.kpi_ministries_action', { defaultValue: 'Explorar' })} <ArrowRight size={12} />
              </span>
            </div>
          </div>

          {/* Card 4: Volunteers / Servers */}
          <div
            onClick={() => navigate(APP_ROUTES.admin.users)}
            className="group bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between gap-3 min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {volunteersTerm}
              </span>
              <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/80 flex items-center justify-center">
                <Users size={15} />
              </div>
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {t('admin:dashboard.kpi_volunteers_title', { defaultValue: 'Directorio' })}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {t('admin:dashboard.kpi_volunteers_subtitle', { defaultValue: 'Personal ministerial y roles' })}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                {t('admin:dashboard.kpi_volunteers_action', { defaultValue: 'Gestionar' })} <ArrowRight size={12} />
              </span>
            </div>
          </div>
        </div>

        {/* Categories 2-Column Grid on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminCategories.map((category) => {
            const CategoryIcon = category.icon;
            return (
              <section key={category.id} className="flex flex-col gap-3">
                {/* Category Header */}
                <div className="flex items-center gap-2 px-1">
                  <div className={clsx('w-6 h-6 rounded-lg flex items-center justify-center shrink-0', category.iconBg, category.iconColor)}>
                    <CategoryIcon size={15} />
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    {category.title}
                  </h2>
                </div>

                {/* Individual Action Cards List */}
                <div className="flex flex-col gap-3">
                  {category.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={clsx(
                          'group bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300',
                          'p-4 sm:p-5 flex items-center gap-4 cursor-pointer transition-all duration-200'
                        )}
                      >
                        {/* Icon */}
                        <div className={clsx('w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-105', item.iconBg)}>
                          <ItemIcon size={20} className={item.iconColor} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                              {item.title}
                            </h3>
                            {item.badge && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        {/* Action Chevron */}
                        <div className="shrink-0 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all">
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
