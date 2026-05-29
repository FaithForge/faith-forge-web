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
