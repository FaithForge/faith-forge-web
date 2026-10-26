import { Days } from '../common-types/constants';
import { ReduxDefaultState } from './Redux';
import type { IUser } from './User';

export const EntityState = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DELETED: 'DELETED',
} as const;
export type EntityState = (typeof EntityState)[keyof typeof EntityState];

export const ChurchCampusStateEnum = {
  ...EntityState,
} as const;
export type ChurchCampusStateEnum =
  (typeof ChurchCampusStateEnum)[keyof typeof ChurchCampusStateEnum];

export const ChurchPrinterStateEnum = {
  ...EntityState,
} as const;
export type ChurchPrinterStateEnum =
  (typeof ChurchPrinterStateEnum)[keyof typeof ChurchPrinterStateEnum];

export const ChurchMeetingStateEnum = {
  ...EntityState,
  ARCHIVED: 'ARCHIVED',
  ACTIVE_WITHOUT_DISPLAY: 'ACTIVE_WITHOUT_DISPLAY',
  DISABLE: 'DISABLE',
} as const;
export type ChurchMeetingStateEnum =
  (typeof ChurchMeetingStateEnum)[keyof typeof ChurchMeetingStateEnum];

export enum ChurchMeetingKind {
  RECURRENT = 'RECURRENT',
  ONE_TIME = 'ONE_TIME',
}

export const ChurchMeetingTagStateEnum = {
  ...EntityState,
} as const;
export type ChurchMeetingTagStateEnum =
  (typeof ChurchMeetingTagStateEnum)[keyof typeof ChurchMeetingTagStateEnum];

export const ChurchMeetingExceptionStateEnum = {
  ...EntityState,
} as const;
export type ChurchMeetingExceptionStateEnum =
  (typeof ChurchMeetingExceptionStateEnum)[keyof typeof ChurchMeetingExceptionStateEnum];

export enum KidAttendanceFlowModeEnum {
  ONLY_CHECK_IN = 'ONLY_CHECK_IN',
  CHECK_IN_AND_ENTRY = 'CHECK_IN_AND_ENTRY',
  DIRECT_ENTRY_AND_CHECK_OUT = 'DIRECT_ENTRY_AND_CHECK_OUT',
  FULL_FLOW = 'FULL_FLOW',
}

export enum ChurchModule {
  KID_CHURCH = 'KID_CHURCH',
}

export interface IChurchBranding {
  appName?: string;
  shortName?: string;
  primaryColor?: string;
  themeColor?: string;
  backgroundColor?: string;
  logoUrl?: string;
  icon192Url?: string;
  icon512Url?: string;
  maskableIconUrl?: string;
  appleTouchIconUrl?: string;
}

export interface IChurch {
  id: string;
  name: string;
  slug?: string;
  customDomains?: string[];
  branding?: IChurchBranding;
  description?: string;
  state?: EntityState;
  enabledModules?: ChurchModule[];
  terminologyOverrides?: Record<string, string>;
  ministryTerminologyOverrides?: Record<string, Record<string, string>>;
  campuses?: IChurchCampus[];
}

export interface CreateChurchPayload {
  name: string;
  slug?: string;
  customDomains?: string[];
  branding?: IChurchBranding;
  description?: string;
  state?: EntityState;
  enabledModules?: ChurchModule[];
  terminologyOverrides?: Record<string, string>;
  ministryTerminologyOverrides?: Record<string, Record<string, string>>;
}

export interface UpdateChurchPayload extends Partial<CreateChurchPayload> {
  id: string;
}

export interface IChurchCampus {
  id: string;
  churchId?: string;
  name: string;
  description?: string;
  position?: number;
  state?: ChurchCampusStateEnum;
  kidAttendanceFlowMode?: KidAttendanceFlowModeEnum;
  meetings?: IChurchMeeting[];
  printers?: IChurchPrinter[];
}

export enum ChurchStaffRole {
  CHURCH_ADMIN = 'CHURCH_ADMIN',
  CHURCH_STAFF = 'CHURCH_STAFF',
}

export const ChurchStaffStateEnum = {
  ...EntityState,
} as const;
export type ChurchStaffStateEnum = (typeof ChurchStaffStateEnum)[keyof typeof ChurchStaffStateEnum];

export interface IChurchStaff {
  id: string;
  userId: string;
  churchId: string;
  roles: ChurchStaffRole[];
  state?: ChurchStaffStateEnum;
  createdAt?: string;
  updatedAt?: string;
  user?: Partial<IUser>;
  church?: IChurch;
}

export interface UpdateChurchStaffRolesPayload {
  userId: string;
  churchId: string;
  roles: ChurchStaffRole[];
}

export interface DeleteChurchStaffPayload {
  userId: string;
  churchId: string;
}

export interface IChurchMeetingTag {
  id: string;
  churchCampusId: string;
  name: string;
  state: ChurchMeetingTagStateEnum;
  createdAt?: string;
  updatedAt?: string;
}

export interface IChurchMeeting {
  id: string;
  churchId?: string;
  churchCampusId?: string;
  name: string;
  description?: string;
  kind?: ChurchMeetingKind;
  day: Days;
  specificDate?: string | null;
  endDate?: string | null;
  tagId?: string | null;
  tag?: IChurchMeetingTag | null;
  initialHour: string;
  finalHour: string;
  initialRegistrationHour: string;
  finalRegistrationHour: string;
  position?: number;
  state?: ChurchMeetingStateEnum;
}

export interface IChurchMeetingException {
  id: string;
  churchMeetingId: string;
  churchCampusId: string;
  exceptionDate: string;
  reason?: string | null;
  state: ChurchMeetingExceptionStateEnum;
  createdAt?: string;
  updatedAt?: string;
}

export interface IChurchPrinter {
  id: string;
  churchId?: string;
  churchCampusId?: string;
  name: string;
  state?: ChurchPrinterStateEnum;
}

export interface IChurchCampuses extends ReduxDefaultState<IChurchCampus> {
  church?: IChurch;
  churchTerminologyOverrides?: Record<string, string>;
  ministryTerminologyOverrides?: Record<string, Record<string, string>>;
}
export interface IChurchMeetings extends ReduxDefaultState<IChurchMeeting> {}
export interface IChurchPrinters extends ReduxDefaultState<IChurchPrinter> {}
