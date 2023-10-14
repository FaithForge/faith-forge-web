import { DateTime } from 'luxon';

export const MONTH_NUMBER_TO_LETTER: { [key: number]: string } = {
  1: 'Enero',
  2: 'Febrero',
  3: 'Marzo',
  4: 'Abril',
  5: 'Mayo',
  6: 'Junio',
  7: 'Julio',
  8: 'Agosto',
  9: 'Septiembre',
  10: 'Octubre',
  11: 'Noviembre',
  12: 'Diciembre',
};

export const calculateAge = (birthday: Date): number => {
  const today = DateTime.local();
  const birth = DateTime.fromJSDate(birthday);
  return today.diff(birth, 'years').years;
};

export const getAgeInMonths = (birthday: Date): number => {
  const today = new Date();
  const yearsDiff = today.getFullYear() - birthday.getFullYear();
  const monthsDiff = today.getMonth() - birthday.getMonth();
  const ageInMonths = yearsDiff * 12 + monthsDiff;
  return ageInMonths;
};

export const labelRendererCalendar = (type: string, data: number) => {
  switch (type) {
    case 'month':
      return MONTH_NUMBER_TO_LETTER[data];
    default:
      return data;
  }
};
