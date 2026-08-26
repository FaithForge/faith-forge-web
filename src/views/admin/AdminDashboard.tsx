import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  Loader2
} from 'lucide-react';
import { APP_ROUTES } from '@/config/routes';
import clsx from 'clsx';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import { CleanCache } from '@/libs/state/redux/thunks/admin/admin.thunk';
import { toast } from 'sonner';
import { useState } from 'react';

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

const ADMIN_CATEGORIES: AdminCategory[] = [
  {
    title: 'Gestión de Usuarios',
    description: 'Administración de cuentas, accesos, datos personales y perfiles del equipo.',
    icon: Users,
    items: [
      {
        id: 'user-management',
        title: 'Directorio de Usuarios y Roles',
        description: 'Consulta la lista de usuarios, gestiona información de perfiles y asigna o revoca roles del sistema.',
        icon: UserCog,
        route: APP_ROUTES.admin.users,
        iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        id: 'create-user',
        title: 'Crear Nuevo Usuario',
        description: 'Registra un nuevo miembro del equipo o voluntario en la plataforma.',
        icon: UserPlus,
        route: APP_ROUTES.admin.createUser,
        iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        iconColor: 'text-emerald-600',
      },
    ],
  },
  {
    title: 'Gestión de Servicios',
    description: 'Control de cultos, reuniones y horarios de apertura por campus.',
    icon: Church,
    items: [
      {
        id: 'service-status',
        title: 'Estado de Servicios por Sede',
        description: 'Habilita, deshabilita o cambia la visibilidad y disponibilidad de los servicios por sede.',
        icon: CalendarClock,
        route: APP_ROUTES.admin.churchMeetings,
        iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
        iconColor: 'text-amber-600',
      },
    ],
  },
  {
    title: 'Sistema',
    description: 'Tareas de mantenimiento, optimización y utilidades del sistema.',
    icon: Database,
    items: [
      {
        id: 'clear-cache',
        title: 'Borrar Caché',
        description: 'Limpia la caché del servidor para sincronizar datos modificados o forzar actualizaciones.',
        icon: Trash2,
        route: '',
        iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
        iconColor: 'text-rose-600',
      },
    ],
  },
];

/**
 * Vista Principal del Panel de Administración
 */
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  /**
   * Dispatches the CleanCache thunk and handles the response with toast notifications.
   *
   * @returns {Promise<void>} Resolves when the cache clearing operation is completed.
   */
  const handleClearCache = async () => {
    setIsClearing(true);
    const toastId = toast.loading('Borrando la caché del sistema...');
    try {
      await dispatch(CleanCache()).unwrap();
      toast.success('Caché borrada correctamente', { id: toastId });
    } catch (error) {
      toast.error('Error al borrar la caché del sistema', { id: toastId });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50/60 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 flex flex-col gap-6">
        {/* Page Header */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
            <Sparkles size={14} />
            <span>Módulo de Administración</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Panel de Control
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Selecciona una categoría para gestionar los usuarios, roles y servicios de la iglesia.
          </p>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col gap-6">
          {ADMIN_CATEGORIES.map((category, catIndex) => {
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
                          if (isClearing) return;
                          if (item.id === 'clear-cache') {
                            setConfirmOpen(true);
                          } else {
                            navigate(item.route);
                          }
                        }}
                        className={clsx(
                          'group flex items-center gap-3.5 p-4 sm:p-5 cursor-pointer transition-all duration-200',
                          'hover:bg-slate-50 active:bg-slate-100/80',
                          isClearing && item.id === 'clear-cache' && 'opacity-65 cursor-not-allowed'
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
                          {item.id === 'clear-cache' && isClearing ? (
                            <Loader2 size={18} className="animate-spin text-primary" />
                          ) : (
                            <ChevronRight size={18} />
                          )}
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

      {/* Confirm Modal for Cache Clearing */}
      <ConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Borrar Caché del Sistema"
        description="¿Estás seguro de que deseas borrar la caché del servidor? Esto podría causar una recarga temporal de la configuración y datos para todos los usuarios conectados."
        confirmText="Sí, borrar caché"
        cancelText="Cancelar"
        onConfirm={handleClearCache}
        type="warning"
      />
    </div>
  );
};

export default AdminDashboard;
