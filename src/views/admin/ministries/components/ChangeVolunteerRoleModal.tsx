import Button from '@/components/ui/Button';
import ModalOverlay from '@/components/ui/ModalOverlay';
import Select from '@/components/ui/Select';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { getVolunteerRoleLabel, useChurchTerm } from '@/libs/hooks/useTerm';
import {
  IChurchCampus,
  IMinistryArea,
  IMinistryGroupConfig,
  IServiceAreaGroup,
  IVolunteer,
  IVolunteerAssignment,
  MinistryAreaStateEnum,
  MinistryGroupConfigStateEnum,
  MinistryType,
  ServiceAreaGroupStateEnum,
  VolunteerRole,
} from '@/libs/models';
import { useUpdateVolunteerAssignmentMutation } from '@/libs/state/redux/api/churchApi';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetVolunteerAssignments } from '@/libs/state/redux/thunks/church/volunteer.thunk';
import { capitalizeWords } from '@/libs/utils/text';
import clsx from 'clsx';
import {
  AlertTriangle,
  ArrowUpDown,
  Award,
  Check,
  Crown,
  History,
  Info,
  Layers,
  ShieldCheck,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export interface ChangeVolunteerRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: IVolunteerAssignment | null;
  ministryId: string;
  churchCampusId?: string;
  areas: IMinistryArea[];
  groups: IMinistryGroupConfig[];
  campuses: IChurchCampus[];
  serviceAreaGroups: IServiceAreaGroup[];
  volunteersList?: IVolunteer[];
  onSuccess?: () => void;
}

/**
 * Modal drawer for promoting, demoting, or changing a volunteer's role and scope,
 * displaying an explicit impact notice on active assignments and historical attendance tracking.
 *
 * @param {ChangeVolunteerRoleModalProps} props - Component properties.
 * @returns {JSX.Element | null} The rendered role transition modal.
 */
export const ChangeVolunteerRoleModal: React.FC<
  ChangeVolunteerRoleModalProps
