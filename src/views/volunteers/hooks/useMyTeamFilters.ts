import { useMemo } from 'react';
import { IVolunteerAssignment, VolunteerRole } from '@/libs/models/Volunteer';
import { EntityState } from '@/libs/models';

export interface UseMyTeamFiltersProps {
  assignments: IVolunteerAssignment[];
  searchTerm: string;
  isAreaCoordinator: boolean;
  isGroupCoordinator: boolean;
  effectiveAreaId?: string;
  effectiveGroupId?: string;
  selectedAreaFilter: string;
  selectedGroupFilter: string;
  supervisorAreaIds: string[];
  supervisorSagIds: string[];
}

const ROLE_HIERARCHY: Record<VolunteerRole, number> = {
  [VolunteerRole.MINISTRY_GENERAL_COORDINATOR]: 5,
  [VolunteerRole.AREA_GENERAL_COORDINATOR]: 4,
  [VolunteerRole.GROUP_COORDINATOR]: 3,
  [VolunteerRole.SUPERVISOR]: 2,
  [VolunteerRole.VOLUNTEER]: 1,
};

/**
 * Hook to filter and sort volunteer assignments according to role permissions and search criteria.
 *
 * @param {UseMyTeamFiltersProps} props - Filtering inputs.
 * @returns {IVolunteerAssignment[]} Sorted and filtered assignments list.
 */
export const useMyTeamFilters = ({
  assignments,
  searchTerm,
  isAreaCoordinator,
  isGroupCoordinator,
  effectiveAreaId,
  effectiveGroupId,
  selectedAreaFilter,
  selectedGroupFilter,
  supervisorAreaIds,
  supervisorSagIds,
}: UseMyTeamFiltersProps) => {
  const filteredAssignments = useMemo(() => {
    const list = assignments.filter((asg: IVolunteerAssignment) => {
      if (asg.state === EntityState.DELETED) return false;

      if (isAreaCoordinator) {
        const isAllowedRole =
          asg.role === VolunteerRole.SUPERVISOR || asg.role === VolunteerRole.VOLUNTEER;
        if (!isAllowedRole) return false;

        if (effectiveAreaId) {
          const asgAreaId =
            asg.ministryAreaId ||
            asg.serviceAreaGroup?.ministryAreaId ||
            asg.serviceAreaGroup?.ministryArea?.id;
          if (asgAreaId && asgAreaId !== effectiveAreaId) {
            return false;
          }
        }

        if (selectedGroupFilter !== 'ALL') {
          const asgGroupId =
            asg.ministryGroupConfigId ||
            asg.ministryGroupConfig?.id ||
            asg.serviceAreaGroup?.ministryGroupConfigId ||
            asg.serviceAreaGroup?.ministryGroupConfig?.id;
          if (asgGroupId !== selectedGroupFilter) {
            return false;
          }
        }
      } else if (isGroupCoordinator) {
        const isAllowedRole =
          asg.role === VolunteerRole.GROUP_COORDINATOR ||
          asg.role === VolunteerRole.SUPERVISOR ||
          asg.role === VolunteerRole.VOLUNTEER;
        if (!isAllowedRole) return false;

        if (selectedAreaFilter === 'COORDINATORS') {
          if (asg.role !== VolunteerRole.GROUP_COORDINATOR) {
            return false;
          }
        } else if (selectedAreaFilter !== 'ALL') {
          if (asg.role === VolunteerRole.GROUP_COORDINATOR) {
            return false;
          }
          const asgAreaId =
            asg.ministryAreaId ||
            asg.serviceAreaGroup?.ministryAreaId ||
            asg.serviceAreaGroup?.ministryArea?.id;
          if (asgAreaId !== selectedAreaFilter) {
            return false;
          }
        }
      } else {
        const isAllowedRole =
          asg.role === VolunteerRole.SUPERVISOR || asg.role === VolunteerRole.VOLUNTEER;
        if (!isAllowedRole) return false;

        if (effectiveGroupId) {
          const asgGroupId =
            asg.ministryGroupConfigId ||
            asg.ministryGroupConfig?.id ||
            asg.serviceAreaGroup?.ministryGroupConfigId ||
            asg.serviceAreaGroup?.ministryGroupConfig?.id;
          if (asgGroupId && asgGroupId !== effectiveGroupId) {
            return false;
          }
        }

        if (supervisorAreaIds.length > 0 || supervisorSagIds.length > 0) {
          const asgAreaId =
            asg.ministryAreaId ||
            asg.serviceAreaGroup?.ministryAreaId ||
            asg.serviceAreaGroup?.ministryArea?.id;
          const asgSagId = asg.serviceAreaGroupId || asg.serviceAreaGroup?.id;

          const matchesArea =
            (asgAreaId && supervisorAreaIds.includes(asgAreaId)) ||
            (asgSagId && supervisorSagIds.includes(asgSagId));

          if (!matchesArea) return false;
        }
      }

      // Filter by search query
      const user = asg.user || asg.volunteer?.user;
      const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.toLowerCase();
      const nationalId = `${user?.nationalId || ''}`.toLowerCase();
      const phone = `${user?.phone || ''}`.toLowerCase();
      const term = searchTerm.trim().toLowerCase();

      if (!term) return true;
      return (
        fullName.includes(term) || nationalId.includes(term) || phone.includes(term)
      );
    });

    // Sort by role hierarchy descending, then by name ascending
    return list.sort((a, b) => {
      const hierarchyA = ROLE_HIERARCHY[a.role] || 0;
      const hierarchyB = ROLE_HIERARCHY[b.role] || 0;
      if (hierarchyA !== hierarchyB) return hierarchyB - hierarchyA;

      const userA = a.user || a.volunteer?.user;
      const userB = b.user || b.volunteer?.user;
      const nameA = `${userA?.firstName || ''} ${userA?.lastName || ''}`.trim();
      const nameB = `${userB?.firstName || ''} ${userB?.lastName || ''}`.trim();
      return nameA.localeCompare(nameB);
    });
  }, [
    assignments,
    searchTerm,
    isAreaCoordinator,
    isGroupCoordinator,
    effectiveAreaId,
    effectiveGroupId,
    selectedAreaFilter,
    selectedGroupFilter,
    supervisorAreaIds,
    supervisorSagIds,
  ]);

  return filteredAssignments;
};
