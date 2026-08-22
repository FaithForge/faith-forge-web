import React, { useState } from 'react';
import { Home, UserPlus, QrCode, Settings, FileText } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import SettingsDrawer from '@/components/modal/SettingsDrawer';
import ReportDrawer from '@/components/modal/ReportDrawer';
import { APP_ROUTES } from '@/config/routes';

const BottomNav = () => {
  const { pathname } = useLocation();
  
  const [openSettings, setOpenSettings] = useState(false);
  const [openReport, setOpenReport] = useState(false);

  const navItems = [
    { path: APP_ROUTES.kidRegistration.root, icon: Home, label: 'Inicio', action: 'link' },
    { path: APP_ROUTES.kidRegistration.new, icon: UserPlus, label: 'Crear Niño', action: 'link' },
    { path: APP_ROUTES.scanner.root, icon: QrCode, label: 'Escanear QR', action: 'link' },
    { path: '#', icon: Settings, label: 'Configurar', action: 'settings' },
    { path: '#', icon: FileText, label: 'Reporte', action: 'report' },
  ];

  return (
    <>
      <nav className="fixed bottom-0 w-full bg-surface border-t border-gray-200 pb-safe pt-2 px-2 flex justify-between items-center z-50">
        {navItems.map((item) => {
          const isActive = pathname === item.path && item.action === 'link';
          const Icon = item.icon;

          const handleClick = (e: React.MouseEvent) => {
            if (item.action === 'settings') {
              e.preventDefault();
              setOpenSettings(true);
            } else if (item.action === 'report') {
              e.preventDefault();
              setOpenReport(true);
            }
          };

          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={handleClick}
              className={clsx(
                "flex flex-col items-center p-2 flex-1 transition-colors",
                isActive ? "text-primary" : "text-text-muted hover:text-text-main"
              )}
            >
              <Icon size={24} className={clsx("mb-1", isActive && "text-primary")} />
              <span className="text-[10px] font-medium whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Drawer Modals */}
      <SettingsDrawer open={openSettings} onOpenChange={setOpenSettings} />
      <ReportDrawer open={openReport} onOpenChange={setOpenReport} />
    </>
  );
};

export default BottomNav;
