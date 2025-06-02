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


export const KidChurchAdminRoles = [
  UserRole.KID_CHURCH_ADMIN,
  UserRole.KID_REGISTER_ADMIN,
];

export const KidGroupAdminRoles = [UserRole.KID_GROUP_ADMIN];

export const KidChurchSupervisorRoles = [
  ...KidChurchAdminRoles,
  UserRole.KID_GROUP_SUPERVISOR,
];

export const KidChurchAndRegisterSupervisorRoles = [
  UserRole.KID_GROUP_SUPERVISOR,
  UserRole.KID_REGISTER_SUPERVISOR,
];

// Kid Registration
export const KidChurchRegisterSupervisorRoles = [
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

export const GetUserRoles = () => {
  const { user } = useSelector((state: RootState) => state.authSlice);
  return user?.roles as UserRole[];
};

export const IsAdmin = (roles: UserRole[]) => {
  if (!roles?.length) return false;
  return roles.some((role) => AdminRoles.includes(role));
};

export const IsAdminRegisterKidChurch = (roles: UserRole[]) => {
  if (!roles?.length) return false;
  return roles.some((role) => KidChurchAdminRoles.includes(role));
};

export const IsSupervisorRegisterKidChurch = (roles: UserRole[]) => {
  if (!roles?.length) return false;
  return roles.some((role) => KidChurchRegisterSupervisorRoles.includes(role));
};

export const IsSupervisorRegisterOrKidChurchSupervisor = (
  roles: UserRole[],
) => {
  if (!roles?.length) return false;
  return roles.some((role) =>
    KidChurchAndRegisterSupervisorRoles.includes(role),
  );
};

export const IsSupervisorKidChurch = (roles: UserRole[]) => {
  if (!roles?.length) return false;
  return roles.some((role) => KidChurchSupervisorRoles.includes(role));
};

export const IsRegisterKidChurch = (roles: UserRole[]) => {
  if (!roles?.length) return false;
  return roles.some((role) => KidChurchRegisterRoles.includes(role));
};

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

export const sortUserRolesByPriority = (roles: UserRole[]): UserRole[] => {
  return _.orderBy(
    roles,
    (role) => userRolePriority[role] ?? Number.MAX_SAFE_INTEGER,
    'asc',
  );
};

export const getMainUserRole = (roles: UserRole[]): UserRole | undefined => {
  return _.minBy(
    roles,
    (role) => userRolePriority[role] ?? Number.MAX_SAFE_INTEGER,
  );
};
