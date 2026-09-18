import { useSelector } from 'react-redux';
import { RootState } from '../state/redux';

/** Church and Ministry domain roles */
export enum ChurchRole {
  MINISTRY_ADMIN = 'MINISTRY_ADMIN',
}

/** User Roles Enum */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',

  USER = 'USER',

  // Kid MS Roles
  KID_REGISTER_ADMIN = 'KID_REGISTER_ADMIN',
  KID_REGISTER_SUPERVISOR = 'KID_REGISTER_SUPERVISOR',
  KID_REGISTER_USER = 'KID_REGISTER_USER',
  KID_GROUP_ADMIN = 'KID_GROUP_ADMIN',
  KID_GROUP_SUPERVISOR = 'KID_GROUP_SUPERVISOR',
  KID_GROUP_USER = 'KID_GROUP_USER',
}

export type AppRole = UserRole | ChurchRole;
export const AppRole = { ...UserRole, ...ChurchRole };

/** User Experience Spaces Enum */
export enum UserExperienceEnum {
  ADMIN = 'ADMIN',
  KID_CHURCH_STAFF = 'KID_CHURCH_STAFF',
  KID_GUARDIAN = 'KID_GUARDIAN',
}


// ADMIN ROLES
export const AdminRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
export const ChurchRoles = [...AdminRoles, UserRole.STAFF];

export const KidChurchRegisterAdminRoles: AppRole[] = [
  ...AdminRoles,
  UserRole.KID_REGISTER_ADMIN,
];
export const KidChurchAdminRoles: AppRole[] = [
  ...AdminRoles,
  ChurchRole.MINISTRY_ADMIN,
];

export const KidGroupAdminRoles: AppRole[] = [
  ...KidChurchAdminRoles,
  UserRole.KID_GROUP_ADMIN,
];

export const KidChurchSupervisorRoles: AppRole[] = [
  ...KidChurchAdminRoles,
  ...KidGroupAdminRoles,
  UserRole.KID_GROUP_SUPERVISOR,
];

// Kid Registration
export const KidChurchRegisterSupervisorRoles: AppRole[] = [
  ...KidChurchRegisterAdminRoles,
  UserRole.KID_REGISTER_SUPERVISOR,
];
export const KidChurchRegisterRoles: AppRole[] = [
  ...KidChurchRegisterSupervisorRoles,
  UserRole.KID_REGISTER_USER,
];

export const KidChurchGroupRoles: AppRole[] = [
  ...KidChurchSupervisorRoles,
  UserRole.KID_GROUP_USER,
];

/**
 * Returns the roles for the current authenticated user.
 *
 * @returns {UserRole[]} The current user's roles.
 */
export const GetUserRoles = () => {
  const { user } = useSelector((state: RootState) => state.authSlice);
  return user?.roles as UserRole[];
};

/**
 * Returns the roles for the current authenticated user.
 *
 * @returns {UserRole[]} The current user's roles.
 */

/**
 * Checks whether the provided roles include an admin role.
 *
 * @param {UserRole[]} roles - Array of user roles to check.
 * @returns {boolean} True if any admin role is present.
 */
export const IsAdmin = (roles: (UserRole | ChurchRole)[]) => {
  if (!roles?.length) return false;
  return roles.some((role) => AdminRoles.includes(role as UserRole));
};

/**
 * Checks whether the provided roles include a Kid Church admin role.
 *
 * @param {(UserRole | ChurchRole)[]} roles - Array of user roles to check.
 * @returns {boolean} True if any Kid Church admin role is present.
 */
export const IsAdminKidChurch = (roles: (UserRole | ChurchRole)[]) => {
  if (!roles?.length) return false;
  return roles.some((role) => KidChurchAdminRoles.includes(role));
};

/**
 * Checks whether the provided roles include a Kid Register admin role.
 *
 * @param {(UserRole | ChurchRole)[]} roles - Array of user roles to check.
 * @returns {boolean} True if any Kid Register admin role is present.
 */
export const IsAdminKidRegisterChurch = (roles: (UserRole | ChurchRole)[]) => {
  if (!roles?.length) return false;
  return roles.some((role) => KidChurchRegisterAdminRoles.includes(role));
};

