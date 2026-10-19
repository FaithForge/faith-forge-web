import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  MapPin,
  CalendarClock,
  Printer,
  Layers,
  UserCheck,
  Users,
  UserPlus,
  Sparkles,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Star,
  X,
  ExternalLink,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { APP_ROUTES } from '@/config/routes';
import { useChurchTerm } from '@/libs/hooks/useTerm';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { UserRole } from '@/libs/utils/auth';
import { APP_VERSION } from '@/constants/version';

interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  exact?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  isMobileDrawer?: boolean;
  onOpenTerminology: () => void;
  onOpenClearCache: () => void;
  onOpenChangelog: () => void;
}

/**
 * Sidebar navigation component for church administration desktop layout.
 *
 * @param {AdminSidebarProps} props - Component properties.
 * @returns {JSX.Element} Rendered sidebar.
 */
export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  onCloseMobile,
  isMobileDrawer = false,
  onOpenTerminology,
  onOpenClearCache,
  onOpenChangelog,
}) => {
  const { t } = useTranslation(['admin', 'common']);
  const location = useLocation();
  const navigate = useNavigate();

  const user = useAppSelector((state) => state.authSlice.user);
  const experiences = useAppSelector((state) => state.authSlice.experiences) || [];
  const activeChurch = useAppSelector((state) => state.churchCampusSlice.church);
  const campuses = useAppSelector((state) => state.churchCampusSlice.data);
  const pendingApplicationsCount = useAppSelector((state) => state.volunteerApplicationSlice?.pendingCount ?? 0);

  const campusesTerm = useChurchTerm('campuses');
  const meetingsTerm = useChurchTerm('meetings');
  const volunteersTerm = useChurchTerm('volunteers');

  const isSuperAdmin = (user?.roles || []).includes(UserRole.SUPER_ADMIN);
  const isAdmin = (user?.roles || []).includes(UserRole.ADMIN);
  const hasMultipleSpaces = experiences.length > 1;

  const roleLabel = isSuperAdmin
    ? 'Super Admin'
    : isAdmin
    ? 'Administrador'
    : 'Staff';

  const sections: NavSection[] = [
    {
      title: 'PANEL DE CONTROL',
      items: [
        {
          id: 'dashboard',
          label: t('common:navigation.dashboard', { defaultValue: 'Dashboard' }),
          to: APP_ROUTES.admin.root,
          icon: LayoutDashboard,
          exact: true,
        },
      ],
    },
    {
      title: 'SEDES E INSTALACIONES',
      items: [
        {
          id: 'campuses',
          label: campusesTerm,
          to: APP_ROUTES.admin.campuses,
          icon: MapPin,
          badge: String(campuses?.length || 5),
          badgeColor: 'bg-slate-100 text-slate-600',
        },
        {
          id: 'church-meetings',
          label: meetingsTerm,
          to: APP_ROUTES.admin.churchMeetings,
          icon: CalendarClock,
        },
        {
          id: 'printers',
          label: t('admin:printers.header_title', { defaultValue: 'Gestión de Impresoras' }),
          to: APP_ROUTES.admin.printers,
          icon: Printer,
        },
      ],
    },
    {
      title: 'MINISTERIOS Y SERVIDORES',
      items: [
        {
          id: 'ministries',
          label: 'Gestión de Ministerios',
          to: APP_ROUTES.admin.ministries,
          icon: Layers,
        },
        {
          id: 'volunteer-applications',
          label: 'Solicitudes',
          to: APP_ROUTES.admin.volunteerApplications,
          icon: UserCheck,
          badge: `${pendingApplicationsCount > 0 ? pendingApplicationsCount : 3} pend.`,
          badgeColor: 'bg-amber-100 text-amber-800',
        },
      ],
    },
    {
      title: 'GESTIÓN DE USUARIOS',
      items: [
        {
          id: 'users',
          label: 'Directorio de Usuarios',
          to: APP_ROUTES.admin.users,
          icon: Users,
        },
        {
          id: 'create-user',
          label: 'Crear Nuevo Usuario',
          to: APP_ROUTES.admin.createUser,
          icon: UserPlus,
        },
      ],
    },
  ];

  const handleNavClick = () => {
    if (isMobileDrawer && onCloseMobile) {
      onCloseMobile();
    }
  };

  const isItemActive = (item: NavItem) => {
    if (item.exact) {
      return location.pathname === item.to;
    }
    return location.pathname.startsWith(item.to);
  };

  return (
    <aside
      className={clsx(
        'h-full flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 select-none z-30 shrink-0',
        collapsed && !isMobileDrawer ? 'w-20' : 'w-72'
      )}
    >
      {/* Sidebar Header: Brand & Church Name */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
          </div>
          {(!collapsed || isMobileDrawer) && (
            <div className="min-w-0 flex flex-col">
              <span className="font-extrabold text-sm text-slate-900 truncate leading-tight tracking-tight">
                {activeChurch?.name || 'Iglesia Rios de Vida'}
              </span>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full w-fit mt-0.5">
                {roleLabel}
              </span>
            </div>
          )}
        </div>

        {isMobileDrawer ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={t('common:actions.close', { defaultValue: 'Cerrar' })}
          >
            <X size={18} />
          </button>
        ) : (
          onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={clsx(
                'w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors',
                collapsed && 'mx-auto'
              )}
              title={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            {(!collapsed || isMobileDrawer) && (
              <h2 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {section.title}
              </h2>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const ItemIcon = item.icon;
                const active = isItemActive(item);

                return (
                  <NavLink
                    key={item.id}
                    to={item.to}
                    onClick={handleNavClick}
                    title={collapsed && !isMobileDrawer ? item.label : undefined}
                    className={clsx(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                      active
                        ? 'bg-indigo-50/70 text-indigo-700 font-bold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900',
                      collapsed && !isMobileDrawer && 'justify-center px-0'
                    )}
                  >
                    <div
                      className={clsx(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                        active
                          ? 'text-indigo-600'
                          : 'text-slate-400 group-hover:text-slate-700'
                      )}
                    >
                      <ItemIcon size={18} />
                    </div>

                    {(!collapsed || isMobileDrawer) && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}

                    {(!collapsed || isMobileDrawer) && item.badge && (
                      <span className={clsx('px-2 py-0.5 text-[10px] font-bold rounded-full', item.badgeColor || 'bg-slate-100 text-slate-600')}>
                        {item.badge}
                      </span>
                    )}

                    {(!collapsed || isMobileDrawer) && active && !item.badge && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 ml-auto" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}

        {/* Configuration Actions Section (SISTEMA) */}
        <div className="space-y-1">
          {(!collapsed || isMobileDrawer) && (
            <h2 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              SISTEMA
            </h2>
          )}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                handleNavClick();
                onOpenTerminology();
              }}
              title={collapsed && !isMobileDrawer ? 'Vocabulario & Reglas' : undefined}
              className={clsx(
                'w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 transition-colors cursor-pointer',
                collapsed && !isMobileDrawer && 'justify-center px-0'
              )}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-slate-400 group-hover:text-slate-700">
                <Sparkles size={18} />
              </div>
              {(!collapsed || isMobileDrawer) && (
                <span className="truncate flex-1 text-left">Vocabulario & Reglas</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                handleNavClick();
                onOpenClearCache();
              }}
              title={collapsed && !isMobileDrawer ? 'Borrar Caché' : undefined}
              className={clsx(
                'w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 transition-colors cursor-pointer',
                collapsed && !isMobileDrawer && 'justify-center px-0'
              )}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-slate-400 group-hover:text-slate-700">
                <RotateCcw size={18} />
              </div>
              {(!collapsed || isMobileDrawer) && (
                <span className="truncate flex-1 text-left">Borrar Caché</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Footer: App Switcher & Version */}
      <div className="p-3 border-t border-slate-100 bg-white space-y-2 shrink-0">
        {hasMultipleSpaces && (
          <button
            type="button"
            onClick={() => navigate(APP_ROUTES.hub)}
            title={collapsed && !isMobileDrawer ? 'Cambiar a Espacio Móvil' : undefined}
            className={clsx(
              'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer',
              collapsed && !isMobileDrawer && 'justify-center px-0'
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <LayoutGrid size={16} className="text-slate-500 shrink-0" />
              {(!collapsed || isMobileDrawer) && (
                <span className="truncate">Cambiar de espacio</span>
              )}
            </div>
            {(!collapsed || isMobileDrawer) && <ExternalLink size={13} className="text-slate-400 shrink-0" />}
          </button>
        )}

        {(!collapsed || isMobileDrawer) ? (
          <button
            type="button"
            onClick={onOpenChangelog}
            className="w-full text-center text-[11px] text-slate-400 hover:text-slate-600 transition-colors py-1 cursor-pointer"
          >
            v{APP_VERSION} · <span className="underline decoration-dotted">Ver novedades</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenChangelog}
            title={`v${APP_VERSION} - Novedades`}
            className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors py-1 cursor-pointer"
          >
            v{APP_VERSION}
          </button>
        )}
      </div>
    </aside>
  );
};
