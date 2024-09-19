import { Days } from '../constants/days';
import { ReduxDefaultState } from './Redux';

export interface IChurch {
  id: string;
  name: string;
  description?: string;
  meetings?: IChurchMeeting[];
  printers?: IPrinters[];
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
  active?: boolean;
}

export interface IPrinters {
  id: string;
  churchId?: string;
  name: string;
  active?: boolean;
}

export enum ChurchMeetingStateEnum {
  ACTIVE = 'ACTIVE',
  ACTIVE_WITHOUT_DISPLAY = 'ACTIVE_WITHOUT_DISPLAY',
  DISABLE = 'DISABLE',
}

export interface IChurches extends ReduxDefaultState<IChurch> {}
export interface IChurchMeetings extends ReduxDefaultState<IChurchMeeting> {}
export interface IChurchPrinters extends ReduxDefaultState<IPrinters> {}
