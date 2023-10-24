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
  CC = 'Cédula de Ciudadanía',
  TI = 'Tarjeta de Identidad',
  RC = 'Registro Cívil',
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
}

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
