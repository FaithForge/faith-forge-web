import { DateTime } from 'luxon';

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
