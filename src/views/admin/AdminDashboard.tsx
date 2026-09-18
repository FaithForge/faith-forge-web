import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  UserPlus, 
  UserCog, 
  ShieldCheck, 
  CalendarClock, 
  ChevronRight, 
  Users, 
  Church, 
  Sparkles,
  Database,
  Trash2,
  Layers,
  MapPin,
  Printer,
  UserCheck,
} from 'lucide-react';

import { APP_ROUTES } from '@/config/routes';
import clsx from 'clsx';
import { ClearCacheDrawer } from '@/components/modal/ClearCacheDrawer';
import { TerminologyDrawer } from '@/components/modal/TerminologyDrawer';
import { useChurchTerm } from '@/libs/hooks/useTerm';

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
 * Vista Principal del Panel de Administración
 */
const AdminDashboard: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const [clearCacheOpen, setClearCacheOpen] = useState(false);
  const [terminologyOpen, setTerminologyOpen] = useState(false);

  const volunteersTerm = useChurchTerm('volunteers');
  const campusesTerm = useChurchTerm('campuses');
  const campusTerm = useChurchTerm('campus');
  const meetingsTerm = useChurchTerm('meetings');

  const adminCategories: AdminCategory[] = useMemo(() => [
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
          iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
          iconColor: 'text-blue-600',
        },
        {
          id: 'create-user',
          title: t('admin:dashboard.create_user_title'),
          description: t('admin:dashboard.create_user_desc'),
          icon: UserPlus,
          route: APP_ROUTES.admin.createUser,
          iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
          iconColor: 'text-emerald-600',
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
          iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
          iconColor: 'text-indigo-600',
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
          iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
          iconColor: 'text-amber-600',
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
      title: t('admin:dashboard.system_cat'),
      description: t('admin:dashboard.system_cat_desc'),
      icon: Database,
      items: [
        {
          id: 'terminology-settings',
          title: t('admin:dashboard.terminology_title'),
          description: t('admin:dashboard.terminology_desc', { meetings: meetingsTerm.toLowerCase(), campuses: campusesTerm.toLowerCase() }),
          icon: Sparkles,
          route: '',
          iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
          iconColor: 'text-indigo-600',
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
    <div className="min-h-full flex-1 w-full bg-slate-50 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 flex flex-col gap-6">
        {/* Page Header */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
            <Sparkles size={14} />
            <span>{t('admin:dashboard.badge')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {t('admin:dashboard.title')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {t('admin:dashboard.subtitle')}
          </p>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col gap-6">
          {adminCategories.map((category, catIndex) => {
            const CategoryIcon = category.icon;
            return (
              <section key={catIndex} className="flex flex-col gap-2.5">
                {/* Category Header */}
                <div className="flex items-center gap-2 px-1">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                    <CategoryIcon size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
                      {category.title}
                    </h2>
                  </div>
                </div>

                {/* Action Items List */}
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs divide-y divide-gray-100 overflow-hidden">
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
                          'group flex items-center gap-3.5 p-4 sm:p-5 cursor-pointer transition-all duration-200',
                          'hover:bg-slate-50 active:bg-slate-100/80'
                        )}
                      >
                        {/* Icon */}
                        <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105', item.iconBg)}>
                          <ItemIcon size={20} className={item.iconColor} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary transition-colors">
                              {item.title}
                            </h3>
                            {item.badge && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mt-0.5">
                            {item.description}
                          </p>
                        </div>

                        {/* Action Chevron */}
                        <div className="shrink-0 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all">
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
      <ClearCacheDrawer
        open={clearCacheOpen}
        onOpenChange={setClearCacheOpen}
      />

      {/* Drawer for Church and Ministry Terminology Customization */}
      <TerminologyDrawer
        open={terminologyOpen}
        onOpenChange={setTerminologyOpen}
      />
    </div>
  );
};

export default AdminDashboard;
