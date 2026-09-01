import { IChurchMeeting } from './Church';
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
  churchCampusId?: string;
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

export interface IVolunteerAttendance {
  id: string;
  volunteerAssignmentId: string;
  churchMeetingId: string;
  attendanceDate: string | Date;
  attendanceTakeDate?: string | Date;
  meeting?: IChurchMeeting;
  volunteerAssignment?: IVolunteerAssignment;
}

export interface GetVolunteersPayload {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  ministryId?: string;
  churchCampusId?: string;
  role?: VolunteerRole;
  search?: string;
  active?: boolean;
}

export interface GetVolunteerAssignmentsPayload {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  ministryId?: string;
  churchCampusId?: string;
  ministryAreaId?: string;
  ministryGroupConfigId?: string;
  serviceAreaGroupId?: string;
  volunteerId?: string;
  role?: VolunteerRole;
  active?: boolean;
}

export interface GetVolunteerAttendancePayload {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  churchMeetingId?: string;
  churchCampusId?: string;
  ministryId?: string;
  ministryAreaId?: string;
  serviceAreaGroupId?: string;
  volunteerAssignmentId?: string;
  attendanceDate?: string;
  from?: string;
  to?: string;
}

