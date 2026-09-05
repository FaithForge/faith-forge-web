import React, { useState } from 'react';
import { Home, UserPlus, QrCode, Settings, FileText, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import SettingsDrawer from '@/components/modal/SettingsDrawer';
import ReportDrawer from '@/components/modal/ReportDrawer';
import KidChurchReportDrawer from '@/components/modal/KidChurchReportDrawer';
import { APP_ROUTES } from '@/config/routes';
import { useNavigationGuard } from '@/libs/context/NavigationGuardContext';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { markKidsNeedsRefresh } from '@/libs/state/redux/slices/kid-church/kid.slice';
import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';
import { toast } from 'sonner';

const BottomNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { requestNavigation } = useNavigationGuard();
  
  const [openSettings, setOpenSettings] = useState(false);
  const [openReport, setOpenReport] = useState(false);

  const { isConfigured, shouldBlockKids, meetingErrorMsg } = useChurchMeetingStatus();

  const currentRole = useAppSelector(state => state.authSlice.currentRole);
  const isAdminRole = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';

  React.useEffect(() => {
    // Only force configuration if not an admin role
    if (!isAdminRole && !isConfigured && !openSettings) {
      setOpenSettings(true);
    }
  }, [isConfigured, openSettings, isAdminRole]);

  // If admin, hide the bottom navigation bar (matching legacy AdminLayout behavior)
  if (isAdminRole) {
    return null;
  }

  // Determine if the current role is a "Maestro" (USER) role
  const isMaestro = currentRole === 'KID_REGISTER_USER' || currentRole === 'KID_GROUP_USER';
  
  // Determine if the current role is Iglekids
  const isKidChurchRole = currentRole === 'KID_GROUP_ADMIN' || currentRole === 'KID_GROUP_SUPERVISOR' || currentRole === 'KID_GROUP_USER';

  let navItems = [];

  if (isKidChurchRole) {
    // Tabs for Iglekids (KidChurchLayout)
    navItems = [
      { path: APP_ROUTES.kidChurch.root, icon: Users, label: 'Niños Registrados', action: 'link' },
      { path: '#', icon: Settings, label: 'Configurar', action: 'settings' },
    ];
    if (!isMaestro) {
      navItems.push({ path: '#', icon: FileText, label: 'Reporte', action: 'report' });
    }
  } else {
    // Tabs for Regikids (KidRegistrationLayout)
    navItems = [
      { path: APP_ROUTES.kidRegistration.root, icon: Home, label: 'Inicio', action: 'link' },
      { path: APP_ROUTES.kidRegistration.new, icon: UserPlus, label: 'Crear Niño', action: 'link' },
      { path: APP_ROUTES.kidRegistration.scanner, icon: QrCode, label: 'Escanear QR', action: 'link' },
      { path: '#', icon: Settings, label: 'Configurar', action: 'settings' },
    ];
    if (!isMaestro) {
      navItems.push({ path: '#', icon: FileText, label: 'Reporte', action: 'report' });
    }
  }

  return (
    <>
      <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[460px] z-40 pointer-events-none pb-safe">
        <nav className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-gray-200/80 shadow-xl shadow-black/10 rounded-full py-1.5 px-2 flex justify-between items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.path && item.action === 'link';
            const isBlocked = shouldBlockKids && (item.label === 'Crear Niño' || item.label === 'Escanear QR');
            const Icon = item.icon;

            const handleClick = (e: React.MouseEvent) => {
              e.preventDefault();
              if (isBlocked) {
                toast.error(meetingErrorMsg || 'El servicio se encuentra fuera del horario de registro.');
                return;
              }
              if (item.action === 'settings') { setOpenSettings(true); return; }
              if (item.action === 'report') { setOpenReport(true); return; }

              const isRegikidsHomeClick = item.label === 'Inicio' || item.path === APP_ROUTES.kidRegistration.root;
              const isKidChurchHomeClick = item.label === 'Niños Registrados' || item.path === APP_ROUTES.kidChurch.root;

              // If already on the active tab:
              if (pathname === item.path) {
                if (isRegikidsHomeClick) {
                  dispatch(markKidsNeedsRefresh());
                  window.dispatchEvent(new CustomEvent('reset-registration-dashboard'));
                } else if (isKidChurchHomeClick) {
                  window.dispatchEvent(new CustomEvent('reset-kid-church-dashboard'));
                }
                return;
              }

              if (isRegikidsHomeClick) {
                dispatch(markKidsNeedsRefresh());
                window.dispatchEvent(new CustomEvent('reset-registration-dashboard'));
                navigate(item.path);
                return;
              }

              if (isKidChurchHomeClick) {
                window.dispatchEvent(new CustomEvent('reset-kid-church-dashboard'));
                navigate(item.path);
                return;
              }

              // Check navigation guard before navigating
              if (requestNavigation(item.path)) {
                navigate(item.path);
              }
            };

            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={handleClick}
                className={clsx(
                  "flex flex-col items-center py-0.5 px-1 flex-1 group transition-transform active:scale-95 select-none",
                  isBlocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                )}
              >
                {/* Pill container around icon (Telegram style) */}
                <div
                  className={clsx(
                    "w-11 sm:w-13 h-7 rounded-full flex items-center justify-center transition-all duration-200",
                    isBlocked
                      ? "text-gray-400"
                      : isActive
                      ? "bg-primary/15 text-primary scale-105"
                      : "text-gray-400 group-hover:text-gray-600"
                  )}
                >
                  <Icon
                    size={20}
                    className={clsx(
                      "transition-transform",
                      !isBlocked && isActive && "stroke-[2.3px]"
                    )}
                  />
                </div>
                <span
                  className={clsx(
                    "text-[10px] tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[68px] text-center mt-0.5 transition-colors",
                    isBlocked
                      ? "text-gray-400 font-medium"
                      : isActive
                      ? "text-primary font-bold"
                      : "text-gray-500 font-medium group-hover:text-gray-700"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Drawer Modals */}
      <SettingsDrawer open={openSettings} onOpenChange={setOpenSettings} />
      {isKidChurchRole ? (
        <KidChurchReportDrawer open={openReport} onOpenChange={setOpenReport} />
      ) : (
        <ReportDrawer open={openReport} onOpenChange={setOpenReport} />
      )}
    </>
  );
};

export default BottomNav;
