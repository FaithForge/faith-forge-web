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
  MALE_COUSIN = 'MALE_COUSIN', // Primo
  FEMALE_COUSIN = 'FEMALE_COUSIN', // Prima
  MALE_ACQUAINTANCE = 'MALE_ACQUAINTANCE', // Conocido
  FEMALE_ACQUAINTANCE = 'FEMALE_ACQUAINTANCE', // Conocida
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
  MALE_COUSIN = 'Primo', // Primo
  FEMALE_COUSIN = 'Prima', // Prima
  MALE_ACQUAINTANCE = 'Conocido', // Conocido
  FEMALE_ACQUAINTANCE = 'Conocida', // Conocida
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
  [KidGuardianRelationCodeEnum.MALE_COUSIN]:
    KidGuardianRelationEnum.MALE_COUSIN,
  [KidGuardianRelationCodeEnum.FEMALE_COUSIN]:
    KidGuardianRelationEnum.FEMALE_COUSIN,
  [KidGuardianRelationCodeEnum.MALE_ACQUAINTANCE]:
    KidGuardianRelationEnum.MALE_ACQUAINTANCE,
  [KidGuardianRelationCodeEnum.FEMALE_ACQUAINTANCE]:
    KidGuardianRelationEnum.FEMALE_ACQUAINTANCE,
};

export const kidRelationSelect = [
  {
    value: KidGuardianRelationCodeEnum.FATHER,
    label: KidGuardianRelationEnum.FATHER,
    gender: UserGenderCode.MALE,
  },
  {
    value: KidGuardianRelationCodeEnum.MOTHER,
    label: KidGuardianRelationEnum.MOTHER,
    gender: UserGenderCode.FEMALE,
  },
  {
    value: KidGuardianRelationCodeEnum.BROTHER,
    label: KidGuardianRelationEnum.BROTHER,
    gender: UserGenderCode.MALE,
  },
  {
    value: KidGuardianRelationCodeEnum.SISTER,
    label: KidGuardianRelationEnum.SISTER,
    gender: UserGenderCode.FEMALE,
  },
  {
    value: KidGuardianRelationCodeEnum.GRANDFATHER,
    label: KidGuardianRelationEnum.GRANDFATHER,
    gender: UserGenderCode.MALE,
  },
  {
    value: KidGuardianRelationCodeEnum.GRANDMOTHER,
    label: KidGuardianRelationEnum.GRANDMOTHER,
    gender: UserGenderCode.FEMALE,
  },
  {
    value: KidGuardianRelationCodeEnum.UNCLE,
    label: KidGuardianRelationEnum.UNCLE,
    gender: UserGenderCode.MALE,
  },
  {
    value: KidGuardianRelationCodeEnum.AUNT,
    label: KidGuardianRelationEnum.AUNT,
    gender: UserGenderCode.FEMALE,
  },
  {
    value: KidGuardianRelationCodeEnum.MALE_COUSIN,
    label: KidGuardianRelationEnum.MALE_COUSIN,
    gender: UserGenderCode.MALE,
  },
  {
    value: KidGuardianRelationCodeEnum.FEMALE_COUSIN,
    label: KidGuardianRelationEnum.FEMALE_COUSIN,
    gender: UserGenderCode.FEMALE,
  },
  {
    value: KidGuardianRelationCodeEnum.MALE_ACQUAINTANCE,
    label: KidGuardianRelationEnum.MALE_ACQUAINTANCE,
    gender: UserGenderCode.MALE,
  },
  {
    value: KidGuardianRelationCodeEnum.FEMALE_ACQUAINTANCE,
    label: KidGuardianRelationEnum.FEMALE_ACQUAINTANCE,
    gender: UserGenderCode.FEMALE,
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
  log?: string;
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
