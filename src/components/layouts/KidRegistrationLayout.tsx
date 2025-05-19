import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { PiGearSix, PiPlusCircle, PiQrCode } from 'react-icons/pi';
import KidRegistrationSettingsModal from '../modal/KidRegistrationSettingsModal';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppDispatch,
  GetChurchMeetings,
  GetChurchPrinters,
  RootState,
} from '@/libs/state/redux';
import { ChurchMeetingStateEnum } from '@/libs/models';

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
          <button onClick={() => router.push('/registration/qrReader')}>
            <PiQrCode className="h-8 w-8" />
            <span className="dock-label">Escanear QR</span>
          </button>
          <button onClick={() => router.push('/registration/newKid')}>
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
        </div>
      </div>
      <KidRegistrationSettingsModal />
    </>
  );
};

export default KidRegistrationLayout;