> = ({
  open,
  onOpenChange,
  assignment,
  ministryId,
  churchCampusId,
  areas,
  groups,
  campuses,
  serviceAreaGroups,
  volunteersList = [],
  onSuccess,
}) => {
  useModalBackClose(open, () => onOpenChange(false));

  const { t } = useTranslation('admin');
  const dispatch = useAppDispatch();
  const [updateVolunteerAssignment, { isLoading: submitting }] =
    useUpdateVolunteerAssignmentMutation();

  const currentMinistry = useAppSelector((state) =>
    state.ministrySlice.ministries.find((m) => m.id === ministryId),
  );
  const churchOverrides = useAppSelector(
    (state) =>
      state.churchCampusSlice.churchTerminologyOverrides ||
      state.churchCampusSlice.church?.terminologyOverrides,
  );
  const ministryOverrides = useAppSelector((state) => {
    const minType = currentMinistry?.type || MinistryType.GENERAL;
    return (
      state.churchCampusSlice.ministryTerminologyOverrides?.[minType] ||
      state.churchCampusSlice.church?.ministryTerminologyOverrides?.[minType]
    );
  });
  const volunteerTerm = useChurchTerm('volunteer');
  const campusTerm = useChurchTerm('campus');

  const [selectedRole, setSelectedRole] = useState<VolunteerRole>(
    VolunteerRole.VOLUNTEER,
  );
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedCampusId, setSelectedCampusId] = useState(
    churchCampusId || '',
  );
  const [selectedTeamAreaId, setSelectedTeamAreaId] = useState('');
  const [selectedTeamGroupId, setSelectedTeamGroupId] = useState('');

  const roleDefinitions = useMemo(() => {
    const isKids = currentMinistry?.type === MinistryType.KIDS;
    const volunteerLabel = getVolunteerRoleLabel(VolunteerRole.VOLUNTEER, {
      ministryType: currentMinistry?.type,
      ministryOverrides,
      churchOverrides,
    });
    const volunteerDesc = isKids
      ? t('volunteer_role_change.role_volunteer_kids_desc')
      : t('volunteer_role_change.role_volunteer_general_desc');

    return [
      {
        role: VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
        label: t('volunteer_role_change.role_coord_ministry_label'),
        description: t('volunteer_role_change.role_coord_ministry_desc'),
        icon: Crown,
      },
      {
        role: VolunteerRole.AREA_GENERAL_COORDINATOR,
        label: t('volunteer_role_change.role_coord_area_label'),
        description: t('volunteer_role_change.role_coord_area_desc'),
        icon: Layers,
      },
      {
        role: VolunteerRole.GROUP_COORDINATOR,
        label: t('volunteer_role_change.role_coord_group_label'),
        description: t('volunteer_role_change.role_coord_group_desc'),
        icon: Users,
      },
      {
        role: VolunteerRole.SUPERVISOR,
        label: t('volunteer_role_change.role_supervisor_label'),
        description: t('volunteer_role_change.role_supervisor_desc'),
        icon: ShieldCheck,
      },
      {
        role: VolunteerRole.VOLUNTEER,
        label: volunteerLabel,
        description: volunteerDesc,
        icon: Award,
      },
    ];
  }, [currentMinistry, ministryOverrides, churchOverrides, t]);

  // Available active teams in selected campus
  const availableTeams = useMemo<IServiceAreaGroup[]>(() => {
    return serviceAreaGroups.filter((sag) => {
      const isSagActive =
        !sag.state || sag.state === ServiceAreaGroupStateEnum.ACTIVE;
      return (
        (!selectedCampusId ||
          !sag.churchCampusId ||
          sag.churchCampusId === selectedCampusId) &&
        isSagActive
      );
    });
  }, [serviceAreaGroups, selectedCampusId]);

  const availableAreasForCampus = useMemo<IMinistryArea[]>(() => {
    const areaIdSet = new Set(
      availableTeams.map((team) => team.ministryAreaId),
    );
    return areas.filter(
      (area) =>
        (!area.state || area.state === MinistryAreaStateEnum.ACTIVE) &&
        areaIdSet.has(area.id),
    );
  }, [availableTeams, areas]);

  const availableGroupsForArea = useMemo<IMinistryGroupConfig[]>(() => {
    const matchingTeams = availableTeams.filter(
      (team) => team.ministryAreaId === selectedTeamAreaId,
    );
    const groupIdSet = new Set(
      matchingTeams.map((team) => team.ministryGroupConfigId),
    );
    return groups
      .filter(
        (group) =>
          group.state === MinistryGroupConfigStateEnum.ACTIVE &&
          groupIdSet.has(group.id),
      )
      .sort((first, second) => first.position - second.position);
  }, [availableTeams, selectedTeamAreaId, groups]);

  const matchedTeam = useMemo<IServiceAreaGroup | undefined>(() => {
    return availableTeams.find(
      (team) =>
        team.ministryAreaId === selectedTeamAreaId &&
        team.ministryGroupConfigId === selectedTeamGroupId,
    );
  }, [availableTeams, selectedTeamAreaId, selectedTeamGroupId]);

  // Initialize form from current assignment when opened
  useEffect(() => {
    if (!open || !assignment) return;

    const activeAreas = areas.filter(
      (a) => a.state === MinistryAreaStateEnum.ACTIVE,
    );
    const activeGroups = groups.filter(
      (g) => g.state === MinistryGroupConfigStateEnum.ACTIVE,
    );

    // Suggest a sensible target role initially (e.g. VOLUNTEER <-> SUPERVISOR)
    if (assignment.role === VolunteerRole.VOLUNTEER) {
      setSelectedRole(VolunteerRole.SUPERVISOR);
    } else if (assignment.role === VolunteerRole.SUPERVISOR) {
      setSelectedRole(VolunteerRole.VOLUNTEER);
    } else {
      setSelectedRole(assignment.role);
    }

    const currentTeam =
      assignment.serviceAreaGroup ||
      serviceAreaGroups.find((sag) => sag.id === assignment.serviceAreaGroupId);

    const initialCampusId =
      currentTeam?.churchCampusId ||
      assignment.churchCampusId ||
      churchCampusId ||
      campuses[0]?.id ||
      '';
    setSelectedCampusId(initialCampusId);

    const initialAreaId =
      assignment.ministryAreaId ||
      currentTeam?.ministryAreaId ||
      activeAreas[0]?.id ||
      '';
    const initialGroupId =
      assignment.ministryGroupConfigId ||
      currentTeam?.ministryGroupConfigId ||
      activeGroups[0]?.id ||
      '';

    setSelectedAreaId(initialAreaId);
    setSelectedGroupId(initialGroupId);

    const campusTeams = serviceAreaGroups.filter((sag) => {
      return (
        (!initialCampusId ||
          !sag.churchCampusId ||
          sag.churchCampusId === initialCampusId) &&
        (!sag.state || sag.state === ServiceAreaGroupStateEnum.ACTIVE)
      );
    });

    if (currentTeam) {
      setSelectedTeamAreaId(currentTeam.ministryAreaId);
      setSelectedTeamGroupId(currentTeam.ministryGroupConfigId);
    } else if (campusTeams.length > 0) {
      setSelectedTeamAreaId(campusTeams[0].ministryAreaId);
      setSelectedTeamGroupId(campusTeams[0].ministryGroupConfigId);
    } else {
      setSelectedTeamAreaId(initialAreaId);
      setSelectedTeamGroupId(initialGroupId);
    }
  }, [
    open,
    assignment,
    areas,
    groups,
    campuses,
    churchCampusId,
    serviceAreaGroups,
  ]);

  /**
   * Handles campus selection changes and updates team area/group defaults.
   *
   * @param {string} newCampusId - Selected campus ID.
   */
  const handleCampusChange = (newCampusId: string) => {
    setSelectedCampusId(newCampusId);
    const campusTeams = serviceAreaGroups.filter((team) => {
      return (
        (!newCampusId ||
          !team.churchCampusId ||
          team.churchCampusId === newCampusId) &&
        (!team.state || team.state === ServiceAreaGroupStateEnum.ACTIVE)
      );
    });
    if (campusTeams.length > 0) {
      const areaExists = campusTeams.some(
        (t) => t.ministryAreaId === selectedTeamAreaId,
      );
      const targetAreaId = areaExists
        ? selectedTeamAreaId
        : campusTeams[0].ministryAreaId;
      setSelectedTeamAreaId(targetAreaId);

      const areaTeams = campusTeams.filter(
        (t) => t.ministryAreaId === targetAreaId,
      );
      const groupExists = areaTeams.some(
        (t) => t.ministryGroupConfigId === selectedTeamGroupId,
      );
      const targetGroupId = groupExists
        ? selectedTeamGroupId
        : areaTeams[0]?.ministryGroupConfigId || '';
      setSelectedTeamGroupId(targetGroupId);
    } else {
      setSelectedTeamAreaId('');
      setSelectedTeamGroupId('');
    }
  };

  /**
   * Handles team area selection changes and updates available group selection.
   *
   * @param {string} newAreaId - Selected area ID.
   */
  const handleTeamAreaChange = (newAreaId: string) => {
    setSelectedTeamAreaId(newAreaId);
    const matchingTeams = availableTeams.filter(
      (team) => team.ministryAreaId === newAreaId,
    );
    if (matchingTeams.length > 0) {
      const groupExists = matchingTeams.some(
        (team) => team.ministryGroupConfigId === selectedTeamGroupId,
      );
      if (!groupExists)
        setSelectedTeamGroupId(matchingTeams[0].ministryGroupConfigId);
    } else {
      setSelectedTeamGroupId('');
    }
  };

  if (!assignment) return null;

  const vId =
    assignment.volunteerId ||
    assignment.churchMemberId ||
    assignment.ministryVolunteerId;
  const vol =
    assignment.volunteer ||
    assignment.churchMember ||
    assignment.ministryVolunteer ||
    volunteersList.find(
      (v) =>
        v.id === vId || (v.userId && v.userId === assignment.volunteer?.userId),
    );
  const user =
    assignment.churchMember?.user ||
    assignment.volunteer?.user ||
    vol?.user ||
    assignment.user;
  const fullName =
    user && (user.firstName || user.lastName)
      ? capitalizeWords(`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim())
      : volunteerTerm;

  const currentRoleLabel = getVolunteerRoleLabel(assignment.role, {
    ministryType: currentMinistry?.type,
    ministryOverrides,
    churchOverrides,
  });
  const targetRoleLabel = getVolunteerRoleLabel(selectedRole, {
    ministryType: currentMinistry?.type,
    ministryOverrides,
    churchOverrides,
  });

  const currentTeam =
    assignment.serviceAreaGroup ||
    serviceAreaGroups.find((sag) => sag.id === assignment.serviceAreaGroupId);

  const currentScopeLabel = (() => {
    if (currentTeam) {
      const areaName =
        areas.find((a) => a.id === currentTeam.ministryAreaId)?.name ||
        currentTeam.ministryArea?.name ||
        '';
      const groupName =
        groups.find((g) => g.id === currentTeam.ministryGroupConfigId)?.name ||
        currentTeam.ministryGroupConfig?.name ||
        '';
      return `${areaName} × ${groupName}`;
    }
    if (assignment.ministryAreaId) {
      return (
        areas.find((a) => a.id === assignment.ministryAreaId)?.name ||
        assignment.ministryArea?.name ||
        t('volunteer_role_change.general_scope')
      );
    }
    if (assignment.ministryGroupConfigId) {
      return (
        groups.find((g) => g.id === assignment.ministryGroupConfigId)?.name ||
        assignment.ministryGroupConfig?.name ||
        t('volunteer_role_change.general_scope')
      );
    }
    return currentMinistry?.name || t('volunteer_role_change.general_scope');
  })();

  const targetScopeLabel = (() => {
    if (
      selectedRole === VolunteerRole.VOLUNTEER ||
      selectedRole === VolunteerRole.SUPERVISOR
    ) {
      const areaName =
        areas.find((a) => a.id === selectedTeamAreaId)?.name || '';
      const groupName =
        groups.find((g) => g.id === selectedTeamGroupId)?.name || '';
      return areaName && groupName ? `${areaName} × ${groupName}` : '';
    }
    if (selectedRole === VolunteerRole.GROUP_COORDINATOR) {
      return groups.find((g) => g.id === selectedGroupId)?.name || '';
    }
    if (selectedRole === VolunteerRole.AREA_GENERAL_COORDINATOR) {
      return areas.find((a) => a.id === selectedAreaId)?.name || '';
    }
    return currentMinistry?.name || t('volunteer_role_change.general_scope');
  })();

  const isTeamScope =
    selectedRole === VolunteerRole.VOLUNTEER ||
    selectedRole === VolunteerRole.SUPERVISOR;

  // Determine if the selection is identical to the current assignment
  const isNoChange = (() => {
    if (selectedRole !== assignment.role) return false;
    if (isTeamScope) return matchedTeam?.id === assignment.serviceAreaGroupId;
    if (selectedRole === VolunteerRole.GROUP_COORDINATOR) {
      return selectedGroupId === assignment.ministryGroupConfigId;
    }
    if (selectedRole === VolunteerRole.AREA_GENERAL_COORDINATOR) {
      return selectedAreaId === assignment.ministryAreaId;
    }
    return true;
  })();

  // Determine whether the origin assignment will be closed or kept active
  const closesOrigin = (() => {
    if (
      (assignment.role === VolunteerRole.VOLUNTEER ||
        assignment.role === VolunteerRole.SUPERVISOR) &&
      (selectedRole === VolunteerRole.AREA_GENERAL_COORDINATOR ||
        selectedRole === VolunteerRole.MINISTRY_GENERAL_COORDINATOR)
    ) {
      return false;
    }
    if (
      assignment.role === VolunteerRole.GROUP_COORDINATOR &&
      (selectedRole === VolunteerRole.AREA_GENERAL_COORDINATOR ||
        selectedRole === VolunteerRole.MINISTRY_GENERAL_COORDINATOR)
    ) {
      return false;
    }
    if (
      (assignment.role === VolunteerRole.VOLUNTEER ||
        assignment.role === VolunteerRole.SUPERVISOR) &&
      selectedRole === VolunteerRole.GROUP_COORDINATOR
    ) {
      const originGroupId = currentTeam?.ministryGroupConfigId;
      return Boolean(originGroupId && originGroupId === selectedGroupId);
    }
    return true;
  })();

  /**
   * Submits the role/scope transition via RTK Query mutation.
   *
   * @param {React.FormEvent} event - Form submission event.
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isNoChange) return;

    let targetServiceAreaGroupId: string | undefined;
    let targetMinistryGroupConfigId: string | undefined;
    let targetMinistryAreaId: string | undefined;
    let targetMinistryId: string | undefined;

    if (isTeamScope) {
      if (!matchedTeam) {
        toast.error(t('volunteer_role_change.invalid_team_error'));
        return;
      }
      targetServiceAreaGroupId = matchedTeam.id;
    } else if (selectedRole === VolunteerRole.GROUP_COORDINATOR) {
      if (!selectedGroupId) {
        toast.error(t('volunteer_role_change.invalid_group_error'));
        return;
      }
      targetMinistryGroupConfigId = selectedGroupId;
    } else if (selectedRole === VolunteerRole.AREA_GENERAL_COORDINATOR) {
      if (!selectedAreaId) {
        toast.error(t('volunteer_role_change.invalid_area_error'));
        return;
      }
      targetMinistryAreaId = selectedAreaId;
    } else if (selectedRole === VolunteerRole.MINISTRY_GENERAL_COORDINATOR) {
      targetMinistryId = ministryId;
    }

    try {
      await updateVolunteerAssignment({
        id: assignment.id,
        role: selectedRole,
        serviceAreaGroupId: targetServiceAreaGroupId,
        ministryGroupConfigId: targetMinistryGroupConfigId,
        ministryAreaId: targetMinistryAreaId,
        ministryId: targetMinistryId,
      }).unwrap();

      await dispatch(GetVolunteerAssignments({ ministryId, force: true }));
      toast.success(
        t('volunteer_role_change.success_toast', { role: targetRoleLabel }),
      );
    } catch (err: unknown) {
      let errMsg = t('volunteer_role_change.error_toast', {
        volunteer: volunteerTerm.toLowerCase(),
      });
      if (typeof err === 'object' && err !== null) {
        const anyErr = err as { data?: { message?: string }; message?: string };
        if (typeof anyErr.data?.message === 'string')
          errMsg = anyErr.data.message;
        else if (typeof anyErr.message === 'string') errMsg = anyErr.message;
      }
      toast.error(errMsg);
      return;
    }

    onOpenChange(false);
    try {
      onSuccess?.();
    } catch {
      // Ignore post-success callback errors
    }
  };

  return (
    <ModalOverlay
      open={open}
      onClose={() => onOpenChange(false)}
      wrapperClassName="items-center justify-center p-3 sm:p-4"
      panelClassName="w-full max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-gray-200/90 mx-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="w-full bg-white border-b border-gray-100 flex items-center justify-between px-5 py-4 shrink-0">
          <div className="w-8 shrink-0" />
          <h2 className="font-bold text-gray-800 text-base sm:text-lg flex items-center justify-center gap-2 text-center flex-1 truncate px-2">
            <ArrowUpDown className="text-primary shrink-0" size={20} />
            <span className="truncate">
              {t('volunteer_role_change.modal_title')}
            </span>
          </h2>
          <div className="w-8 shrink-0 flex items-center justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-700 active:scale-95 transition-all shrink-0 cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto flex-1 p-4 sm:p-5 flex flex-col gap-5"
        >
          {/* 1. Current Assignment Summary */}
          <div>
            <label className="text-xs font-bold text-gray-800 uppercase tracking-wide block mb-1.5">
              {t('volunteer_role_change.current_assignment_label')}
            </label>
            <div className="bg-slate-50 border border-gray-200/90 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
              <div className="w-11 h-11 rounded-full bg-white border border-gray-200 text-primary flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                {user?.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon size={20} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-gray-900 truncate">
                  {fullName}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  <span className="text-[11px] text-gray-500">
                    {t('volunteer_role_change.current_role_prefix')}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {currentRoleLabel}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 mt-0.5 truncate">
                  <span className="text-gray-500">
                    {t('volunteer_role_change.current_scope_prefix')}{' '}
                  </span>
                  <span className="font-semibold">{currentScopeLabel}</span>
                </p>
              </div>
            </div>
          </div>

          {/* 2. Target Role Selection */}
          <div>
            <label className="text-xs font-bold text-gray-800 uppercase tracking-wide block mb-1.5">
              {t('volunteer_role_change.select_new_role_label')}
            </label>
            <div className="flex flex-col gap-2">
              {roleDefinitions.map((item) => {
                const isSelected = selectedRole === item.role;
                const Icon = item.icon;
                return (
                  <div
                    key={item.role}
                    onClick={() => setSelectedRole(item.role)}
                    className={clsx(
                      'p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300',
                    )}
                  >
                    <div
                      className={clsx(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                        isSelected
                          ? 'bg-primary text-white'
                          : 'bg-slate-100 text-gray-600',
                      )}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-900">
                          {item.label}
                        </p>
                        {isSelected && (
                          <Check size={16} className="text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Target Scope Selection */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200/80 flex flex-col gap-3">
            <label className="text-xs font-bold text-gray-800 uppercase tracking-wide block">
              {t('volunteer_role_change.select_new_scope_label')}
            </label>

            {selectedRole === VolunteerRole.MINISTRY_GENERAL_COORDINATOR && (
              <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-700">
                <span className="font-bold">
                  {t('volunteer_role_change.global_scope_title')}
                </span>{' '}
                {t('volunteer_role_change.global_scope_desc')}
              </div>
            )}

            {selectedRole === VolunteerRole.AREA_GENERAL_COORDINATOR && (
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  {t('volunteer_role_change.area_to_coordinate_label')}
                </label>
                <Select
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                >
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {selectedRole === VolunteerRole.GROUP_COORDINATOR && (
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  {t('volunteer_role_change.group_to_coordinate_label')}
                </label>
                <Select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} (
                      {t('volunteer_role_change.position_suffix', {
                        position: group.position,
                      })}
                      )
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {isTeamScope && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    {t('volunteer_role_change.campus_label', {
                      campus: campusTerm,
                    })}
                  </label>
                  <Select
                    value={selectedCampusId}
                    onChange={(e) => handleCampusChange(e.target.value)}
                    disabled={Boolean(churchCampusId)}
                  >
                    {campuses.map((campus) => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name}
                      </option>
                    ))}
                  </Select>
                </div>

                {availableTeams.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    {t('volunteer_role_change.no_teams_warning')}
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        {t('volunteer_role_change.area_label')}
                      </label>
                      <Select
                        value={selectedTeamAreaId}
                        onChange={(e) => handleTeamAreaChange(e.target.value)}
                      >
                        {availableAreasForCampus.map((area) => (
                          <option key={area.id} value={area.id}>
                            {area.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        {t('volunteer_role_change.group_label')}
                      </label>
                      <Select
                        value={selectedTeamGroupId}
                        onChange={(e) => setSelectedTeamGroupId(e.target.value)}
                        disabled={availableGroupsForArea.length === 0}
                      >
                        {availableGroupsForArea.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Dynamic Impact & Traceability Notice */}
          {isNoChange ? (
            <div className="p-3 bg-slate-100 border border-gray-200 rounded-2xl flex items-center gap-2.5 text-xs text-gray-600">
              <Info size={16} className="text-gray-400 shrink-0" />
              <span>{t('volunteer_role_change.same_role_and_scope_hint')}</span>
            </div>
          ) : (
            <div
              className={clsx(
                'p-3.5 rounded-2xl border flex flex-col gap-2 text-xs',
                closesOrigin
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : 'bg-blue-50/80 border-blue-200 text-blue-900',
              )}
            >
              <div className="flex items-center gap-2 font-extrabold">
                <AlertTriangle
                  size={15}
                  className={clsx(
                    'shrink-0',
                    closesOrigin ? 'text-amber-600' : 'text-blue-600',
                  )}
                />
                <span>{t('volunteer_role_change.impact_notice_title')}</span>
              </div>
              <ul className="flex flex-col gap-1.5 pl-5 list-disc text-[11.5px] leading-snug">
                <li>
                  {t(
                    closesOrigin
                      ? 'volunteer_role_change.impact_closes_origin'
                      : 'volunteer_role_change.impact_keeps_origin',
                    {
                      fromRole: currentRoleLabel,
                      fromScope: currentScopeLabel,
                      toRole: targetRoleLabel,
                      toScope: targetScopeLabel,
                    },
                  )}
                </li>
                <li>
                  {t('volunteer_role_change.impact_attendance_preserved', {
                    fromRole: currentRoleLabel,
                  })}
                </li>
              </ul>
              <div className="flex items-center gap-1.5 pt-1 border-t border-current/10 text-[10.5px] opacity-80 font-semibold">
                <History size={12} className="shrink-0" />
                <span>{t('volunteer_role_change.impact_actor_tracked')}</span>
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-1 flex gap-3">
            <Button
              type="button"
              variant="default"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t('volunteer_role_change.cancel_btn')}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={submitting}
              loadingText={t('volunteer_role_change.submitting_btn')}
              disabled={isNoChange || (isTeamScope && !matchedTeam)}
            >
              {t('volunteer_role_change.confirm_btn')}
            </Button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
};

export default ChangeVolunteerRoleModal;
