/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Navigate to a different screen using the provided navigation object.
 *
 * @param {any} navigation - The navigation object (router or navigator instance).
 * @param {string} screen - The target screen name.
 * @returns {void}
 */
export const navigateScreen = (navigation: any, screen: string) => {
  navigation.navigate(screen);
};
