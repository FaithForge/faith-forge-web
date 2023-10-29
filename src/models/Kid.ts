import { IPagination } from './Pagination';
import { UserGenderCode } from './Uset';

export interface IKidRelation {
  id: string;
  guardianId?: string;
  relation: string;
  firstName: string;
  lastName?: string;
  phone?: string;
}

export interface IKid {
  faithForgeId?: number;
  age?: number;
  ageInMonths?: number;
  birthday: string;
  id?: string;
  isRegistered?: boolean;
  firstName: string;
  lastName: string;
  gender: UserGenderCode;
  photoUrl?: string;
  state?: string;
  staticGroup?: boolean;
  group?: string;
  groupId?: string;
  observations?: string;
  medicalCondition?: {
    id: string;
    name?: string;
    code?: string;
    description?: string;
  };
  registry?: any;
  relations?: {
    value: string;
    label: string;
  }[];
  healthSecurityEntity?: string;
}

export interface IKidGroup {
  id: string;
  name: string;
}

export interface IKidMedicalCondition {
  id: string;
  name: string;
}

export interface IKids extends IPagination {
  data: IKid[];
  groups: IKidGroup[];
  medicalConditions: IKidMedicalCondition[];
  current?: IKid;
  error?: string;
  loading: boolean;
}
