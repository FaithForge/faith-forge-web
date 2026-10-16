import { ChurchModule } from '@/libs/models/Church';
import { useAppSelector } from '@/libs/state/redux/hooks';

export interface UseChurchModulesReturn {
  enabledModules: ChurchModule[];
  hasModule: (module: ChurchModule) => boolean;
}

/**
 * Hook to access and evaluate the platform modules enabled for the active church.
 *
 * @returns {UseChurchModulesReturn} Active modules array and predicate helper
 */
export const useChurchModules = (): UseChurchModulesReturn => {
  const activeChurch = useAppSelector((state) => state.churchCampusSlice.church);
  const enabledModules: ChurchModule[] = activeChurch?.enabledModules || [];

  /**
   * Checks whether a specific platform module is enabled for the current church.
   *
   * @param {ChurchModule} module - The module enum to check
   * @returns {boolean} True if module is enabled
   */
  const hasModule = (module: ChurchModule): boolean => {
    return enabledModules.includes(module);
  };

  return { enabledModules, hasModule };
};
