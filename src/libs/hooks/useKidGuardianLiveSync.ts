import { useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import { kidChurchApi } from '@/libs/state/redux/api/kidChurchApi';
import { API_BASE_URL } from '@/libs/common-types/global';

export interface UseKidGuardianLiveSyncOptions {
  guardianId?: string;
  enabled?: boolean;
}

/**
 * Custom React hook establishing a resilient Server-Sent Events (SSE) connection
 * to receive real-time check-in and check-out updates for a specific guardian.
 *
 * Automatically invalidates RTK Query cache tags when an event arrives,
 * causing the guardian dashboard to update instantaneously without a manual refresh,
 * and triggers an in-app visual and haptic notification.
 *
 * @param {UseKidGuardianLiveSyncOptions} options - Options containing guardianId and enabled flag.
 */
export const useKidGuardianLiveSync = ({
  guardianId,
  enabled = true,
}: UseKidGuardianLiveSyncOptions) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation(['kidGuardian', 'common']);

  useEffect(() => {
    if (!enabled || !guardianId) return;

    const sseUrl = `${API_BASE_URL}/ms-kid-church/kid-guardian/events?guardianId=${encodeURIComponent(
      guardianId
    )}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        if (!event.data) return;
        const payload = JSON.parse(event.data);

        if (payload?.type === 'KID_REGISTERED') {
          // Invalidate cache to trigger instant UI refresh
          dispatch(
            kidChurchApi.util.invalidateTags([
              { type: 'KidGuardian', id: 'LIST' },
              { type: 'KidGuardian', id: guardianId },
              { type: 'KidRegistered', id: 'LIST' },
              'Notification',
            ])
          );

          // Subtle haptic feedback if device supports it
          try {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate([100, 50, 100]);
            }
          } catch {
            // Ignore if vibration disallowed
          }

          // In-app banner toast notification
          const kidName = payload.kidName || 'Tu hijo(a)';
          const groupName = payload.kidGroupName || 'su salón';
          toast.success(
            t('kidGuardian:dashboard.live_checkin_toast', {
              kid: kidName,
              classroom: groupName,
              defaultValue: `¡${kidName} fue registrado con éxito para el salón ${groupName}!`,
            }),
            {
              duration: 7000,
            }
          );
        } else if (payload?.type === 'KID_REMOVED') {
          dispatch(
            kidChurchApi.util.invalidateTags([
              { type: 'KidGuardian', id: 'LIST' },
              { type: 'KidGuardian', id: guardianId },
              { type: 'KidRegistered', id: 'LIST' },
            ])
          );
        } else if (payload?.type === 'URGENT_NOTICE') {
          // Vibración háptica continua en primer plano
          try {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate([1000, 250, 1000, 250, 1000, 250, 1000, 250, 1000]);
            }
          } catch {
            // Ignore
          }

          const kidName = payload.kidName || 'Tu hijo(a)';
          const groupName = payload.kidGroupName || 'el salón';
          const reason = payload.reason || 'Se requiere tu presencia';
          toast.error(`🚨 AVISO URGENTE: ${kidName}`, {
            description: `Por favor acércate a ${groupName}. Motivo: ${reason}`,
            duration: 20000,
          });

          dispatch(kidChurchApi.util.invalidateTags(['Notification']));
        }
      } catch {
        // Heartbeats or raw text are safely ignored
      }
    };

    eventSource.onerror = () => {
      // EventSource automatically handles retry/reconnection per W3C specification.
    };

    return () => {
      eventSource.close();
    };
  }, [guardianId, enabled, dispatch, t]);
};
