/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Days } from '../common-types/constants';
import { ReduxDefaultState } from './Redux';

export enum ChurchMeetingStateEnum {
  ACTIVE = 'ACTIVE',
  ACTIVE_WITHOUT_DISPLAY = 'ACTIVE_WITHOUT_DISPLAY',
  DISABLE = 'DISABLE',
}

export interface IChurchCampus {
  id: string;
  name: string;
  description?: string;
  meetings?: IChurchMeeting[];
  printers?: IChurchPrinter[];
}

export interface IChurchMeeting {
  id: string;
  churchId?: string;
  name: string;
  description?: string;
  day: Days;
  initialHour: Date;
  finalHour: Date;
  initialRegistrationHour: any;
  finalRegistrationHour: any;
  state?: ChurchMeetingStateEnum;
}

export interface IChurchPrinter {
  id: string;
  churchId?: string;
  name: string;
  active?: boolean;
}

export interface IChurchCampuses extends ReduxDefaultState<IChurchCampus> {}
export interface IChurchMeetings extends ReduxDefaultState<IChurchMeeting> {}
export interface IChurchPrinters extends ReduxDefaultState<IChurchPrinter> {}
