import { IChurchCampus } from './Church';
import { ReduxDefaultState } from './Redux';

export interface IMinistry {
  id: string;
  churchId: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface IMinistryArea {
  id: string;
  ministryId: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface IMinistryGroupConfig {
  id: string;
  ministryId: string;
  name: string;
  position: number;
  active: boolean;
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
