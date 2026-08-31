import { IMinistry, IMinistryArea, IMinistryGroupConfig, IServiceAreaGroup } from './Ministry';
import { IUser } from './User';

export enum VolunteerRole {
  VOLUNTEER = 'VOLUNTEER',
  SUPERVISOR = 'SUPERVISOR',
  GROUP_COORDINATOR = 'GROUP_COORDINATOR',
  AREA_GENERAL_COORDINATOR = 'AREA_GENERAL_COORDINATOR',
  MINISTRY_GENERAL_COORDINATOR = 'MINISTRY_GENERAL_COORDINATOR',
}

export interface IVolunteer {
  id: string;
  userId: string;
  user?: Partial<IUser>;
  assignments?: IVolunteerAssignment[];
}

export interface IVolunteerAssignment {
  id: string;
  volunteerId?: string;
  ministryVolunteerId?: string;
  role: VolunteerRole;
  serviceAreaGroupId?: string;
  ministryGroupConfigId?: string;
  ministryAreaId?: string;
  ministryId?: string;
  active: boolean;
  volunteer?: IVolunteer;
  ministryVolunteer?: IVolunteer;
  serviceAreaGroup?: IServiceAreaGroup;
  ministryGroupConfig?: IMinistryGroupConfig;
  ministryArea?: IMinistryArea;
  ministry?: IMinistry;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
