/**
 * Capabilities (capacidades / permisos semánticos) soportados en el sistema.
 * En lugar de comprobar roles específicos (`isSupervisor`, `isAdmin`), la UI y los hooks
 * consultan si el usuario tiene una capacidad semántica de negocio.
 */
export type AppCapability =
  // Asistencia & Equipos
  | 'attendance:take-attendance'
  | 'attendance:view-cross-areas'
  | 'attendance:view-team'
  | 'attendance:override-status'
  | 'attendance:view-reports'
  // Reportes & Novedades
  | 'reports:manage'
  | 'reports:create-incident'
  | 'reports:create-guardian-call'
  | 'reports:delete'
  | 'reports:send-service-report'
  | 'reports:view-attendance-pdf'
  // Check-in & Registro
  | 'checkin:bypass-age-limit'
  | 'checkin:bypass-schedule'
  | 'checkin:delete-record'
  | 'checkin:delete-guardian-relation'
  | 'checkin:delete-kid'
  | 'checkin:view-log'
  | 'checkin:view-creator-info'
  | 'checkin:administer'
  // Gestión de Salones y Asignaciones
  | 'classroom:manage'
  | 'classroom:view-assigned-only'
  // Dashboards & Analítica
  | 'dashboard:view-group-coordinator'
  | 'dashboard:view-ministry-coordinator'
  // Plataforma Multi-Tenant & Configuración de Iglesia
  | 'platform:manage-churches'
  | 'church:manage-settings';

/**
 * Contexto mínimo necesario para resolver capabilities.
 */
export interface CapabilityContext {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isMinistryAdmin: boolean;
  isAreaCoordinator: boolean;
  isGroupCoordinator: boolean;
  isSupervisor: boolean;
  isServidor: boolean;
  canTakeVolunteerAttendance: boolean;
  canManageChurchReports: boolean;
  canViewTeam: boolean;
  canViewCreatorInfo: boolean;
  canViewRegistrationLog: boolean;
}

/**
 * Evalúa si el contexto del usuario cumple con una capacidad específica.
 *
 * @param {AppCapability} cap - Capacidad a evaluar.
 * @param {CapabilityContext} ctx - Contexto de roles y permisos del usuario.
 * @returns {boolean} True si tiene la capacidad otorgada.
 */
export const hasCapability = (cap: AppCapability, ctx: CapabilityContext): boolean => {
  switch (cap) {
    case 'attendance:take-attendance':
      return ctx.canTakeVolunteerAttendance;
    case 'attendance:view-cross-areas':
      return ctx.isSuperAdmin || ctx.isAdmin || ctx.isAreaCoordinator;
    case 'attendance:view-team':
      return ctx.canViewTeam;
    case 'attendance:override-status':
      return ctx.isSuperAdmin || ctx.isAdmin || ctx.isAreaCoordinator;
    case 'attendance:view-reports':
      return ctx.canManageChurchReports || ctx.isSuperAdmin;

    case 'reports:manage':
      return ctx.canManageChurchReports;
    case 'reports:create-incident':
    case 'reports:create-guardian-call':
      return ctx.canManageChurchReports;
    case 'reports:delete':
      return ctx.isSuperAdmin || ctx.isAdmin;
    case 'reports:send-service-report':
      // Service inventory & WhatsApp report: strictly for Registration Supervisors
      return !ctx.isServidor && ctx.isSupervisor && !ctx.isAreaCoordinator;
    case 'reports:view-attendance-pdf':
      // Attendance PDF report: strictly for Group Coordinators & General Admins
      return ctx.canManageChurchReports;

    case 'checkin:bypass-age-limit':
    case 'checkin:bypass-schedule':
      // Exclusively for Coordinators and General Administrators, hidden from Supervisors
      return ctx.isSuperAdmin || ctx.isAdmin || ctx.isAreaCoordinator;

    case 'checkin:delete-record':
      return ctx.isSupervisor || ctx.isAdmin;
    case 'checkin:delete-guardian-relation':
    case 'checkin:delete-kid':
      return ctx.isSuperAdmin || ctx.isAdmin;
    case 'checkin:view-log':
      return ctx.canViewRegistrationLog || ctx.isSupervisor || ctx.isAdmin;
    case 'checkin:view-creator-info':
      return ctx.canViewCreatorInfo;
    case 'checkin:administer':
      return ctx.isAdmin;

    case 'classroom:manage':
      return ctx.isGroupCoordinator || ctx.isAreaCoordinator || ctx.isAdmin;
    case 'classroom:view-assigned-only':
      return !ctx.isAreaCoordinator && !ctx.isAdmin;

    case 'dashboard:view-group-coordinator':
      return ctx.isSuperAdmin || ctx.isAdmin || ctx.isAreaCoordinator || ctx.isGroupCoordinator;
    case 'dashboard:view-ministry-coordinator':
      return ctx.isSuperAdmin || ctx.isAdmin || ctx.isMinistryAdmin;

    case 'platform:manage-churches':
      return ctx.isSuperAdmin;
    case 'church:manage-settings':
      return ctx.isSuperAdmin || ctx.isAdmin;

    default:
      return false;
  }
};
