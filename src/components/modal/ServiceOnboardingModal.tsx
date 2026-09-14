import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import {
  setActiveCampus,
  setActiveGroupConfig,
  setOnboardingCompleted,
} from '@/libs/state/redux/slices/church/volunteerContext.slice';
import { updateCurrentChurchCampus } from '@/libs/state/redux/slices/church/churchCampus.slice';
import {
  IVolunteerCampusContext,
  IVolunteerGroupConfigContext,
  VolunteerRole,
} from '@/libs/models/Volunteer';
import { Building2, Users, ChevronRight, Sparkles, Check } from 'lucide-react';
import clsx from 'clsx';
import { capitalizeWords, formatPersonFirstAndLastNames } from '@/libs/utils/text';

interface ServiceOnboardingModalProps {
  /** If true, force opens the modal as a selector (e.g., from TopBar) */
  forceOpen?: boolean;
  onClose?: () => void;
}

const ROLE_DISPLAY_NAME: Partial<Record<VolunteerRole, string>> = {
  [VolunteerRole.VOLUNTEER]: 'Servidor(a)',
  [VolunteerRole.SUPERVISOR]: 'Supervisor(a)',
  [VolunteerRole.GROUP_COORDINATOR]: 'Coordinador(a) de Grupo',
  [VolunteerRole.AREA_GENERAL_COORDINATOR]: 'Coordinador(a) de Área',
  [VolunteerRole.MINISTRY_GENERAL_COORDINATOR]: 'Coordinador(a) General',
};

