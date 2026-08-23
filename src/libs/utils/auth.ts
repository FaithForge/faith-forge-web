import _ from 'lodash';
import { useSelector } from 'react-redux';
import { RootState } from '../state/redux';

/** User Roles Enum */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',

  // Kid
  KID = 'KID',
  USER = 'USER',

  // Kid MS Roles
  KID_CHURCH_ADMIN = 'KID_CHURCH_ADMIN',
  KID_REGISTER_ADMIN = 'KID_REGISTER_ADMIN',
  KID_REGISTER_SUPERVISOR = 'KID_REGISTER_SUPERVISOR',
  KID_REGISTER_USER = 'KID_REGISTER_USER',
  KID_GROUP_ADMIN = 'KID_GROUP_ADMIN',
  KID_GROUP_SUPERVISOR = 'KID_GROUP_SUPERVISOR',
  KID_GROUP_USER = 'KID_GROUP_USER',
}

// ADMIN ROLES
export const AdminRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
export const ChurchRoles = [...AdminRoles, UserRole.STAFF];

export const KidChurchRegisterAdminRoles = [UserRole.KID_REGISTER_ADMIN];
export const KidChurchAdminRoles = [UserRole.KID_CHURCH_ADMIN];

export const KidGroupAdminRoles = [UserRole.KID_GROUP_ADMIN];

export const KidChurchSupervisorRoles = [
  ...KidChurchAdminRoles,
  ...KidGroupAdminRoles,
  UserRole.KID_GROUP_SUPERVISOR,
];

// Kid Registration
export const KidChurchRegisterSupervisorRoles = [
  UserRole.KID_REGISTER_ADMIN,
  UserRole.KID_REGISTER_SUPERVISOR,
];
export const KidChurchRegisterRoles = [
  UserRole.KID_REGISTER_ADMIN,
  UserRole.KID_REGISTER_SUPERVISOR,
  UserRole.KID_REGISTER_USER,
];

