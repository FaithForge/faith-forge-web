import {
  ReduxDefaultState,
  ReduxDefaultStateWithPagination,
  ReduxDefaultStateWithoutData,
} from './Redux';
import { IUser, UserGenderCode, UserIdType, UserState } from './User';

// ENUMS

export enum KidGuardianRelationCodeEnum {
  FATHER = 'FATHER', // Padre
  MOTHER = 'MOTHER', // Madre
  BROTHER = 'BROTHER', // Hermano
  SISTER = 'SISTER', // Hermana
  GRANDFATHER = 'GRANDFATHER', // Abuelo
  GRANDMOTHER = 'GRANDMOTHER', // Abuela
  UNCLE = 'UNCLE', // Tio
  AUNT = 'AUNT', // Tia
  ACQUAINTANCE = 'ACQUAINTANCE', // Conocido
}

export enum KidGuardianRelationEnum {
  FATHER = 'Padre', // Padre
  MOTHER = 'Madre', // Madre
  BROTHER = 'Hermano', // Hermano
  SISTER = 'Hermana', // Hermana
  GRANDFATHER = 'Abuelo', // Abuelo
  GRANDMOTHER = 'Abuela', // Abuela
  UNCLE = 'Tío', // Tío
  AUNT = 'Tía', // Tía
  ACQUAINTANCE = 'Conocido', // Conocido
}

export const KID_RELATION_CODE_MAPPER = {
  [KidGuardianRelationCodeEnum.FATHER]: KidGuardianRelationEnum.FATHER,
  [KidGuardianRelationCodeEnum.MOTHER]: KidGuardianRelationEnum.MOTHER,
  [KidGuardianRelationCodeEnum.BROTHER]: KidGuardianRelationEnum.BROTHER,
  [KidGuardianRelationCodeEnum.SISTER]: KidGuardianRelationEnum.SISTER,
  [KidGuardianRelationCodeEnum.GRANDFATHER]:
    KidGuardianRelationEnum.GRANDFATHER,
  [KidGuardianRelationCodeEnum.GRANDMOTHER]:
    KidGuardianRelationEnum.GRANDMOTHER,
  [KidGuardianRelationCodeEnum.UNCLE]: KidGuardianRelationEnum.UNCLE,
  [KidGuardianRelationCodeEnum.AUNT]: KidGuardianRelationEnum.AUNT,
  [KidGuardianRelationCodeEnum.ACQUAINTANCE]:
    KidGuardianRelationEnum.ACQUAINTANCE,
};

export const kidRelationSelect = [
  {
    value: KidGuardianRelationCodeEnum.FATHER,
    label: KidGuardianRelationEnum.FATHER,
  },
  {
    value: KidGuardianRelationCodeEnum.MOTHER,
    label: KidGuardianRelationEnum.MOTHER,
  },
  {
    value: KidGuardianRelationCodeEnum.BROTHER,
    label: KidGuardianRelationEnum.BROTHER,
  },
  {
    value: KidGuardianRelationCodeEnum.SISTER,
    label: KidGuardianRelationEnum.SISTER,
  },
  {
    value: KidGuardianRelationCodeEnum.GRANDFATHER,
    label: KidGuardianRelationEnum.GRANDFATHER,
  },
  {
    value: KidGuardianRelationCodeEnum.GRANDMOTHER,
    label: KidGuardianRelationEnum.GRANDMOTHER,
  },
  {
    value: KidGuardianRelationCodeEnum.UNCLE,
    label: KidGuardianRelationEnum.UNCLE,
  },
  {
    value: KidGuardianRelationCodeEnum.AUNT,
    label: KidGuardianRelationEnum.AUNT,
  },
  {
    value: KidGuardianRelationCodeEnum.ACQUAINTANCE,
    label: KidGuardianRelationEnum.ACQUAINTANCE,
  },
];

// GET

export interface IKid {
  id: string;
  faithForgeId: number;
  firstName: string;
  lastName: string;
  gender: UserGenderCode;
  birthday: Date;
  state: UserState;
  photoUrl?: string;
  healthSecurityEntity?: string;
  age: number;
  ageInMonths: number;
  currentKidRegistration?: IKidRegistration;
  staticGroup: boolean;
  kidGroup?: IKidGroup;
  observations?: string;
  medicalCondition?: IKidMedicalCondition;
  relations?: IKidGuardian[];
}

export interface IKidGuardian {
  id?: string;
  nationalId: string;
  nationalIdType: UserIdType;
  firstName: string;
  lastName: string;
  phone: string;
  gender: UserGenderCode;
  relation: KidGuardianRelationCodeEnum;
}

export interface IKidRegistration {
  id: string;
  date: Date;
  observation?: string;
  kidId: string;
  groupId: string;
  guardianId: string;
  churchMeetingId: string;
  additionalInfo?: {
    groupName?: string;
    guardianFullName?: string;
    kidFullName?: string;
    churchMeetingName?: string;
    registerFullName?: string;
    registerGroupName?: string;
  };
}

export interface IKidGroup {
  id: string;
  name: string;
  description?: string;
  initialMonth?: string;
  finalMonth?: string;
  active?: boolean;
}

export interface IKidMedicalCondition {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface IAuth extends ReduxDefaultStateWithoutData {
  user?: IUser;
  token: string;
}

export interface IAccount extends ReduxDefaultStateWithoutData {
  churchGroup?: string;
}

// CREATE
export interface ICreateKid {
  firstName: string;
  lastName: string;
  birthday: Date;
  healthSecurityEntity: string;
  gender: UserGenderCode;
  photoUrl?: string;
  staticGroup?: boolean;
  staticKidGroupId?: string;
  observations?: string;
  medicalConditionId?: string;
  kidGuardian: ICreateKidGuardian;
}

export interface ICreateKidGuardian {
  kidId?: string;
  nationalId: string;
  nationalIdType: UserIdType;
  firstName: string;
  lastName: string;
  phone: string;
  gender: UserGenderCode;
  relation: KidGuardianRelationEnum;
}

export interface ICreateKidRegistration {
  kidId: string;
  kidGuardianId: string;
  kidGroupId: string;
  observation?: string;
}

// UPDATE
export interface IUpdateKid {
  firstName?: string;
  lastName?: string;
  gender?: UserGenderCode;
  birthday?: Date;
  healthSecurityEntity?: string;
  staticGroup?: boolean;
  staticKidGroupId?: string;
  observations?: string;
  medicalConditionId?: string;
  photoUrl?: string;
}

// SLIDES
export interface IKids extends ReduxDefaultStateWithPagination<IKid> {}
export interface IKidMedicalConditions
  extends ReduxDefaultState<IKidMedicalCondition> {}
export interface IKidGroups extends ReduxDefaultState<IKidGroup> {}
export interface IKidGuardians extends ReduxDefaultState<IKidGuardian> {}
