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
      <nav className="shrink-0 w-full bg-surface border-t border-gray-200 pb-safe pt-2 px-2 flex justify-between items-center z-50">
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
                "flex flex-col items-center p-2 flex-1 transition-all",
                isBlocked ? "opacity-40 cursor-not-allowed text-gray-400"
                : isActive ? "text-primary" 
                : "text-text-muted hover:text-text-main"
              )}
            >
              <Icon size={24} className={clsx("mb-1", !isBlocked && isActive && "text-primary")} />
              <span className="text-[10px] font-medium whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{item.label}</span>
            </Link>
          );
        })}
      </nav>

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
