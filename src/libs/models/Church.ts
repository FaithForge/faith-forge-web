/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Days } from '../common-types/constants';
import { ReduxDefaultState } from './Redux';

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
  ACTIVE_WITHOUT_DISPLAY: 'ACTIVE_WITHOUT_DISPLAY',
  DISABLE: 'DISABLE',
} as const;
export type ChurchMeetingStateEnum =
  (typeof ChurchMeetingStateEnum)[keyof typeof ChurchMeetingStateEnum];

export interface IChurchCampus {
  id: string;
  name: string;
  description?: string;
  position?: number;
  state?: ChurchCampusStateEnum;
  meetings?: IChurchMeeting[];
  printers?: IChurchPrinter[];
}

export interface IChurchMeeting {
  id: string;
  churchId?: string;
  churchCampusId?: string;
  name: string;
  description?: string;
  day: Days;
  initialHour: any;
  finalHour: any;
  initialRegistrationHour: any;
  finalRegistrationHour: any;
  position?: number;
  state?: ChurchMeetingStateEnum;
}

export interface IChurchPrinter {
  id: string;
  churchId?: string;
  churchCampusId?: string;
  name: string;
  state?: ChurchPrinterStateEnum;
}

export interface IChurchCampuses extends ReduxDefaultState<IChurchCampus> {}
export interface IChurchMeetings extends ReduxDefaultState<IChurchMeeting> {}
export interface IChurchPrinters extends ReduxDefaultState<IChurchPrinter> {}

