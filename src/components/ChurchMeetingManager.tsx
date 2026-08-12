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
import styles from './ChurchMeetingManager.module.css';

/** Map from ChurchMeetingStateEnum to Spanish label + CSS class */
const STATE_META: Record<
  ChurchMeetingStateEnum,
  { label: string; className: string }
> = {
  [ChurchMeetingStateEnum.ACTIVE]: {
    label: 'Activo',
    className: styles.stateActive,
  },
  [ChurchMeetingStateEnum.ACTIVE_WITHOUT_DISPLAY]: {
    label: 'Activo sin pantalla',
    className: styles.stateActiveNoDisplay,
  },
  [ChurchMeetingStateEnum.DISABLE]: {
    label: 'Deshabilitado',
    className: styles.stateDisable,
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
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Gestión de Servicios</h2>
        <p className={styles.subtitle}>
          Selecciona una sede y actualiza el estado de sus servicios.
        </p>
      </div>

      {/* Campus selector */}
      <div className={styles.selectorWrapper}>
        <label htmlFor="campus-select" className={styles.label}>
          Sede (Campus)
        </label>
        {campusesLoading ? (
          <div className={styles.loadingRow}>
            <PiSpinnerGap className={styles.spinner} />
            <span>Cargando sedes…</span>
          </div>
        ) : (
          <select
            id="campus-select"
            className={styles.select}
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
        <div className={`${styles.banner} ${styles.bannerSuccess}`}>
          <PiCheckCircle className={styles.bannerIcon} />
          Estados actualizados correctamente.
        </div>
      )}
      {updateError && (
        <div className={`${styles.banner} ${styles.bannerError}`}>
          <PiWarningCircle className={styles.bannerIcon} />
          {updateError}
        </div>
      )}

      {/* Meetings list */}
      <div className={styles.meetingsSection}>
        {loadingMeetings ? (
          <div className={styles.loadingBlock}>
            <PiSpinnerGap className={`${styles.spinner} ${styles.spinnerLarge}`} />
            <p>Cargando servicios…</p>
          </div>
        ) : meetings.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No hay servicios registrados para esta sede.</p>
          </div>
        ) : (
          <ul className={styles.meetingList}>
            {meetings.map((meeting) => {
              const current = effectiveState(meeting.id, meeting.state);
              const meta = STATE_META[current];
              const isChanged = pendingChanges[meeting.id] !== undefined;

              return (
                <li
                  key={meeting.id}
                  className={`${styles.meetingItem} ${isChanged ? styles.meetingItemDirty : ''}`}
                >
                  <div className={styles.meetingInfo}>
                    <span className={styles.meetingName}>{meeting.name}</span>
                    {isChanged && (
                      <span className={styles.dirtyBadge}>modificado</span>
                    )}
                  </div>

                  <div className={styles.stateControl}>
                    <span className={`${styles.stateBadge} ${meta.className}`}>
                      {meta.label}
                    </span>
                    <select
                      id={`meeting-state-${meeting.id}`}
                      className={styles.stateSelect}
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

      {/* Save button */}
      <div className={styles.footer}>
        <button
          id="save-meeting-states-btn"
          className={styles.saveBtn}
          disabled={!hasPendingChanges || loadingUpdate}
          onClick={handleSave}
        >
          {loadingUpdate ? (
            <>
              <PiSpinnerGap className={styles.spinner} />
              Guardando…
            </>
          ) : (
            `Guardar cambios${hasPendingChanges ? ` (${changedItems.length})` : ''}`
          )}
        </button>
      </div>
    </div>
  );
};

export default ChurchMeetingManager;
