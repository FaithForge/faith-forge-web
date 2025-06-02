import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { PiFileText, PiGearSix, PiHouse, PiPlusCircle, PiQrCode } from 'react-icons/pi';
import KidRegistrationSettingsModal from '../modal/KidRegistrationSettingsModal';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/state/redux';
import KidRegistrationReportModal from '../modal/KidRegistrationReportModal';
import { UserRole } from '@/libs/utils/auth';
import { DateTime } from 'luxon';

type Props = {
  children?: React.ReactNode;
};

const KidRegistrationLayout = ({ children }: Props) => {
  const router = useRouter();
  const churchCampusSlice = useSelector((state: RootState) => state.churchCampusSlice);
  const churchMeetingSlice = useSelector((state: RootState) => state.churchMeetingSlice);
  const churchPrinterSlice = useSelector((state: RootState) => state.churchPrinterSlice);

  const authSlice = useSelector((state: RootState) => state.authSlice);
  const currentRole = authSlice.currentRole;
  const [disableActions, setDisableActions] = useState<boolean>(false);

  useEffect(() => {
    if (!churchCampusSlice.current || !churchMeetingSlice.current || !churchPrinterSlice.current) {
      const dialog = document.getElementById(
        'settingsKidRegistrationModal',
      ) as HTMLDialogElement | null;
      dialog?.showModal();
    }
  }, []);

  useEffect(() => {
    const currentDay = DateTime.local().toFormat('EEEE');
    if (churchMeetingSlice.current && churchPrinterSlice.current) {
      let warning = false;
      if (currentDay.toUpperCase() === churchMeetingSlice.current.day.toUpperCase()) {
        const currentTime = DateTime.local().toFormat('HH:mm:ss');
        if (churchMeetingSlice.current.initialRegistrationHour >= currentTime) {
          warning = true;
          setDisableActions(true);
        }
        if (currentTime >= churchMeetingSlice.current.finalRegistrationHour) {
          warning = true;
          setDisableActions(true);
        }
      } else {
        warning = true;
        setDisableActions(true);
      }
      if (!warning || currentRole === UserRole.KID_REGISTER_ADMIN) {
        setDisableActions(false);
      }
    }
  }, [churchMeetingSlice.current, churchPrinterSlice.current, currentRole]);

  return (
    <>
      <div className="pb-20" style={{ minHeight: '100vh' }}>
        {children}
        <div className="dock">
          <button onClick={() => router.push('/kid-registration')}>
            <PiHouse className="h-8 w-8" />
            <span className="dock-label">Inicio</span>
          </button>
          <button
            onClick={() => router.push('/kid-registration/qrReader')}
            disabled={disableActions}
            className={`${disableActions ? 'opacity-60' : 'opacity-0'}`}
          >
            <PiQrCode className={`h-8 w-8 ${disableActions ? 'opacity-60' : 'opacity-0'}`} />
            <span className={`dock-label ${disableActions ? 'opacity-60' : 'opacity-0'}`}>
              Escanear QR
            </span>
          </button>
          <button
            onClick={() => router.push('/kid-registration/newKid')}
            disabled={disableActions}
            className={`${disableActions ? 'opacity-60' : 'opacity-0'}`}
          >
            <PiPlusCircle className={`h-8 w-8 ${disableActions ? 'opacity-60' : 'opacity-0'}`} />
            <span className={`dock-label ${disableActions ? 'opacity-60' : 'opacity-0'}`}>
              Crear niño
            </span>
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
            [UserRole.KID_REGISTER_ADMIN, UserRole.KID_REGISTER_SUPERVISOR]?.includes(
              currentRole,
            ) && (
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
