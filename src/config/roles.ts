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

  // Ministerio de Niños (Salones y grupos)
  [ChurchRole.MINISTRY_ADMIN]: false,      // Niños - Admin General
  [UserRole.KID_GROUP_ADMIN]: true,         // Niños - Coordinador
  [UserRole.KID_GROUP_SUPERVISOR]: true,    // Niños - Supervisor
  [UserRole.KID_GROUP_USER]: false,         // Niños - Servidor

  // Registro de Niños (Registro y acreditación)
  [UserRole.KID_REGISTER_ADMIN]: true,      // Registro - Coordinador
  [UserRole.KID_REGISTER_SUPERVISOR]: true, // Registro - Supervisor
  [UserRole.KID_REGISTER_USER]: true,       // Registro - Servidor

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
