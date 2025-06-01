import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { PiFileText, PiGearSix, PiPlusCircle, PiQrCode } from 'react-icons/pi';
import KidRegistrationSettingsModal from '../modal/KidRegistrationSettingsModal';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/state/redux';
import KidRegistrationReportModal from '../modal/KidRegistrationReportModal';
import { UserRole } from '@/libs/utils/auth';

type Props = {
  children?: React.ReactNode;
};

const KidRegistrationLayout = ({ children }: Props) => {
  const router = useRouter();
  const churchSlice = useSelector((state: RootState) => state.churchSlice);
  const churchMeetingSlice = useSelector(
    (state: RootState) => state.churchMeetingSlice,
  );
  const churchPrinterSlice = useSelector(
    (state: RootState) => state.churchPrinterSlice,
  );

  const authSlice = useSelector((state: RootState) => state.authSlice);
  const currentRole = authSlice.currentRole;

  useEffect(() => {
    if (
      !churchSlice.current ||
      !churchMeetingSlice.current ||
      !churchPrinterSlice.current
    ) {
      const dialog = document.getElementById(
        'settingsKidRegistrationModal',
      ) as HTMLDialogElement | null;
      dialog?.showModal();
    }
  }, []);

  return (
    <>
      <div className="pb-20" style={{ minHeight: '100vh' }}>
        {children}
        <div className="dock">
          <button onClick={() => router.push('/kid-registration/qrReader')}>
            <PiQrCode className="h-8 w-8" />
            <span className="dock-label">Escanear QR</span>
          </button>
          <button onClick={() => router.push('/kid-registration/newKid')}>
            <PiPlusCircle className="h-8 w-8" />
            <span className="dock-label">Crear niño</span>
          </button>
          <button
            onClick={() => {
              const dialog = document.getElementById(
                'settingsKidRegistrationModal',
              ) as HTMLDialogElement | null;
              dialog?.showModal();
            }}
          >
            <PiGearSix className="h-8 w-8" />
            <span className="dock-label">Configurar</span>
          </button>
          {currentRole &&
            [
              UserRole.KID_REGISTER_ADMIN,
              UserRole.KID_REGISTER_SUPERVISOR,
            ]?.includes(currentRole) && (
              <button
                onClick={() => {
                  const dialog = document.getElementById(
                    'reportKidRegistrationModal',
                  ) as HTMLDialogElement | null;
                  dialog?.showModal();
                }}
              >
                <PiFileText className="h-8 w-8" />
                <span className="dock-label">Reporte</span>
              </button>
            )}
        </div>
      </div>
      <KidRegistrationSettingsModal />
      <KidRegistrationReportModal />
    </>
  );
};

export default KidRegistrationLayout;
