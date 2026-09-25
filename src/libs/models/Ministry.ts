import { EntityState, IChurchCampus } from './Church';
import { ReduxDefaultState } from './Redux';

export const MinistryStateEnum = {
  ...EntityState,
} as const;
export type MinistryStateEnum =
  (typeof MinistryStateEnum)[keyof typeof MinistryStateEnum];

export const MinistryAreaStateEnum = {
  ...EntityState,
} as const;
export type MinistryAreaStateEnum =
  (typeof MinistryAreaStateEnum)[keyof typeof MinistryAreaStateEnum];

export const MinistryAreaKidGroupStateEnum = {
  ...EntityState,
} as const;
export type MinistryAreaKidGroupStateEnum =
  (typeof MinistryAreaKidGroupStateEnum)[keyof typeof MinistryAreaKidGroupStateEnum];

export const MinistryGroupConfigStateEnum = {
  ...EntityState,
} as const;
export type MinistryGroupConfigStateEnum =
  (typeof MinistryGroupConfigStateEnum)[keyof typeof MinistryGroupConfigStateEnum];

export const ServiceAreaGroupStateEnum = {
  ...EntityState,
} as const;
export type ServiceAreaGroupStateEnum =
  (typeof ServiceAreaGroupStateEnum)[keyof typeof ServiceAreaGroupStateEnum];

export const MinistryType = {
  GENERAL: 'GENERAL',
  KIDS: 'KIDS',
} as const;
export type MinistryType = (typeof MinistryType)[keyof typeof MinistryType];

export interface IMinistry {
  id: string;
  churchCampusId: string;
  churchId: string;
  name: string;
  description?: string;
  type?: MinistryType;
  terminologyOverrides?: Record<string, string>;
  state?: MinistryStateEnum;
  createdAt?: string;
  updatedAt?: string;
  churchCampus?: IChurchCampus;
}

export interface IMinistryAreaKidGroupRelation {
  id: string;
  ministryAreaId: string;
  kidGroupId: string;
  state?: MinistryAreaKidGroupStateEnum;
}

export enum MinistryAreaScope {
  KID_REGISTRATION = 'KID_REGISTRATION',
  KID_GROUP_MANAGEMENT = 'KID_GROUP_MANAGEMENT',
  KID_SECURITY = 'KID_SECURITY',
}

export interface IMinistryArea {
  id: string;
  ministryId: string;
  churchCampusId?: string;
  name: string;
  description?: string;
  scope?: MinistryAreaScope | null;
  state?: MinistryAreaStateEnum;
  requiresSupervisor?: boolean;
  kidGroupId?: string;
  kidGroupIds?: string[];
  kidGroups?: IMinistryAreaKidGroupRelation[];
  ministry?: IMinistry;
}

export interface IMinistryGroupConfig {
  id: string;
  ministryId: string;
  churchCampusId?: string;
  name: string;
  position: number;
  state?: MinistryGroupConfigStateEnum;
  ministry?: IMinistry;
}

export interface IServiceAreaGroup {
  id: string;
  ministryAreaId: string;
  ministryGroupConfigId: string;
  churchCampusId: string;
  state?: ServiceAreaGroupStateEnum;
  ministryArea?: IMinistryArea;
  ministryGroupConfig?: IMinistryGroupConfig;
  churchCampus?: IChurchCampus;
}

export interface IMinistries extends ReduxDefaultState<IMinistry> {}
export interface IMinistryAreas extends ReduxDefaultState<IMinistryArea> {}
export interface IMinistryGroupConfigs extends ReduxDefaultState<IMinistryGroupConfig> {}
export interface IServiceAreaGroups extends ReduxDefaultState<IServiceAreaGroup> {}

export interface IMinistryWorkspaceSummary {
  totalTeams: number;
  teamsWithSupervisor: number;
  teamsRequiringSupervisor?: number;
  totalVolunteers: number;
  totalSupervisors: number;
}

export interface IMinistryWorkspaceSupervisor {
  assignmentId: string;
  volunteerId: string;
  churchMemberId: string;
  fullName: string;
  dialCodePhone?: string;
  phone?: string;
  photoUrl?: string;
  role: string;
}

export interface IMinistryWorkspaceTeam {
  id: string;
  ministryAreaId: string;
  ministryAreaName: string;
  ministryAreaScope?: MinistryAreaScope | null;
  requiresSupervisor?: boolean;
  ministryGroupConfigId: string;
  ministryGroupConfigName: string;
  churchCampusId: string;
  state?: ServiceAreaGroupStateEnum;
  supervisors: IMinistryWorkspaceSupervisor[];
  servidoresCount: number;
  totalMembersCount: number;
}

export interface IMinistryWorkspaceCoordinator {
  assignmentId: string;
  volunteerId: string;
  churchMemberId: string;
  fullName: string;
  dialCodePhone?: string;
  phone?: string;
  photoUrl?: string;
  role: string;
  ministryAreaId?: string;
  ministryAreaName?: string;
  ministryGroupConfigId?: string;
  ministryGroupConfigName?: string;
}

export interface IMinistryWorkspaceLeadership {
  generalCoordinators: IMinistryWorkspaceCoordinator[];
  areaCoordinators: IMinistryWorkspaceCoordinator[];
  groupCoordinators: IMinistryWorkspaceCoordinator[];
}

export interface IMinistryWorkspaceOverview {
  ministry?: IMinistry;
  campusMinistries: IMinistry[];
  summary: IMinistryWorkspaceSummary;
  groups: IMinistryGroupConfig[];
  areas: IMinistryArea[];
  teams: IMinistryWorkspaceTeam[];
  leadership: IMinistryWorkspaceLeadership;
}

export interface GetMinistryWorkspaceArgs {
  churchCampusId?: string;
  ministryId?: string;
}
