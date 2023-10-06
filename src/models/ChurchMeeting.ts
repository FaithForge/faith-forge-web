import { Days } from '../constants/days';

export interface IChurchMeeting {
  id: string;
  name: string;
  day: Days;
  initialHour: Date;
  finalHour: Date;
  initialRegistrationHour: any;
  finalRegistrationHour: any;
}

export interface IChurchMeetings {
  data: IChurchMeeting[];
  current?: IChurchMeeting;
  error?: string;
  loading: boolean;
}