export const ServiceOnboardingModal: React.FC<ServiceOnboardingModalProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.authSlice.user);
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);
  const userMsRoles = useAppSelector((state) => state.authSlice.userMsRoles || []);

  const {
    isChurchVolunteer,
    campuses,
    activeCampusId,
    activeGroupConfigId,
    isOnboardingCompleted,
  } = useAppSelector((state) => state.volunteerContextSlice);

  const masterCampuses = useAppSelector((state) => state.churchCampusSlice.data);

  // Sort campuses strictly by their system position (from volunteer context position or master catalog position)
  const sortedCampuses = useMemo(() => {
    const positionMap = new Map(masterCampuses.map((c, idx) => [c.id, c.position ?? idx]));
    return [...campuses].sort((a, b) => {
      const posA = a.position !== undefined && a.position !== null ? a.position : (positionMap.get(a.id) ?? 9999);
      const posB = b.position !== undefined && b.position !== null ? b.position : (positionMap.get(b.id) ?? 9999);
      if (posA !== posB) {
        return posA - posB;
      }
      return a.name.localeCompare(b.name);
    });
  }, [campuses, masterCampuses]);

  // Check if role is fixed in User MS (normal experience applies)
  const isUserMsRole = currentRole && userMsRoles.includes(currentRole);

  // Determine if onboarding is required
  const needsOnboarding =
    forceOpen ||
    (!isUserMsRole &&
      isChurchVolunteer &&
      sortedCampuses.length > 0 &&
      (!isOnboardingCompleted || !activeCampusId));

  const [selectedCampus, setSelectedCampus] = useState<IVolunteerCampusContext | null>(null);
  const [step, setStep] = useState<'AUTO_CONNECTING' | 'SELECT_CAMPUS' | 'SELECT_GROUP'>('SELECT_CAMPUS');

  // Initialize state based on current campuses
  useEffect(() => {
    if (!needsOnboarding) return;

    if (sortedCampuses.length === 1 && !forceOpen) {
      const singleCampus = sortedCampuses[0];
      setSelectedCampus(singleCampus);
      dispatch(
        setActiveCampus({
          campusId: singleCampus.id,
          campusName: singleCampus.name,
        }),
      );
      dispatch(updateCurrentChurchCampus(singleCampus.id));

      // Show the connecting transition screen
      setStep('AUTO_CONNECTING');
      const timer = setTimeout(() => {
        // If single campus has >1 groups, ask for group. Otherwise auto-select and complete
        if (singleCampus.groups.length > 1) {
          setStep('SELECT_GROUP');
        } else {
          if (singleCampus.groups.length === 1) {
            const singleGroup = singleCampus.groups[0];
            const primaryRole = singleGroup.areas[0]?.role || singleGroup.groupRole || null;
            dispatch(
              setActiveGroupConfig({
                groupConfigId: singleGroup.id,
                groupConfigName: singleGroup.name,
                role: primaryRole,
              }),
            );
          }
          dispatch(setOnboardingCompleted(true));
          window.dispatchEvent(new CustomEvent('open-settings-drawer'));
          if (onClose) onClose();
        }
      }, 1500);

      return () => clearTimeout(timer);
    } else if (sortedCampuses.length > 1) {
      // If campus already active, pre-select it
      if (activeCampusId) {
        const match = sortedCampuses.find((c) => c.id === activeCampusId);
        if (match) setSelectedCampus(match);
      }
      setStep('SELECT_CAMPUS');
    } else if (sortedCampuses.length === 1 && forceOpen) {
      setSelectedCampus(sortedCampuses[0]);
      setStep('SELECT_GROUP');
    }
  }, [needsOnboarding, sortedCampuses, activeCampusId, forceOpen, dispatch, onClose]);

  if (!needsOnboarding) return null;

  const handleSelectCampus = (campus: IVolunteerCampusContext) => {
    setSelectedCampus(campus);
    dispatch(
      setActiveCampus({
        campusId: campus.id,
        campusName: campus.name,
      }),
    );
    dispatch(updateCurrentChurchCampus(campus.id));

    // Check if group selection is required
    const isCrossCoordinator =
      campus.areaCoordinates.length > 0 || !!campus.ministryCoordinator;

    if (campus.groups.length > 1) {
      setStep('SELECT_GROUP');
    } else {
      if (campus.groups.length === 1) {
        const singleGroup = campus.groups[0];
        const primaryRole = singleGroup.areas[0]?.role || singleGroup.groupRole || null;
        dispatch(
          setActiveGroupConfig({
            groupConfigId: singleGroup.id,
            groupConfigName: singleGroup.name,
            role: primaryRole,
          }),
        );
      } else if (isCrossCoordinator) {
        // Cross-cutting role with no specific group
        dispatch(
          setActiveGroupConfig({
            groupConfigId: '',
            groupConfigName: '',
            role: campus.ministryCoordinator?.role || campus.areaCoordinates[0]?.role || null,
          }),
        );
      }
      dispatch(setOnboardingCompleted(true));
      window.dispatchEvent(new CustomEvent('open-settings-drawer'));
      if (onClose) onClose();
    }
  };

  const handleSelectGroup = (group: IVolunteerGroupConfigContext) => {
    const primaryRole = group.areas[0]?.role || group.groupRole || null;
    dispatch(
      setActiveGroupConfig({
        groupConfigId: group.id,
        groupConfigName: group.name,
        role: primaryRole,
      }),
    );
    dispatch(setOnboardingCompleted(true));
    window.dispatchEvent(new CustomEvent('open-settings-drawer'));
    if (onClose) onClose();
  };

  const userName =
    formatPersonFirstAndLastNames(user?.firstName, user?.lastName) || 'Servidor(a)';

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Step 1: Auto Connecting splash screen for single campus */}
        {step === 'AUTO_CONNECTING' && selectedCampus && (
          <div className="p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner animate-pulse">
                <Building2 className="w-10 h-10 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4 animate-spin duration-1000" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">
                Conectando con la sede
              </h2>
              <p className="text-base font-bold text-primary">
                {selectedCampus.name}
              </p>
              <p className="text-xs text-gray-400 font-medium">
                Preparando tu entorno y jornada de servicio...
              </p>
            </div>

            <div className="w-36 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-indeterminate" />
            </div>
          </div>
        )}

        {/* Step 2: Select Campus (if multiple campuses exist) */}
        {step === 'SELECT_CAMPUS' && (
          <div className="p-6 sm:p-7 flex flex-col flex-1 min-h-0">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">
                ¡Hola, {userName}!
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
                ¿En qué sede vas a brindar tu servicio hoy?
              </p>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {sortedCampuses.map((campus) => {
                const isSelected = activeCampusId === campus.id;
                const groupCount = campus.groups.length;

                return (
                  <button
                    key={campus.id}
                    onClick={() => handleSelectCampus(campus)}
                    className={clsx(
                      'w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all group',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50/80 bg-white shadow-xs',
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={clsx(
                          'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                          isSelected
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary',
                        )}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm sm:text-base">
                          {campus.name}
                        </h3>
                        <p className="text-xs text-gray-400 font-medium">
                          {groupCount > 0
                            ? `${groupCount} ${groupCount === 1 ? 'grupo asignado' : 'grupos asignados'}`
                            : 'Coordinación'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Select Group (if multiple groups exist in the chosen campus) */}
        {step === 'SELECT_GROUP' && selectedCampus && (
          <div className="p-6 sm:p-7 flex flex-col flex-1 min-h-0">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">
                Grupo de Servicio
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
                ¿Bajo qué grupo vas a servir en <span className="font-bold text-gray-700">{selectedCampus.name}</span>?
              </p>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {selectedCampus.groups.map((group) => {
                const isSelected = activeGroupConfigId === group.id;
                const primaryRole = group.areas[0]?.role || group.groupRole || VolunteerRole.VOLUNTEER;
                const roleLabel = ROLE_DISPLAY_NAME[primaryRole] || 'Servidor';
                const areasLabel = group.areas.map((a) => a.name).join(', ') || 'Área asignada';

                return (
                  <button
                    key={group.id}
                    onClick={() => handleSelectGroup(group)}
                    className={clsx(
                      'w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all group',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50/80 bg-white shadow-xs',
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={clsx(
                          'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                          isSelected
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary',
                        )}
                      >
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm sm:text-base">
                          {group.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            {roleLabel}
                          </span>
                          <span className="text-xs text-gray-400 font-medium truncate max-w-[170px]">
                            {areasLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Back button if multiple campuses */}
            {sortedCampuses.length > 1 && (
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-start">
                <button
                  onClick={() => setStep('SELECT_CAMPUS')}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors px-2 py-1"
                >
                  ← Cambiar de sede
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ServiceOnboardingModal;
