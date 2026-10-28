import React, { Suspense, useState, useEffect, lazy } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  ClipboardCheck,
  Settings,
  UserCheck,
  LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { usePermissions } from '@/libs/hooks/usePermissions';
import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';
import { useNavigationGuard } from '@/libs/context/NavigationGuardContext';
import { isFeatureEnabled } from '@/config/features';
import { APP_ROUTES } from '@/config/routes';

const SettingsModal = lazy(() => import('@/components/modal/SettingsModal'));
const KidChurchReportModal = lazy(() => import('@/components/modal/KidChurchReportModal'));

interface BottomNavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  action: 'link' | 'settings' | 'report';
}

/**
 * Dedicated Bottom Navigation Bar for the Kid Church workspace (`/kid-church`).
 * Cleanly separated from registration workflows.
 *
 * Rules:
 * - Attendance PDF report (KidChurchReportModal) -> Exclusively for Group Coordinators (`can('reports:view-attendance-pdf')`).
 * - Novedades / Incidents -> Exclusively for Group Coordinators (`can('reports:manage')`).
 * - Volunteer Attendance -> Group Coordinators with attendance permissions (`can('attendance:take-attendance')`).
 *
 * @returns {JSX.Element}
 */
export const KidChurchBottomNav: React.FC = () => {
  const { t } = useTranslation(['common']);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { requestNavigation } = useNavigationGuard();

  const [openSettings, setOpenSettings] = useState(false);
  const [hasOpenedSettings, setHasOpenedSettings] = useState(false);
  const [openReport, setOpenReport] = useState(false);
  const [hasOpenedReport, setHasOpenedReport] = useState(false);

  const handleOpenSettings = (open: boolean) => {
    if (open) setHasOpenedSettings(true);
    setOpenSettings(open);
  };

  useEffect(() => {
    const handleOpen = () => {
      handleOpenSettings(true);
    };
    window.addEventListener('app:open-settings', handleOpen);
    return () => window.removeEventListener('app:open-settings', handleOpen);
  }, []);

  const handleOpenReport = (open: boolean) => {
    if (open) setHasOpenedReport(true);
    setOpenReport(open);
  };

  const {
    canViewTeam,
    canTakeVolunteerAttendance,
    can,
  } = usePermissions();

  const { isConfigured } = useChurchMeetingStatus();

  // Auto-open configuration modal on first visit if meeting is not configured.
  // Note: Ministry coordinators do not bind to an individual service and must never be blocked.
  useEffect(() => {
    if (can('dashboard:view-ministry-coordinator')) return;
    if (!isConfigured && !openSettings) {
      handleOpenSettings(true);
    }
  }, [isConfigured, can]);

  const navItems: BottomNavItem[] = [
    {
      path: APP_ROUTES.kidChurch.root,
      icon: LayoutDashboard,
      label: t('navigation.dashboard', 'Dashboard'),
      action: 'link',
    },
  ];

  // Rule 1: Attendance PDF is strictly for group coordinators (can('reports:view-attendance-pdf'))
  if (can('reports:view-attendance-pdf')) {
    navItems.push({
      path: '#',
      icon: FileText,
      label: t('navigation.report'),
      action: 'report',
    });
  }

  // Rule 2: Novedades / Accidents is strictly for group coordinators (can('reports:manage'))
  if (isFeatureEnabled('churchReports') && can('reports:manage')) {
    navItems.push({
      path: APP_ROUTES.kidChurch.reports,
      icon: AlertTriangle,
      label: t('navigation.church_reports', 'Novedades'),
      action: 'link',
    });
  }

  if (canTakeVolunteerAttendance) {
    navItems.push({
      path: APP_ROUTES.kidChurch.volunteerAttendance,
      icon: ClipboardCheck,
      label: t('navigation.attendance'),
      action: 'link',
    });
  }

  navItems.push({
    path: '#',
    icon: Settings,
    label: t('navigation.configure'),
    action: 'settings',
  });

  if (canViewTeam) {
    navItems.push({
      path: APP_ROUTES.kidChurch.myTeam,
      icon: UserCheck,
      label: t('navigation.my_team'),
      action: 'link',
    });
  }

  return (
    <>
      <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[460px] z-40 pointer-events-none pb-safe">
        <nav className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-gray-200/80 shadow-xl shadow-black/10 rounded-full py-1.5 px-2 flex justify-between items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.path && item.action === 'link';
            const Icon = item.icon;

            const handleClick = (e: React.MouseEvent) => {
              e.preventDefault();
              if (item.action === 'settings') {
                handleOpenSettings(true);
                return;
              }
              if (item.action === 'report') {
                handleOpenReport(true);
                return;
              }

              const isKidChurchHomeClick =
                item.path === APP_ROUTES.kidChurch.root ||
                item.label === 'Dashboard' ||
                item.label === 'Niños' ||
                item.label === 'Niños Registrados';

              if (pathname === item.path) {
                if (isKidChurchHomeClick) {
                  window.dispatchEvent(new CustomEvent('reset-kid-church-dashboard'));
                }
                return;
              }

              if (isKidChurchHomeClick) {
                window.dispatchEvent(new CustomEvent('reset-kid-church-dashboard'));
                navigate(item.path);
                return;
              }

              if (requestNavigation(item.path)) navigate(item.path);
            };

            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={handleClick}
                className="flex flex-col items-center py-0.5 px-1 flex-1 group transition-transform active:scale-95 select-none cursor-pointer"
              >
                <div
                  className={clsx(
                    'w-11 sm:w-13 h-7 rounded-full flex items-center justify-center transition-all duration-200',
                    isActive
                      ? 'bg-primary/15 text-primary scale-105'
                      : 'text-gray-400 group-hover:text-gray-600',
                  )}
                >
                  <Icon
                    size={20}
                    className={clsx('transition-transform', isActive && 'stroke-[2.3px]')}
                  />
                </div>
                <span
                  className={clsx(
                    'text-[10px] tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[68px] text-center mt-0.5 transition-colors',
                    isActive
                      ? 'text-primary font-bold'
                      : 'text-gray-500 font-medium group-hover:text-gray-700',
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {hasOpenedSettings && (
        <Suspense fallback={null}>
          <SettingsModal open={openSettings} onOpenChange={handleOpenSettings} />
        </Suspense>
      )}

      {hasOpenedReport && (
        <Suspense fallback={null}>
          <KidChurchReportModal open={openReport} onOpenChange={handleOpenReport} />
        </Suspense>
      )}
    </>
  );
};

export default KidChurchBottomNav;
