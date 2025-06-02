/* eslint-disable @typescript-eslint/no-explicit-any */
export const checkLastNameField = (_: any, value: string) => {
  const lastNameArray = value.trim().split(' ');

  if (lastNameArray.length >= 2) {
    return Promise.resolve();
  }
  return Promise.reject();
};
