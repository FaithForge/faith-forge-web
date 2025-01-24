import { RootState } from '@faith-forge-web/state/redux';
import { useSelector } from 'react-redux';

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

export const AdminRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
export const ChurchRoles = [...AdminRoles, UserRole.STAFF];
export const KidChurchAdminRoles = [
  ...AdminRoles,
  UserRole.KID_CHURCH_ADMIN,
  UserRole.KID_REGISTER_ADMIN,
];
export const KidGroupAdminRoles = [
  ...KidChurchAdminRoles,
  UserRole.KID_GROUP_ADMIN,
];
export const KidChurchRegisterSupervisorRoles = [
  ...KidGroupAdminRoles,
  UserRole.KID_REGISTER_SUPERVISOR,
];
export const KidChurchSupervisorRoles = [
  ...KidGroupAdminRoles,
  UserRole.KID_GROUP_SUPERVISOR,
];
export const KidChurchAndRegisterSupervisorRoles = [
  ...KidGroupAdminRoles,
  UserRole.KID_GROUP_SUPERVISOR,
  UserRole.KID_REGISTER_SUPERVISOR,
];

export const KidChurchRegisterRoles = [
  ...AdminRoles,
  UserRole.KID_REGISTER_ADMIN,
  UserRole.KID_REGISTER_SUPERVISOR,
  UserRole.KID_REGISTER_USER,
];
export const KidChurchGroupRoles = [
  ...KidGroupAdminRoles,
  UserRole.KID_GROUP_ADMIN,
  UserRole.KID_GROUP_SUPERVISOR,
  UserRole.KID_GROUP_USER,
];

export const Test = [UserRole.KID_GROUP_USER];

const GetUserRoles = () => {
  const { user } = useSelector((state: RootState) => state.authSlice);
  return user?.roles as UserRole[];
};

export const IsAdminRegisterKidChurch = () => {
  const roles = GetUserRoles();
  if (!roles) return false;
  return roles.some((role) => KidChurchAdminRoles.includes(role));
};

export const IsSupervisorRegisterKidChurch = () => {
  const roles = GetUserRoles();
  if (!roles) return false;
  return roles.some((role) => KidChurchRegisterSupervisorRoles.includes(role));
};

export const IsSupervisorRegisterOrKidChurchSupervisor = () => {
  const roles = GetUserRoles();
  if (!roles) return false;
  return roles.some((role) =>
    KidChurchAndRegisterSupervisorRoles.includes(role),
  );
};

export const IsSupervisorKidChurch = () => {
  const roles = GetUserRoles();
  if (!roles) return false;
  return roles.some((role) => KidChurchSupervisorRoles.includes(role));
};

export const IsRegisterKidChurch = () => {
  const roles = GetUserRoles();
  if (!roles) return false;
  return roles.some((role) => KidChurchRegisterRoles.includes(role));
};

export const IsAllRole = () => {
  return true;
};
