import {
  EntityState,
  IChurchCampus,
  IChurchMeeting,
} from './Church';
import { ReduxDefaultState } from './Redux';

export enum MinistryMeetingGroupAssignmentKind {
  ROTATION = 'ROTATION',
  SINGLE_DATE = 'SINGLE_DATE',
}

export const MinistryMeetingGroupAssignmentStateEnum = {
  ...EntityState,
} as const;
export type MinistryMeetingGroupAssignmentStateEnum =
  (typeof MinistryMeetingGroupAssignmentStateEnum)[keyof typeof MinistryMeetingGroupAssignmentStateEnum];

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
  KID_MEDICAL = 'KID_MEDICAL',
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

export interface GetMinistryAnalyticsArgs {
  id: string;
  churchCampusId?: string;
  from?: string;
  to?: string;
  date?: string;
  churchMeetingIds?: string[];
  tagId?: string;
}

export interface IMinistryMeetingGroupAssignment {
  id: string;
  ministryId: string;
  churchMeetingId: string;
  kind: MinistryMeetingGroupAssignmentKind;
  intervalWeeks: number;
  startDate: string;
  endDate?: string | null;
  groupSequence: string[][];
  notes?: string | null;
  state: MinistryMeetingGroupAssignmentStateEnum;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICalendarMeetingInstance {
  instanceId: string;
  serviceDate: string;
  meeting: IChurchMeeting;
  isCancelled: boolean;
  exceptionId?: string;
  exceptionReason?: string | null;
  scheduledGroupIds: string[];
  scheduledGroups: IMinistryGroupConfig[];
  isSingleDateAssignment: boolean;
  singleDateAssignmentId?: string;
  assignmentNotes?: string | null;
  rotationAssignmentId?: string;
  rotationIntervalWeeks?: number;
  rotationStartDate?: string;
}

export interface GetCalendarMeetingsArgs {
  churchCampusId: string;
  ministryId?: string;
  from: string;
  to: string;
  tagId?: string;
}

export interface UpsertMinistryMeetingGroupAssignmentPayload {
  id?: string;
  ministryId: string;
  churchMeetingId: string;
  kind?: MinistryMeetingGroupAssignmentKind;
  intervalWeeks?: number;
  startDate: string;
  endDate?: string | null;
  groupSequence: string[][];
  notes?: string | null;
  state?: MinistryMeetingGroupAssignmentStateEnum;
}

export interface UpsertChurchMeetingExceptionPayload {
  churchMeetingId: string;
  churchCampusId: string;
  exceptionDate: string;
  reason?: string;
}

export interface IVolunteerMeetingStatAreaBreakdown {
  areaId: string;
  areaName: string;
  scope?: string;
  totalAssigned: number;
  attended: number;
  excused: number;
  unexcused: number;
}

export interface IVolunteerMeetingStatGroupBreakdown {
  groupId: string;
  groupName: string;
  areaId?: string;
  areaName?: string;
  totalAssigned: number;
  attended: number;
  excused: number;
  unexcused: number;
}

export interface IVolunteerMeetingStatHistory {
  totalAssigned: number;
  attended: number;
  excused: number;
  unexcused: number;
  attendancePercent: number;
  scheduledGroupIds?: string[];
  byArea: IVolunteerMeetingStatAreaBreakdown[];
  byGroup: IVolunteerMeetingStatGroupBreakdown[];
}

export interface IKidsMeetingStatClassroomBreakdown {
  classroomId: string;
  classroomName: string;
  ageRange?: string;
  totalKids: number;
  newKids: number;
  boys: number;
  girls: number;
}

export interface IKidsMeetingStatHistory {
  totalKids: number;
  newKids: number;
  boys: number;
  girls: number;
  byClassroom: IKidsMeetingStatClassroomBreakdown[];
}

export interface IMinistryAnalyticsResponse {
  ministry: IMinistry;
  temporalRange: {
    from: string;
    to: string;
  };
  volunteers: IVolunteerMeetingStatHistory;
  kids?: IKidsMeetingStatHistory | null;
  structure: {
    areas: IMinistryArea[];
    groups: IMinistryGroupConfig[];
    teams: IMinistryWorkspaceTeam[];
    leadership: IMinistryWorkspaceLeadership;
    assignmentsCount: number;
  };
}

export type IMinistryVolunteerAnalytics = IVolunteerMeetingStatHistory;
export type IMinistryKidsAnalytics = NonNullable<IMinistryAnalyticsResponse['kids']>;
export type IMinistryStructureAnalytics = IMinistryAnalyticsResponse['structure'];



