import { ChurchMeetingStateEnum, IChurchCampus } from '@/libs/models';
import { AppDispatch, RootState } from '@/libs/state/redux';
import { resetAdminChurchMeetingStatus } from '@/libs/state/redux/slices/church/adminChurchMeeting.slice';
import {
  BulkUpdateChurchMeetingStates,
  GetAllChurchMeetingsAdmin,
  GetChurchCampuses,
} from '@/libs/state/redux/thunks/church/church.thunk';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PiCheckCircle, PiWarningCircle, PiSpinnerGap } from 'react-icons/pi';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { ColorType } from '@/libs/common-types/constants/theme';

/** Map from ChurchMeetingStateEnum to Spanish label + DaisyUI badge class */
const STATE_META: Record<
  ChurchMeetingStateEnum,
  { label: string; badgeClass: string }
> = {
  [ChurchMeetingStateEnum.ACTIVE]: {
    label: 'Activo',
    badgeClass: 'badge-success',
  },
  [ChurchMeetingStateEnum.ACTIVE_WITHOUT_DISPLAY]: {
    label: 'Activo sin pantalla',
    badgeClass: 'badge-warning',
  },
  [ChurchMeetingStateEnum.DISABLE]: {
    label: 'Deshabilitado',
    badgeClass: 'badge-neutral',
  },
};

/**
 * Admin component to manage church meeting states.
 * Displays a campus selector and an editable list of meetings with inline state pickers.
 * Changes are batched and sent via the bulk-state PATCH endpoint on save.
 */
const ChurchMeetingManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const campuses: IChurchCampus[] = useSelector(
    (state: RootState) => state.churchCampusSlice.data,
  );
  const campusesLoading: boolean = useSelector(
    (state: RootState) => state.churchCampusSlice.loading,
  );

  const meetings = useSelector(
    (state: RootState) => state.adminChurchMeetingSlice.meetings,
  );
  const loadingMeetings = useSelector(
    (state: RootState) => state.adminChurchMeetingSlice.loadingMeetings,
  );
  const loadingUpdate = useSelector(
    (state: RootState) => state.adminChurchMeetingSlice.loadingUpdate,
  );
  const updateError = useSelector(
    (state: RootState) => state.adminChurchMeetingSlice.error,
  );
  const updateSuccess = useSelector(
    (state: RootState) => state.adminChurchMeetingSlice.success,
  );

  const [selectedCampusId, setSelectedCampusId] = useState<string>('');

  /** Local state of pending state changes: meetingId → new state */
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, ChurchMeetingStateEnum>
  >({});

  // Load campuses on mount
  useEffect(() => {
    dispatch(GetChurchCampuses());
  }, [dispatch]);

  // Auto-select first campus when campuses load
  useEffect(() => {
    if (campuses.length > 0 && !selectedCampusId) {
      setSelectedCampusId(campuses[0].id);
    }
  }, [campuses, selectedCampusId]);

  // Fetch meetings when campus changes
  useEffect(() => {
    if (selectedCampusId) {
      setPendingChanges({});
      dispatch(resetAdminChurchMeetingStatus());
      dispatch(GetAllChurchMeetingsAdmin(selectedCampusId));
    }
  }, [dispatch, selectedCampusId]);

  // Auto-dismiss success/error feedback after 4 s
  useEffect(() => {
    if (updateSuccess || updateError) {
      const timer = setTimeout(() => dispatch(resetAdminChurchMeetingStatus()), 4000);
      return () => clearTimeout(timer);
    }
  }, [dispatch, updateSuccess, updateError]);

  /**
   * Returns the effective state for a meeting, applying any pending local change.
   *
   * @param {string} id - The meeting ID.
   * @param {ChurchMeetingStateEnum | undefined} originalState - The state from the server.
   * @returns {ChurchMeetingStateEnum} The current effective state.
   */
  const effectiveState = useCallback(
    (id: string, originalState?: ChurchMeetingStateEnum): ChurchMeetingStateEnum =>
      pendingChanges[id] ?? originalState ?? ChurchMeetingStateEnum.ACTIVE,
    [pendingChanges],
  );

  /**
   * Handles local state change for a meeting.
   *
   * @param {string} id - The meeting ID.
   * @param {ChurchMeetingStateEnum} originalState - The original state from the server.
   * @param {ChurchMeetingStateEnum} newState - The newly selected state.
   */
  const handleStateChange = useCallback(
    (
      id: string,
      originalState: ChurchMeetingStateEnum | undefined,
      newState: ChurchMeetingStateEnum,
    ) => {
      setPendingChanges((prev) => {
        const updated = { ...prev };
        // Remove from pending if reverting to original
        if (newState === originalState) {
          delete updated[id];
        } else {
          updated[id] = newState;
        }
        return updated;
      });
    },
    [],
  );

  /** Items that will be sent in the bulk update */
  const changedItems = useMemo(
    () =>
      Object.entries(pendingChanges).map(([id, state]) => ({ id, state })),
    [pendingChanges],
  );

  const hasPendingChanges = changedItems.length > 0;

  /**
   * Dispatches the bulk-state update with all pending changes.
   */
  const handleSave = useCallback(() => {
    if (!hasPendingChanges) return;
    dispatch(BulkUpdateChurchMeetingStates(changedItems)).then((result) => {
      if (BulkUpdateChurchMeetingStates.fulfilled.match(result)) {
        // Reload meetings to reflect saved states
        dispatch(GetAllChurchMeetingsAdmin(selectedCampusId));
        setPendingChanges({});
      }
    });
  }, [dispatch, changedItems, hasPendingChanges, selectedCampusId]);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="border-l-4 border-primary pl-4">
        <h2 className="text-xl font-bold text-primary">Gestión de Servicios</h2>
        <p className="text-sm text-gray-500">
          Selecciona una sede y actualiza el estado de sus servicios.
        </p>
      </div>

      {/* Campus selector */}
      <div className="form-control">
        <label htmlFor="campus-select" className="label">
          <span className="label-text font-semibold uppercase text-xs tracking-wider">
            Sede (Campus)
          </span>
        </label>
        {campusesLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <PiSpinnerGap className="animate-spin text-lg" />
            <span className="text-sm">Cargando sedes…</span>
          </div>
        ) : (
          <select
            id="campus-select"
            className="select select-bordered w-full"
            value={selectedCampusId}
            onChange={(e) => setSelectedCampusId(e.target.value)}
          >
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Feedback banners */}
      {updateSuccess && (
        <Alert
          type={ColorType.SUCCESS}
          title="Estados actualizados correctamente."
          icon={<PiCheckCircle className="text-lg" />}
        />
      )}
      {updateError && (
        <Alert
          type={ColorType.ERROR}
          title={updateError}
          icon={<PiWarningCircle className="text-lg" />}
        />
      )}

      {/* Meetings list */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-0">
          {loadingMeetings ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-400">
              <PiSpinnerGap className="animate-spin text-4xl" />
              <p className="text-sm">Cargando servicios…</p>
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-sm">No hay servicios registrados para esta sede.</p>
            </div>
          ) : (
            <ul className="divide-y divide-base-200">
              {meetings.map((meeting) => {
                const current = effectiveState(meeting.id, meeting.state);
                const meta = STATE_META[current];
                const isChanged = pendingChanges[meeting.id] !== undefined;

                return (
                  <li
                    key={meeting.id}
                    className={`flex items-center justify-between gap-4 p-4 hover:bg-base-200 transition-colors ${
                      isChanged ? 'bg-purple-50 border-l-4 border-purple-400' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-sm truncate">{meeting.name}</span>
                      {isChanged && (
                        <span className="badge badge-sm badge-secondary whitespace-nowrap">
                          modificado
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`badge badge-sm ${meta.badgeClass} whitespace-nowrap`}>
                        {meta.label}
                      </span>
                      <select
                        id={`meeting-state-${meeting.id}`}
                        className="select select-xs select-bordered"
                        value={current}
                        onChange={(e) =>
                          handleStateChange(
                            meeting.id,
                            meeting.state,
                            e.target.value as ChurchMeetingStateEnum,
                          )
                        }
                      >
                        {Object.values(ChurchMeetingStateEnum).map((s) => (
                          <option key={s} value={s}>
                            {STATE_META[s].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          id="save-meeting-states-btn"
          variant="primary"
          loading={loadingUpdate}
          loadingText="Guardando…"
          disabled={!hasPendingChanges}
          onClick={handleSave}
        >
          {`Guardar cambios${hasPendingChanges ? ` (${changedItems.length})` : ''}`}
        </Button>
      </div>
    </div>
  );
};

export default ChurchMeetingManager;
