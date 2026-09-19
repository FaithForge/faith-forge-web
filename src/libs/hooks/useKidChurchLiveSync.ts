import { useEffect } from 'react';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import { kidChurchApi } from '@/libs/state/redux/api/kidChurchApi';
import { API_BASE_URL } from '@/libs/common-types/global';

export interface UseKidChurchLiveSyncOptions {
  churchMeetingId?: string;
  enabled?: boolean;
}

/**
 * Custom React hook establishing a resilient Server-Sent Events (SSE) connection
 * to receive real-time attendance changes from the kid church microservice.
 *
 * Automatically invalidates RTK Query cache tags when an attendance update event arrives,
 * ensuring classroom counts and attendance lists update instantaneously in real-time.
 *
 * @param options - Options containing churchMeetingId and enabled flag.
 */
export const useKidChurchLiveSync = ({
  churchMeetingId,
  enabled = true,
}: UseKidChurchLiveSyncOptions) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!enabled || !churchMeetingId) return;

    // Connect to SSE stream
    const sseUrl = `${API_BASE_URL}/ms-kid-church/kid-group/events?churchMeetingId=${encodeURIComponent(
      churchMeetingId
    )}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        if (!event.data) return;
        const payload = JSON.parse(event.data);

        if (payload?.type === 'ATTENDANCE_UPDATED') {
          // Declarative tag invalidation: triggers RTK Query background re-fetch in real time
          dispatch(
            kidChurchApi.util.invalidateTags([
              { type: 'KidRegistered', id: 'LIST' },
              { type: 'KidGroup', id: 'LIST' },
              'Notification',
            ])
          );
        }
      } catch {
        // Heartbeats or raw string messages are ignored gracefully
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
