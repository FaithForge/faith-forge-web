import React, { createContext, useCallback, useContext, useRef } from 'react';

/**
 * A guard function. Return `true` to allow navigation, `false` to block it.
 * The guard is responsible for showing confirmation UI when blocking.
 */
type GuardFn = (to: string) => boolean;

interface NavigationGuardContextValue {
  /** Register a guard. Returns an unregister function. */
  registerGuard: (fn: GuardFn) => () => void;
  /** Called by BottomNav before navigating. Returns true if navigation should proceed. */
  requestNavigation: (to: string) => boolean;
}

const NavigationGuardContext = createContext<NavigationGuardContextValue>({
  registerGuard: () => () => {},
  requestNavigation: () => true,
});

/**
 * Provides navigation guard functionality to child components.
 *
 * @param {React.ReactNode} children - Child components.
 * @returns {JSX.Element} The context provider.
 */
export const NavigationGuardProvider = ({ children }: { children: React.ReactNode }) => {
  const guardRef = useRef<GuardFn | null>(null);

  const registerGuard = useCallback((fn: GuardFn) => {
    guardRef.current = fn;
    return () => { guardRef.current = null; };
  }, []);

  const requestNavigation = useCallback((to: string) => {
    if (guardRef.current) return guardRef.current(to);
    return true;
  }, []);

  return (
    <NavigationGuardContext.Provider value={{ registerGuard, requestNavigation }}>
      {children}
    </NavigationGuardContext.Provider>
  );
};

/** Hook to consume the NavigationGuardContext. */
export const useNavigationGuard = () => useContext(NavigationGuardContext);
