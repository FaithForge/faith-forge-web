import React, { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { User, LogOut, Settings, ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';
import { APP_ROUTES } from "@/config/routes";
import { useNavigate } from 'react-router-dom';

const roles = [
  { id: 'registrar', label: 'Registrador', theme: 'theme-registrar', themeColor: '#0284c7' },
  { id: 'tutor', label: 'Tutor', theme: 'theme-tutor', themeColor: '#4f46e5' },
  { id: 'admin', label: 'Administrador', theme: 'theme-admin', themeColor: '#059669' },
];

const TopBar = () => {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState(roles[0]);

  const changeRole = (role: typeof roles[0]) => {
    setActiveRole(role);
    // Cambiar la clase en el body para aplicar el tema de colores
    document.body.className = `${role.theme} antialiased`;
    
    // Actualizar el meta theme-color del navegador para que cambie la barra nativa de Android/iOS
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', role.themeColor);
    }
  };

  React.useEffect(() => {
    // Sincronizar el estado inicial
    changeRole(activeRole);
  }, []);

  return (
    <header className="bg-primary text-primary-foreground px-4 py-2 flex justify-between items-center shrink-0 transition-colors duration-300 shadow-sm z-20 relative">
      
      {/* Lado Izquierdo: Menú de Roles */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="flex items-center gap-2 outline-none rounded-lg p-1 hover:bg-black/10 transition-colors">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 p-1">
             <img src="/logo-iglekids.png" alt="Iglekids" className="w-full h-full object-contain drop-shadow-sm" />
          </div>
          <div className="text-left">
            <h1 className="font-bold leading-tight">Regikids</h1>
            <div className="flex items-center gap-1 text-xs uppercase tracking-wider opacity-90 font-medium">
              Rol: {activeRole.label}
              <ChevronDown size={12} />
            </div>
          </div>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content 
            className="bg-surface text-text-main rounded-xl shadow-lg border border-gray-100 p-2 min-w-[200px] z-50 animate-in fade-in zoom-in-95 duration-200"
            sideOffset={8}
            align="start"
          >
            <div className="text-xs font-bold text-text-muted mb-2 px-2 pt-1 uppercase">Cambiar Rol</div>
            {roles.map(role => (
              <DropdownMenu.Item
                key={role.id}
                onSelect={() => changeRole(role)}
                className={clsx(
                  "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer outline-none transition-colors text-sm",
                  activeRole.id === role.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-gray-100"
                )}
              >
                {role.label}
                {activeRole.id === role.id && <Check size={16} />}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Lado Derecho: Notificaciones y Avatar de Usuario */}
      <div className="flex items-center gap-3">
        {/* Notificaciones (Ocultas por ahora) */}
        {/* 
        <div className="relative">
          <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">2</span>
          <div className="w-6 h-6 bg-white/20 rounded-full"></div>
        </div>
        */}

        {/* Menú de Usuario */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="outline-none rounded-full ring-2 ring-transparent hover:ring-white/30 transition-all">
            <div className="w-9 h-9 rounded-full bg-black/20 text-sm flex items-center justify-center font-bold">
              CR
            </div>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content 
              className="bg-surface text-text-main rounded-xl shadow-lg border border-gray-100 p-2 min-w-[180px] z-50 animate-in fade-in zoom-in-95 duration-200"
              sideOffset={8}
              align="end"
            >
              <div className="px-3 py-2 border-b border-gray-100 mb-1">
                <p className="font-bold text-sm">Carlos Rodríguez</p>
                <p className="text-xs text-text-muted">carlos@example.com</p>
              </div>
              
              <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer outline-none hover:bg-gray-100 transition-colors text-sm">
                <Settings size={16} className="text-text-muted" />
                Configuración
              </DropdownMenu.Item>
              
              <DropdownMenu.Item 
                onSelect={() => navigate(APP_ROUTES.auth.login)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer outline-none hover:bg-red-50 text-red-600 transition-colors text-sm mt-1"
              >
                <LogOut size={16} />
                Cerrar Sesión
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      
    </header>
  );
};

export default TopBar;
