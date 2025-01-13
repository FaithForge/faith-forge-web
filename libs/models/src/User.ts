import { SelectorOptionApp } from '@faith-forge-web/common-types/global';
import { ReduxDefaultStateWithoutData } from './Redux';

export enum UserGender {
  FEMALE = 'Femenino',
  MALE = 'Masculino',
}

export enum UserGenderCode {
  FEMALE = 'F',
  MALE = 'M',
}

export const USER_GENDER_MAPPER = {
  [UserGender.FEMALE]: UserGenderCode.FEMALE,
  [UserGender.MALE]: UserGenderCode.MALE,
};

export const USER_GENDER_CODE_MAPPER = {
  [UserGenderCode.FEMALE]: UserGender.FEMALE,
  [UserGenderCode.MALE]: UserGender.MALE,
};

export const userGenderSelect = [
  { value: UserGenderCode.MALE, label: UserGender.MALE },
  { value: UserGenderCode.FEMALE, label: UserGender.FEMALE },
];

export enum UserIdType {
  CC = 'CC',
  TI = 'TI',
  RC = 'RC',
  CE = 'CE',
  PS = 'PS',
}

export enum IdType {
  CC = 'Cédula de Ciudadanía',
  TI = 'Tarjeta de Identidad',
  RC = 'Registro Cívil',
  CE = 'Cédula de Extranjería',
  PS = 'Pasaporte',
}

export const ID_TYPE_MAPPER = {
  [IdType.CC]: UserIdType.CC,
  [IdType.TI]: UserIdType.TI,
  [IdType.RC]: UserIdType.RC,
  [IdType.CE]: UserIdType.CE,
  [IdType.PS]: UserIdType.PS,
};

export const ID_TYPE_CODE_MAPPER = {
  [UserIdType.CC]: IdType.CC,
  [UserIdType.TI]: IdType.TI,
  [UserIdType.RC]: IdType.RC,
  [UserIdType.CE]: IdType.CE,
  [UserIdType.PS]: IdType.PS,
};

export const idTypeSelect = [
  { value: UserIdType.CC, label: IdType.CC },
  { value: UserIdType.TI, label: IdType.TI },
  { value: UserIdType.RC, label: IdType.RC },
  { value: UserIdType.CE, label: IdType.CE },
  { value: UserIdType.PS, label: IdType.PS },
];

export const idGuardianTypeSelect = [
  { value: UserIdType.CC, label: IdType.CC },
  { value: UserIdType.TI, label: IdType.TI },
  { value: UserIdType.CE, label: IdType.CE },
  { value: UserIdType.PS, label: IdType.PS },
];

export interface IUser {
  id: string;
  faithForgeId: number;
  nationalIdType?: UserIdType;
  nationalId?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  gender: UserGenderCode;
  birthday?: Date;
  state: UserState;
  photoUrl?: string;
  username?: string;
  healthSecurityEntity?: string;
  roles: string[];
}

export interface IUpdateUser {
  nationalIdType?: UserIdType;
  nationalId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  gender: UserGender;
  birthday?: Date;
  state?: UserState;
  photoUrl?: string;
  username?: string;
  healthSecurityEntity?: string;
}

