import { useEffect } from 'react';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import { churchApi } from '@/libs/state/redux/api/churchApi';
import { API_BASE_URL } from '@/libs/common-types/global';

export interface UseVolunteerAttendanceLiveSyncOptions {
  churchMeetingId?: string;
  enabled?: boolean;
}

/**
 * Custom React hook establishing a resilient Server-Sent Events (SSE) connection
 * to receive real-time volunteer attendance changes from the Church microservice.
 *
 * Automatically invalidates RTK Query cache tags when a volunteer attendance update event arrives,
 * ensuring team attendance lists and dashboard counters update instantaneously across all connected coordinators.
 *
 * @param {UseVolunteerAttendanceLiveSyncOptions} options - Options containing churchMeetingId and enabled flag.
 */
export const useVolunteerAttendanceLiveSync = ({
  churchMeetingId,
  enabled = true,
}: UseVolunteerAttendanceLiveSyncOptions) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!enabled || !churchMeetingId) return;

    const sseUrl = `${API_BASE_URL}/ms-church/volunteer-attendance/events?churchMeetingId=${encodeURIComponent(
      churchMeetingId,
    )}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        if (!event.data) return;
        const payload = JSON.parse(event.data);

        if (payload?.type === 'VOLUNTEER_ATTENDANCE_UPDATED') {
          dispatch(
            churchApi.util.invalidateTags([
              { type: 'VolunteerAttendance', id: 'LIST' },
              { type: 'VolunteerAttendance', id: 'SUMMARY' },
            ]),
          );
        }
      } catch {
        // Heartbeats or non-JSON messages are ignored gracefully
      }
    };

    eventSource.onerror = () => {
      // EventSource automatically handles retry/reconnection per W3C specification.
    };

    return () => {
      eventSource.close();
    };
  }, [churchMeetingId, enabled, dispatch]);
};
