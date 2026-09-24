import { NavigateFunction } from 'react-router-dom';

/**
 * Navigates to a different screen using the provided router navigate function.
 *
 * @param {NavigateFunction} navigate - The react-router-dom navigate function instance.
 * @param {string} screen - The target route path.
 * @returns {void}
 */
export const navigateScreen = (navigate: NavigateFunction, screen: string): void => {
  navigate(screen);
};
