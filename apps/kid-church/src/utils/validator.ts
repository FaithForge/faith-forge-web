/* eslint-disable @typescript-eslint/no-explicit-any */
export const checkLastNameField = (_: any, value: string) => {
  const lastNameArray = value.trim().split(' ');

  if (lastNameArray.length >= 2) {
    return Promise.resolve();
  }
  return Promise.reject();
};

export const checkPhoneField = (_: any, value: string) => {
  const phoneNumber = value.trim();

  if (phoneNumber.length >= 10) {
    return Promise.resolve();
  }
  return Promise.reject();
};
