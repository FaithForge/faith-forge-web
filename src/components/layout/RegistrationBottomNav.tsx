import React, { Suspense, useState, useEffect, lazy } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  UserPlus,
  QrCode,
  FileText,
  Settings,
  UserCheck,
  LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import { markKidsNeedsRefresh } from '@/libs/state/redux/slices/kid-church/kid.slice';
import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';
import { usePermissions } from '@/libs/hooks/usePermissions';
import { useChurchTerm } from '@/libs/hooks/useTerm';
import { useNavigationGuard } from '@/libs/context/NavigationGuardContext';
import { APP_ROUTES } from '@/config/routes';

const SettingsModal = lazy(() => import('@/components/modal/SettingsModal'));
const RegistrationReportModal = lazy(() => import('@/components/modal/RegistrationReportModal'));

interface BottomNavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  action: 'link' | 'settings' | 'report';
}

/**
 * Dedicated Bottom Navigation Bar for the Kid Registration workspace (`/kid-registration`).
 * Cleanly isolated from Kid Church classroom and teacher operations.
 *
 * @returns {JSX.Element}
 */
export const RegistrationBottomNav: React.FC = () => {
  const { t } = useTranslation(['common']);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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

  const meetingTerm = useChurchTerm('meeting');
  const { isConfigured, shouldBlockKids, meetingErrorMsg } = useChurchMeetingStatus();

  // Auto-open configuration modal on first visit if meeting is not configured
  useEffect(() => {
    if (!isConfigured && !openSettings) {
      handleOpenSettings(true);
    }
  }, [isConfigured]);
  const { canViewTeam, can } = usePermissions();

  const navItems: BottomNavItem[] = [
    { path: APP_ROUTES.kidRegistration.root, icon: Home, label: t('navigation.home'), action: 'link' },
    { path: APP_ROUTES.kidRegistration.new, icon: UserPlus, label: t('navigation.new_kid'), action: 'link' },
    { path: APP_ROUTES.kidRegistration.scanner, icon: QrCode, label: t('navigation.scan_qr'), action: 'link' },
  ];

  // Service inventory & WhatsApp report: Exclusively for Registration Supervisors
  if (can('reports:send-service-report')) {
    navItems.push({ path: '#', icon: FileText, label: t('navigation.report'), action: 'report' });
  }

  navItems.push({ path: '#', icon: Settings, label: t('navigation.configure'), action: 'settings' });

  if (canViewTeam) {
    navItems.push({
      path: APP_ROUTES.kidRegistration.myTeam,
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
            const isKidAction =
              item.path === APP_ROUTES.kidRegistration.new ||
              item.path === APP_ROUTES.kidRegistration.scanner;
            const isBlocked = shouldBlockKids && isKidAction;
            const Icon = item.icon;

            const handleClick = (e: React.MouseEvent) => {
              e.preventDefault();
              if (isBlocked) {
                toast.error(
                  meetingErrorMsg || `La ${meetingTerm.toLowerCase()} se encuentra fuera del horario de registro.`,
                );
                return;
              }
              if (!isConfigured && isKidAction) {
                handleOpenSettings(true);
                toast.info(`Por favor selecciona la ${meetingTerm.toLowerCase()} a registrar antes de continuar.`);
                return;
              }
              if (item.action === 'settings') {
                handleOpenSettings(true);
                return;
              }
              if (item.action === 'report') {
                handleOpenReport(true);
                return;
              }

              const isRegistrationHomeClick =
                item.label === 'Inicio' || item.path === APP_ROUTES.kidRegistration.root;

              if (pathname === item.path) {
                if (isRegistrationHomeClick) {
                  dispatch(markKidsNeedsRefresh());
                  window.dispatchEvent(new CustomEvent('reset-registration-dashboard'));
                }
                return;
              }

              if (isRegistrationHomeClick) {
                dispatch(markKidsNeedsRefresh());
                window.dispatchEvent(new CustomEvent('reset-registration-dashboard'));
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
                className={clsx(
                  'flex flex-col items-center py-0.5 px-1 flex-1 group transition-transform active:scale-95 select-none',
                  isBlocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                )}
              >
                <div
                  className={clsx(
                    'w-11 sm:w-13 h-7 rounded-full flex items-center justify-center transition-all duration-200',
                    isBlocked
                      ? 'text-gray-400'
                      : isActive
                      ? 'bg-primary/15 text-primary scale-105'
                      : 'text-gray-400 group-hover:text-gray-600',
                  )}
                >
                  <Icon
                    size={20}
                    className={clsx('transition-transform', !isBlocked && isActive && 'stroke-[2.3px]')}
                  />
                </div>
                <span
                  className={clsx(
                    'text-[10px] tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[68px] text-center mt-0.5 transition-colors',
                    isBlocked
                      ? 'text-gray-400 font-medium'
                      : isActive
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
          <RegistrationReportModal open={openReport} onOpenChange={handleOpenReport} />
        </Suspense>
      )}
    </>
  );
};

export default RegistrationBottomNav;
