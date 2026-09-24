import { AppRole, ChurchRole, UserRole } from '@/libs/utils/auth';

/**
 * Configuración centralizada de activación y visibilidad de roles en la aplicación.
 * Define qué roles cuentan con sus pantallas y flujos operativos completamente listos.
 *
 * Si un rol está en `false`, se oculta automáticamente del selector de roles ("Cambiar Rol")
 * tanto para Super Administradores como para el resto de usuarios, evitando el acceso
 * a módulos que aún están en desarrollo.
 */
export const ROLE_VISIBILITY_CONFIG: Record<AppRole, boolean> = {
  // Administración General
  [UserRole.SUPER_ADMIN]: true,
  [UserRole.ADMIN]: false,
  [UserRole.STAFF]: false,

  // Ministerio de Niños (Salones y clases)
  [ChurchRole.MINISTRY_ADMIN]: false,                  // Niños - Admin General
  [ChurchRole.KID_CHURCH_GROUP_COORDINATOR]: true,     // Niños - Coordinador de Grupo
  [ChurchRole.KID_CHURCH_SUPERVISOR]: true,            // Niños - Supervisor
  [ChurchRole.KID_CHURCH_USER]: false,                 // Niños - Servidor

  // Registro de Niños (Registro y acreditación)
  [ChurchRole.KID_REGISTER_COORDINATOR]: true,         // Registro - Coordinador
  [ChurchRole.KID_REGISTER_SUPERVISOR]: true,          // Registro - Supervisor
  [ChurchRole.KID_REGISTER_USER]: true,                // Registro - Servidor

  // Seguridad y Logística de Niños
  [ChurchRole.KID_SECURITY_COORDINATOR]: false,
  [ChurchRole.KID_SECURITY_SUPERVISOR]: false,
  [ChurchRole.KID_SECURITY_USER]: false,

  // Rol base de usuario
  [UserRole.USER]: false,
};

/**
 * Comprueba si un rol específico está actualmente habilitado en el sistema.
 *
 * @param {AppRole | string} role - Identificador del rol a consultar.
 * @returns {boolean} `true` si el rol está habilitado con vistas activas.
 */
export const isRoleEnabled = (role: AppRole | string): boolean => {
  return Boolean(ROLE_VISIBILITY_CONFIG[role as AppRole]);
};
