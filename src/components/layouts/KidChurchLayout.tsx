import { RootState } from '@/libs/state/redux';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { PiFileText, PiGearSix, PiQrCode, PiUserList } from 'react-icons/pi';
import { useSelector } from 'react-redux';
import KidChurchSettingsModal from '../modal/KidChurchSettingsModal';
import KidChurchReportModal from '../modal/KidChurchReportModal';

type Props = {
  children?: React.ReactNode;
};

const KidChurchLayout = ({ children }: Props) => {
  const router = useRouter();
  const churchSlice = useSelector((state: RootState) => state.churchSlice);
  const churchMeetingSlice = useSelector(
    (state: RootState) => state.churchMeetingSlice,
  );

  useEffect(() => {
    if (!churchSlice.current || !churchMeetingSlice.current) {
      const dialog = document.getElementById(
        'settingsKidChurchModal',
      ) as HTMLDialogElement | null;
      dialog?.showModal();
    }
  }, []);

  return (
    <>
      <div style={{ minHeight: '100vh' }}>
        {children}
        <div className="dock">
          <button onClick={() => router.push('/kid-church')}>
            <PiUserList className="h-8 w-8" />
            <span className="dock-label">Niños Registrados</span>
          </button>
          <button
            onClick={() => {
              const dialog = document.getElementById(
                'settingsKidChurchModal',
              ) as HTMLDialogElement | null;
              dialog?.showModal();
            }}
          >
            <PiGearSix className="h-8 w-8" />
            <span className="dock-label">Configurar</span>
          </button>
          <button onClick={() => router.push('/kid-church/report')}>
            <PiFileText className="h-8 w-8" />
            <span className="dock-label">Reporte</span>
          </button>
        </div>
      </div>
      <KidChurchSettingsModal />
    </>
  );
};

export default KidChurchLayout;
