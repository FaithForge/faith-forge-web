import React, { ReactNode } from 'react';
import { usePermissions } from '@/libs/hooks/usePermissions';
import { AppCapability, hasCapability } from '@/libs/utils/auth/capabilities';

export type { AppCapability };

export interface CanProps {
  /**
   * The capability or array of capabilities required to render children.
   * If an array is provided, matches depending on `mode` ('any' or 'all').
   */
  capability?: AppCapability | AppCapability[];
  /**
   * Optional custom condition callback taking permissions object.
   */
  check?: (permissions: ReturnType<typeof usePermissions>) => boolean;
  /**
   * Matching mode when an array of capabilities is provided. Defaults to 'any'.
   */
  mode?: 'any' | 'all';
  /**
   * Optional fallback content to render when permissions are not met.
   */
  fallback?: ReactNode;
  /**
   * Content to render when authorized.
   */
  children: ReactNode;
}

/**
 * Declarative component to conditionally render UI based on semantic capabilities.
 * Eliminates ad-hoc role ternary checks (e.g. `isAdmin || isAreaCoordinator ? ... : null`).
 *
 * @example
 * <Can capability="attendance:view-cross-areas">
 *   <AreaAttendanceFilter />
 * </Can>
 *
 * @param {CanProps} props - Configuration props for capability check.
 * @returns {JSX.Element | null} Rendered children or fallback.
 */
export const Can: React.FC<CanProps> = ({
  capability,
  check,
  mode = 'any',
  fallback = null,
  children,
}) => {
  const permissions = usePermissions();

  let isAllowed = false;

  if (check) {
    isAllowed = check(permissions);
  } else if (capability) {
    if (Array.isArray(capability)) {
      isAllowed =
        mode === 'all'
          ? capability.every((cap) => hasCapability(cap, permissions))
          : capability.some((cap) => hasCapability(cap, permissions));
    } else {
      isAllowed = hasCapability(capability, permissions);
    }
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default Can;