/**
 * Checks whether the provided roles include a Kid Register supervisor role.
 *
 * @param {(UserRole | ChurchRole)[]} roles - Array of user roles to check.
 * @returns {boolean} True if any Kid Register supervisor role is present.
 */
export const IsSupervisorRegisterKidChurch = (roles: (UserRole | ChurchRole)[]) => {
  if (!roles?.length) return false;
  return roles.some((role) => KidChurchRegisterSupervisorRoles.includes(role));
};

/**
 * Checks whether the provided roles include a Kid Church supervisor role.
 *
 * @param {(UserRole | ChurchRole)[]} roles - Array of user roles to check.
 * @returns {boolean} True if any Kid Church supervisor role is present.
 */
export const IsSupervisorKidChurch = (roles: (UserRole | ChurchRole)[]) => {
  if (!roles?.length) return false;
  return roles.some((role) => KidChurchSupervisorRoles.includes(role));
};

/**
 * Checks whether the provided roles include a Kid Register role.
 *
 * @param {(UserRole | ChurchRole)[]} roles - Array of user roles to check.
 * @returns {boolean} True if any Kid Register role is present.
 */
export const IsRegisterKidChurch = (roles: (UserRole | ChurchRole)[]) => {
  if (!roles?.length) return false;
  return roles.some((role) => KidChurchRegisterRoles.includes(role));
};

/**
 * Placeholder that always returns true for role checks where any role is acceptable.
 *
 * @returns {boolean} Always true.
 */
export const IsAllRole = () => {
  return true;
};

export const ALL_SYSTEM_ROLES_ORDER: AppRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.STAFF,
  ChurchRole.MINISTRY_ADMIN,
  UserRole.KID_GROUP_ADMIN,
  UserRole.KID_GROUP_SUPERVISOR,
  UserRole.KID_GROUP_USER,
  UserRole.KID_REGISTER_ADMIN,
  UserRole.KID_REGISTER_SUPERVISOR,
  UserRole.KID_REGISTER_USER,
];

const userRolePriority: Record<string, number> = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  STAFF: 3,
  MINISTRY_ADMIN: 4,
  KID_GROUP_ADMIN: 5,
  KID_REGISTER_ADMIN: 5,
  KID_GROUP_SUPERVISOR: 6,
  KID_REGISTER_SUPERVISOR: 6,
  KID_GROUP_USER: 7,
  KID_REGISTER_USER: 7,
  USER: 8,
};

/**
 * Sorts user roles by a configured priority map.
 *
 * @param {UserRole[]} roles - Array of user roles to sort.
 * @returns {UserRole[]} Roles ordered by priority (ascending).
 */
export const sortUserRolesByPriority = (roles: UserRole[]): UserRole[] => {
  return [...roles].sort(
    (a, b) =>
      (userRolePriority[a] ?? Number.MAX_SAFE_INTEGER) -
      (userRolePriority[b] ?? Number.MAX_SAFE_INTEGER),
  );
};

/**
 * Returns the main (highest priority) user role from a list.
 *
 * @param {UserRole[]} roles - Array of user roles to evaluate.
 * @returns {UserRole|undefined} The role with highest priority or `undefined` if none.
 */
export const getMainUserRole = (roles: UserRole[]): UserRole | undefined => {
  if (!roles || roles.length === 0) return undefined;
  return roles.reduce((best, current) => {
    const bestPriority = userRolePriority[best] ?? Number.MAX_SAFE_INTEGER;
    const currentPriority = userRolePriority[current] ?? Number.MAX_SAFE_INTEGER;
    return currentPriority < bestPriority ? current : best;
  });
};

/**
 * Checks whether a user only has the base USER role or has no operational system roles assigned.
 *
 * @param {(UserRole | ChurchRole | string)[]} [roles] - Array of user roles to evaluate.
 * @returns {boolean} True if the user has no operational roles assigned.
 */
export const hasOnlyBaseUserRole = (roles?: (UserRole | ChurchRole | string)[]): boolean => {
  if (!roles || roles.length === 0) return true;
  const operationalRoles = roles.filter(
    (role) => role !== UserRole.USER && (role as string) !== 'USER'
  );
  return operationalRoles.length === 0;
};

export interface RoleMetadata {
  id: AppRole;
  name: string;
  category: string;
  description: string;
  badgeColor: string;
}

