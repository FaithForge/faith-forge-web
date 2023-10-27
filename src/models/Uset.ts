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

export enum IdTypeCode {
  CC = 'CC',
  TI = 'TI',
  RC = 'RC',
  CE = 'CE',
  PS = 'PS',
}

export enum IdType {
  CC = 'Cédula de Ciudadania',
  TI = 'Tarjeta de Identidad',
  RC = 'Registro civil',
  CE = 'Cédula de Extranjería',
  PS = 'Pasaporte',
}

export const ID_TYPE_MAPPER = {
  [IdType.CC]: IdTypeCode.CC,
  [IdType.TI]: IdTypeCode.TI,
  [IdType.RC]: IdTypeCode.RC,
  [IdType.CE]: IdTypeCode.CE,
  [IdType.PS]: IdTypeCode.PS,
};

export const ID_TYPE_CODE_MAPPER = {
  [IdTypeCode.CC]: IdType.CC,
  [IdTypeCode.TI]: IdType.TI,
  [IdTypeCode.RC]: IdType.RC,
  [IdTypeCode.CE]: IdType.CE,
  [IdTypeCode.PS]: IdType.PS,
};

export const idTypeSelect = [
  { value: IdTypeCode.CC, label: IdType.CC },
  { value: IdTypeCode.TI, label: IdType.TI },
  { value: IdTypeCode.RC, label: IdType.RC },
  { value: IdTypeCode.CE, label: IdType.CE },
  { value: IdTypeCode.PS, label: IdType.PS },
];

export interface IUser {
  firstName?: string;
  lastName?: string;
  churchGroup?: string;
}

export const healthSecurityEntitySelect = [
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
];