export const KidChurchGroupRoles = [
  UserRole.KID_GROUP_ADMIN,
  UserRole.KID_GROUP_SUPERVISOR,
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
export const IsAdmin = (roles: UserRole[]) => {
  if (!roles?.length) return false;
  return roles.some((role) => AdminRoles.includes(role));
};

/**
 * Checks whether the provided roles include a Kid Church admin role.
 *
 * @param {UserRole[]} roles - Array of user roles to check.
 * @returns {boolean} True if any Kid Church admin role is present.
 */
export const IsAdminKidChurch = (roles: UserRole[]) => {
  if (!roles?.length) return false;
  return roles.some((role) => KidChurchAdminRoles.includes(role));
};

/**
 * Checks whether the provided roles include a Kid Register admin role.
 *
 * @param {UserRole[]} roles - Array of user roles to check.
 * @returns {boolean} True if any Kid Register admin role is present.
 */
export const IsAdminKidRegisterChurch = (roles: UserRole[]) => {
  if (!roles?.length) return false;
  return roles.some((role) => KidChurchRegisterAdminRoles.includes(role));
};

/**
 * Checks whether the provided roles include a Kid Register supervisor role.
 *
 * @param {UserRole[]} roles - Array of user roles to check.
 * @returns {boolean} True if any Kid Register supervisor role is present.
 */
export const IsSupervisorRegisterKidChurch = (roles: UserRole[]) => {
  if (!roles?.length) return false;
  return roles.some((role) => KidChurchRegisterSupervisorRoles.includes(role));
};

/**
 * Checks whether the provided roles include a Kid Church supervisor role.
 *
 * @param {UserRole[]} roles - Array of user roles to check.
 * @returns {boolean} True if any Kid Church supervisor role is present.
 */
export const IsSupervisorKidChurch = (roles: UserRole[]) => {
  if (!roles?.length) return false;
  return roles.some((role) => KidChurchSupervisorRoles.includes(role));
};

/**
 * Checks whether the provided roles include a Kid Register role.
 *
 * @param {UserRole[]} roles - Array of user roles to check.
 * @returns {boolean} True if any Kid Register role is present.
 */
export const IsRegisterKidChurch = (roles: UserRole[]) => {
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

const userRolePriority: Record<UserRole, number> = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  STAFF: 3,
  KID_CHURCH_ADMIN: 4,
  KID_REGISTER_ADMIN: 5,
  KID_GROUP_ADMIN: 5,
  KID_REGISTER_SUPERVISOR: 6,
  KID_GROUP_SUPERVISOR: 6,
  KID_REGISTER_USER: 7,
  KID_GROUP_USER: 7,
  USER: 8,
  KID: 9,
};

/**
 * Sorts user roles by a configured priority map.
 *
 * @param {UserRole[]} roles - Array of user roles to sort.
 * @returns {UserRole[]} Roles ordered by priority (ascending).
 */
export const sortUserRolesByPriority = (roles: UserRole[]): UserRole[] => {
  return _.orderBy(roles, (role) => userRolePriority[role] ?? Number.MAX_SAFE_INTEGER, 'asc');
};

/**
 * Returns the main (highest priority) user role from a list.
 *
 * @param {UserRole[]} roles - Array of user roles to evaluate.
 * @returns {UserRole|undefined} The role with highest priority or `undefined` if none.
 */
export const getMainUserRole = (roles: UserRole[]): UserRole | undefined => {
  return _.minBy(roles, (role) => userRolePriority[role] ?? Number.MAX_SAFE_INTEGER);
};

export interface RoleMetadata {
  id: UserRole;
  name: string;
  category: string;
  description: string;
  badgeColor: string;
}

export const ALL_SYSTEM_ROLES_METADATA: Record<UserRole, RoleMetadata> = {
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
  [UserRole.KID_CHURCH_ADMIN]: {
    id: UserRole.KID_CHURCH_ADMIN,
    name: 'Iglekids - Admin General',
    category: 'Iglekids',
    description: 'Administrador general de iglesia infantil',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  [UserRole.KID_REGISTER_ADMIN]: {
    id: UserRole.KID_REGISTER_ADMIN,
    name: 'Regikids - Coordinador',
    category: 'Regikids',
    description: 'Coordinador del módulo de registro de niños',
    badgeColor: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  [UserRole.KID_REGISTER_SUPERVISOR]: {
    id: UserRole.KID_REGISTER_SUPERVISOR,
    name: 'Regikids - Supervisor',
    category: 'Regikids',
    description: 'Supervisión y control del flujo de registro',
    badgeColor: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  },
  [UserRole.KID_REGISTER_USER]: {
    id: UserRole.KID_REGISTER_USER,
    name: 'Regikids - Maestro / Servidor',
    category: 'Regikids',
    description: 'Atención y registro en mesas de entrada',
    badgeColor: 'bg-teal-100 text-teal-700 border-teal-200',
  },
  [UserRole.KID_GROUP_ADMIN]: {
    id: UserRole.KID_GROUP_ADMIN,
    name: 'Iglekids - Coordinador',
    category: 'Iglekids',
    description: 'Coordinador de actividades y salones infantiles',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  [UserRole.KID_GROUP_SUPERVISOR]: {
    id: UserRole.KID_GROUP_SUPERVISOR,
    name: 'Iglekids - Supervisor',
    category: 'Iglekids',
    description: 'Supervisor de salones y asistencia',
    badgeColor: 'bg-green-100 text-green-700 border-green-200',
  },
  [UserRole.KID_GROUP_USER]: {
    id: UserRole.KID_GROUP_USER,
    name: 'Iglekids - Maestro / Servidor',
    category: 'Iglekids',
    description: 'Maestro de salón y pase de lista',
    badgeColor: 'bg-lime-100 text-lime-700 border-lime-200',
  },
  [UserRole.USER]: {
    id: UserRole.USER,
    name: 'Usuario Regular',
    category: 'General',
    description: 'Usuario básico del sistema',
    badgeColor: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  [UserRole.KID]: {
    id: UserRole.KID,
    name: 'Niño',
    category: 'Niños',
    description: 'Perfil de niño registrado',
    badgeColor: 'bg-pink-100 text-pink-700 border-pink-200',
  },
};