export const ALL_SYSTEM_ROLES_METADATA: Record<AppRole, RoleMetadata> = {
  [UserRole.SUPER_ADMIN]: {
    id: UserRole.SUPER_ADMIN,
    name: 'Super Administrador',
    category: 'Administración General',
    description: 'Acceso total y configuración del sistema',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  [UserRole.ADMIN]: {
    id: UserRole.ADMIN,
    name: 'Administrador',
    category: 'Administración General',
    description: 'Gestión global de usuarios, sedes y servicios',
    badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  },
  [UserRole.STAFF]: {
    id: UserRole.STAFF,
    name: 'Staff',
    category: 'General',
    description: 'Personal de apoyo de la iglesia',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  [ChurchRole.MINISTRY_ADMIN]: {
    id: ChurchRole.MINISTRY_ADMIN,
    name: 'Niños - Admin General',
    category: 'Ministerio de Niños',
    description: 'Administrador general del ministerio infantil',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  [UserRole.KID_REGISTER_ADMIN]: {
    id: UserRole.KID_REGISTER_ADMIN,
    name: 'Registro - Coordinador',
    category: 'Registro de Niños',
    description: 'Coordinador del módulo de registro de niños',
    badgeColor: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  [UserRole.KID_REGISTER_SUPERVISOR]: {
    id: UserRole.KID_REGISTER_SUPERVISOR,
    name: 'Registro - Supervisor',
    category: 'Registro de Niños',
    description: 'Supervisión y control del flujo de registro',
    badgeColor: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  },
  [UserRole.KID_REGISTER_USER]: {
    id: UserRole.KID_REGISTER_USER,
    name: 'Registro - Servidor',
    category: 'Registro de Niños',
    description: 'Atención y registro en mesas de entrada',
    badgeColor: 'bg-teal-100 text-teal-700 border-teal-200',
  },
  [UserRole.KID_GROUP_ADMIN]: {
    id: UserRole.KID_GROUP_ADMIN,
    name: 'Niños - Coordinador',
    category: 'Ministerio de Niños',
    description: 'Coordinador de actividades y salones infantiles',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  [UserRole.KID_GROUP_SUPERVISOR]: {
    id: UserRole.KID_GROUP_SUPERVISOR,
    name: 'Niños - Supervisor',
    category: 'Ministerio de Niños',
    description: 'Supervisor de salones y asistencia',
    badgeColor: 'bg-green-100 text-green-700 border-green-200',
  },
  [UserRole.KID_GROUP_USER]: {
    id: UserRole.KID_GROUP_USER,
    name: 'Niños - Servidor',
    category: 'Ministerio de Niños',
    description: 'Servidor de salón y pase de lista',
    badgeColor: 'bg-lime-100 text-lime-700 border-lime-200',
  },
  [UserRole.USER]: {
    id: UserRole.USER,
    name: 'Usuario Regular',
    category: 'General',
    description: 'Usuario básico del sistema',
    badgeColor: 'bg-gray-100 text-gray-700 border-gray-200',
  },
};

export interface MinistryRoleGroup {
  id: string;
  label: string;
  description: string;
  roles: AppRole[];
}

export const MINISTRY_ROLE_GROUPS: MinistryRoleGroup[] = [
  {
    id: 'KID_REGISTRATION',
    label: 'Registro de Niños',
    description: 'Módulo de registro, recepción y acreditación de niños',
    roles: [
      UserRole.KID_REGISTER_USER,
      UserRole.KID_REGISTER_SUPERVISOR,
      UserRole.KID_REGISTER_ADMIN,
    ],
  },
  {
    id: 'KID_CHURCH',
    label: 'Ministerio de Niños',
    description: 'Módulo de clases infantiles, salones y actividades',
    roles: [
      UserRole.KID_GROUP_USER,
      UserRole.KID_GROUP_SUPERVISOR,
      UserRole.KID_GROUP_ADMIN,
      ChurchRole.MINISTRY_ADMIN,
    ],
  },
  {
    id: 'ADMINISTRATION',
    label: 'Administración General',
    description: 'Gestión global de la congregación, sedes y personal',
    roles: [
      UserRole.ADMIN,
      UserRole.STAFF,
    ],
  },
];

export const ALL_ASSIGNABLE_ROLES: AppRole[] = MINISTRY_ROLE_GROUPS.flatMap((g) => g.roles);