export const healthSecurityEntitySelect: SelectorOptionApp[] = [
  { id: 'COOSALUD EPS-S', name: 'COOSALUD EPS-S' },
  { id: 'NUEVA EPS', name: 'NUEVA EPS' },
  { id: 'MUTUAL SER', name: 'MUTUAL SER' },
  { id: 'ALIANSALUD EPS', name: 'ALIANSALUD EPS' },
  { id: 'SALUD TOTAL EPS S.A.', name: 'SALUD TOTAL EPS S.A.' },
  { id: 'EPS SANITAS', name: 'EPS SANITAS' },
  { id: 'EPS SURA', name: 'EPS SURA' },
  { id: 'FAMISANAR', name: 'FAMISANAR' },
  {
    id: 'SERVICIO OCCIDENTAL DE SALUD EPS SOS',
    name: 'SERVICIO OCCIDENTAL DE SALUD EPS SOS',
  },
  { id: 'SALUD MIA', name: 'SALUD MIA' },
  { id: 'COMFENALCO VALLE', name: 'COMFENALCO VALLE' },
  { id: 'COMPENSAR EPS', name: 'COMPENSAR EPS' },
  {
    id: 'EPM - EMPRESAS PUBLICAS DE MEDELLIN',
    name: 'EPM - EMPRESAS PUBLICAS DE MEDELLIN',
  },
  {
    id: 'FONDO DE PASIVO SOCIAL DE FERROCARRILES NACIONALES DE COLOMBIA',
    name: 'FONDO DE PASIVO SOCIAL DE FERROCARRILES NACIONALES DE COLOMBIA',
  },
  { id: 'CAJACOPI ATLANTICO', name: 'CAJACOPI ATLANTICO' },
  { id: 'CAPRESOCA', name: 'CAPRESOCA' },
  { id: 'COMFACHOCO', name: 'COMFACHOCO' },
  { id: 'COMFAORIENTE', name: 'COMFAORIENTE' },
  { id: 'EPS FAMILIAR DE COLOMBIA', name: 'EPS FAMILIAR DE COLOMBIA' },
  { id: 'ASMET SALUD', name: 'ASMET SALUD' },
  { id: 'EMSSANAR E.S.S.', name: 'EMSSANAR E.S.S.' },
  { id: 'CAPITAL SALUD EPS-S', name: 'CAPITAL SALUD EPS-S' },
  { id: 'SAVIA SALUD EPS', name: 'SAVIA SALUD EPS' },
  { id: 'DUSAKAWI EPSI', name: 'DUSAKAWI EPSI' },
  {
    id: 'ASOCIACION INDIGENA DEL CAUCA EPSI',
    name: 'ASOCIACION INDIGENA DEL CAUCA EPSI',
  },
  { id: 'ANAS WAYUU EPSI', name: 'ANAS WAYUU EPSI' },
  { id: 'MALLAMAS EPSI', name: 'MALLAMAS EPS' },
  { id: 'PIJAOS SALUD EPSI', name: 'PIJAOS SALUD EPSI' },
  { id: 'SALUD BÓLIVAR EPS SAS', name: 'SALUD BÓLIVAR EPS SAS' },
  { id: 'ECOPETROL', name: 'ECOPETROL' },
  { id: 'EPS SURAMERICANA S.A', name: 'EPS SURAMERICANA S.A' },
  { id: 'SALUD BOLÍVAR EPS SAS', name: 'SALUD BOLÍVAR EPS SAS' },
  { id: 'FUERZAS MILITARES', name: 'FUERZAS MILITARES' },
  { id: 'POLICIA NACIONAL SANIDAD', name: 'POLICIA NACIONAL SANIDAD' },
  { id: 'MAGISTERIO', name: 'MAGISTERIO' },
  { id: 'UNIVERSIDAD DEL ATLANTICO', name: 'UNIVERSIDAD DEL ATLANTICO' },
  {
    id: 'UNIVERSIDAD INDUSTRIAL DE SANTANDER',
    name: 'UNIVERSIDAD INDUSTRIAL DE SANTANDER',
  },
  { id: 'UNIVERSIDAD DEL VALLE', name: 'UNIVERSIDAD DEL VALLE' },
  {
    id: 'UNIVERSIDAD NACIONAL DE COLOMBIA',
    name: 'UNIVERSIDAD NACIONAL DE COLOMBIA',
  },
  { id: 'UNIVERSIDAD DEL CAUCA', name: 'UNIVERSIDAD DEL CAUCA' },
  { id: 'UNIVERSIDAD DE CARTAGENA', name: 'UNIVERSIDAD DE CARTAGENA' },
  { id: 'UNIVERSIDAD DE ANTIOQUIA', name: 'UNIVERSIDAD DE ANTIOQUIA' },
  { id: 'UNIVERSIDAD DE CORDOBA', name: 'UNIVERSIDAD DE CORDOBA' },
  { id: 'UNIVERSIDAD DE NARIÑO', name: 'UNIVERSIDAD DE NARIÑO' },
  {
    id: 'UNIVERSIDAD PEDAGOGICA Y TECNOLOGICA DE COLOMBIA - UPTC',
    name: 'UNIVERSIDAD PEDAGOGICA Y TECNOLOGICA DE COLOMBIA - UPTC',
  },
  { id: 'NO SABE', name: 'NO SABE' },
  { id: 'OTRA EPS', name: 'OTRA EPS' },
];

/** User State Enum */
export enum UserState {
  ACTIVE = 'ACTIVE',
  DISABLE = 'DISABLE',
  VERIFICATION_PENDING = 'VERIFICATION_PENDING',
}

export interface IEditUser extends ReduxDefaultStateWithoutData {
  user?: IUser;
}
