import { IChurchCampus } from './Church';
import { ReduxDefaultState } from './Redux';

export interface IMinistry {
  id: string;
  churchCampusId: string;
  churchId: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  churchCampus?: IChurchCampus;
}

export interface IMinistryAreaKidGroupRelation {
  id: string;
  ministryAreaId: string;
  kidGroupId: string;
  active: boolean;
}

export enum MinistryAreaScope {
  KID_REGISTRATION = 'KID_REGISTRATION',
  KID_GROUP_MANAGEMENT = 'KID_GROUP_MANAGEMENT',
}

export interface IMinistryArea {
  id: string;
  ministryId: string;
  churchCampusId?: string;
  name: string;
  description?: string;
  scope?: MinistryAreaScope | null;
  active: boolean;
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
  active: boolean;
  ministry?: IMinistry;
}

export interface IServiceAreaGroup {
  id: string;
  ministryAreaId: string;
  ministryGroupConfigId: string;
  churchCampusId: string;
  active: boolean;
  ministryArea?: IMinistryArea;
  ministryGroupConfig?: IMinistryGroupConfig;
  churchCampus?: IChurchCampus;
}

export interface IMinistries extends ReduxDefaultState<IMinistry> {}
export interface IMinistryAreas extends ReduxDefaultState<IMinistryArea> {}
export interface IMinistryGroupConfigs extends ReduxDefaultState<IMinistryGroupConfig> {}
export interface IServiceAreaGroups extends ReduxDefaultState<IServiceAreaGroup> {}
