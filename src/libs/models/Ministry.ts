import { EntityState, IChurchCampus, IChurchMeeting } from './Church';
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
  ministries?: IMeetingMinistrySchedule[];
}

export interface IMeetingMinistrySchedule {
  ministryId: string;
  ministryName: string;
  ministryType: MinistryType;
  scheduledGroupIds: string[];
  scheduledGroups: IMinistryGroupConfig[];
  hasScheduleRule: boolean;
  isSingleDateAssignment: boolean;
  assignmentNotes?: string | null;
}

export interface IChurchMeetingDetail {
  serviceDate: string;
  meeting: IChurchMeeting;
  isCancelled: boolean;
  exceptionId?: string | null;
  exceptionReason?: string | null;
  isPast: boolean;
  ministries: IMeetingMinistrySchedule[];
}

export interface GetChurchMeetingDetailArgs {
  churchMeetingId: string;
  serviceDate?: string;
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

export interface IMinistryMeetingStatBreakdown {
  meetingId: string;
  meetingName: string;
  day?: string;
  initialHour?: string;
  finalHour?: string;
  serviceDate: string;
  scheduledGroupIds: string[];
  volunteers: IVolunteerMeetingStatHistory;
  kids?: IKidsMeetingStatHistory | null;
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
  byMeeting?: IMinistryMeetingStatBreakdown[];
  availableDates?: string[];
}

export type IMinistryVolunteerAnalytics = IVolunteerMeetingStatHistory;
export type IMinistryKidsAnalytics = NonNullable<
  IMinistryAnalyticsResponse['kids']
>;
export type IMinistryStructureAnalytics =
  IMinistryAnalyticsResponse['structure'];

export interface IServiceReminderPreviewItem {
  userId: string;
  fullName?: string;
  churchMemberId: string;
  groupName?: string;
  areaName?: string;
  churchMeetingId: string;
  churchMeetingName: string;
  meetingTime: string;
  role: string;
}

export interface IServiceReminderPreviewResponse {
  targetDate: string;
  totalScheduled: number;
  pendingNotification: number;
  collaborators: IServiceReminderPreviewItem[];
}

export interface ISendServiceRemindersResponse {
  targetDate: string;
  totalSent: number;
  failedCount: number;
}

export enum MatrixRiskLevel {
  CRITICAL = 'CRITICAL',
  ALERT = 'ALERT',
  REGULAR = 'REGULAR',
  OPTIMAL = 'OPTIMAL',
}

export enum MatrixCellStatus {
  ATTENDED = 'ATTENDED',
  EXCUSED = 'EXCUSED',
  UNEXCUSED = 'UNEXCUSED',
  EXEMPT = 'EXEMPT',
  NOT_SCHEDULED = 'NOT_SCHEDULED',
}

/**
 * Predefined temporal windows for the attendance matrix.
 */
export enum AttendanceMatrixTimeframe {
  LAST_6 = 'LAST_6',
  LAST_12 = 'LAST_12',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  CUSTOM = 'CUSTOM',
}

export interface GetMinistryAttendanceMatrixArgs {
  ministryId: string;
  churchCampusId?: string;
  ministryAreaId?: string;
  ministryGroupConfigId?: string;
  timeframe?: AttendanceMatrixTimeframe;
  from?: string;
  to?: string;
  limitEvents?: number;
}

export interface IMatrixEventColumn {
  id: string;
  meetingName: string;
  date: string;
  initialHour?: string;
  finalHour?: string;
  scheduledGroupIds: string[];
}

export interface IMatrixVolunteerRosterItem {
  assignmentId: string;
  churchMemberId: string;
  userId?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  photoUrl?: string;
  phone?: string;
  dialCodePhone?: string;
  areaId?: string;
  areaName: string;
  groupId?: string;
  groupName: string;
  role: string;
  attendanceRate: number;
  riskLevel: MatrixRiskLevel;
  unexcusedCount: number;
  excusedCount: number;
  attendedCount: number;
  totalRequired: number;
  matrix: Record<string, { status: MatrixCellStatus; observation?: string }>;
}

export interface IMatrixCriticalVolunteerSummary {
  assignmentId: string;
  fullName: string;
  photoUrl?: string;
  unexcusedCount: number;
  attendanceRate: number;
}

export interface IMatrixKpis {
  globalAttendanceRate: number;
  targetAttendanceRate: number;
  criticalRiskCount: number;
  criticalVolunteers: IMatrixCriticalVolunteerSummary[];
  totalUnexcused: number;
  unexcusedImpactPercent: number;
  perfectAttendanceRate: number;
  perfectAttendanceCount: number;
  totalVolunteers: number;
}

export interface IMatrixAvailableOption {
  id: string;
  name: string;
}

export interface IMinistryAttendanceMatrixResponse {
  ministryId: string;
  ministryName: string;
  campusId: string;
  selectedGroupId?: string;
  availableGroups?: IMatrixAvailableOption[];
  availableAreas?: IMatrixAvailableOption[];
  temporalRange: {
    from: string;
    to: string;
  };
  events: IMatrixEventColumn[];
  kpis: IMatrixKpis;
  roster: IMatrixVolunteerRosterItem[];
}
