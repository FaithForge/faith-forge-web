import { RootState } from '@/libs/state/redux';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { PiFileText, PiGearSix, PiUserList } from 'react-icons/pi';
import { useSelector } from 'react-redux';
import KidChurchSettingsModal from '../modal/KidChurchSettingsModal';
import { showConfirmationModal } from '../modal/ConfirmationModal';

type Props = {
  children?: React.ReactNode;
};

const KidChurchLayout = ({ children }: Props) => {
  const router = useRouter();
  const churchCampusSlice = useSelector((state: RootState) => state.churchCampusSlice);
  const churchMeetingSlice = useSelector((state: RootState) => state.churchMeetingSlice);

  useEffect(() => {
    if (!churchCampusSlice.current || !churchMeetingSlice.current)
      showConfirmationModal('settingsKidChurchModal');
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
          <button onClick={() => showConfirmationModal('settingsKidChurchModal')}>
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
