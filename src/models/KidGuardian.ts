import { IPagination } from './Pagination';
import { IdType, UserGender } from './Uset';

export enum KidGuardianRelationCode {
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

export enum KidGuardianRelation {
  FATHER = 'Padre', // Padre
  MOTHER = 'Madre', // Madre
  BROTHER = 'Hermano', // Hermano
  SISTER = 'Hermana', // Hermana
  GRANDFATHER = 'Abuelo', // Abuelo
  GRANDMOTHER = 'Abuela', // Abuela
  UNCLE = 'Tio', // Tio
  AUNT = 'Tia', // Tia
  ACQUAINTANCE = 'Conocido', // Conocido
}

export const KID_RELATION_CODE_MAPPER = {
  [KidGuardianRelationCode.FATHER]: KidGuardianRelation.FATHER,
  [KidGuardianRelationCode.MOTHER]: KidGuardianRelation.MOTHER,
  [KidGuardianRelationCode.BROTHER]: KidGuardianRelation.BROTHER,
  [KidGuardianRelationCode.SISTER]: KidGuardianRelation.SISTER,
  [KidGuardianRelationCode.GRANDFATHER]: KidGuardianRelation.GRANDFATHER,
  [KidGuardianRelationCode.GRANDMOTHER]: KidGuardianRelation.GRANDMOTHER,
  [KidGuardianRelationCode.UNCLE]: KidGuardianRelation.UNCLE,
  [KidGuardianRelationCode.AUNT]: KidGuardianRelation.AUNT,
  [KidGuardianRelationCode.ACQUAINTANCE]: KidGuardianRelation.ACQUAINTANCE,
};

export const kidRelationSelect = [
  { value: KidGuardianRelationCode.FATHER, label: KidGuardianRelation.FATHER },
  { value: KidGuardianRelationCode.MOTHER, label: KidGuardianRelation.MOTHER },
  {
    value: KidGuardianRelationCode.BROTHER,
    label: KidGuardianRelation.BROTHER,
  },
  { value: KidGuardianRelationCode.SISTER, label: KidGuardianRelation.SISTER },
  {
    value: KidGuardianRelationCode.GRANDFATHER,
    label: KidGuardianRelation.GRANDFATHER,
  },
  {
    value: KidGuardianRelationCode.GRANDMOTHER,
    label: KidGuardianRelation.GRANDMOTHER,
  },
  { value: KidGuardianRelationCode.UNCLE, label: KidGuardianRelation.UNCLE },
  { value: KidGuardianRelationCode.AUNT, label: KidGuardianRelation.AUNT },
  {
    value: KidGuardianRelationCode.ACQUAINTANCE,
    label: KidGuardianRelation.ACQUAINTANCE,
  },
];

export interface IKidGuardian {
  id?: string;
  faithForgeId?: number;
  nationalIdType: IdType;
  nationalId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  gender: UserGender;
  relation: KidGuardianRelationCode;
}

export interface IKidGuardians extends IPagination {
  data: IKidGuardian[];
  current?: IKidGuardian;
  error?: string;
  loading: boolean;
}
