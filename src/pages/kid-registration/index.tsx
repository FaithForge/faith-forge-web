import type { NextPage } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import dayjs from 'dayjs';

import { Empty, List, Skeleton } from 'react-vant';
import {
  hasRequiredPermissions,
  withRoles,
} from '../../components/Permissions';
import { Layout } from '../../components/Layout';
import { IoIosArrowForward } from 'react-icons/io';
import {
  REGISTRATION_CONFIRM_COPY_LATER_HOURS_MEETING,
  REGISTRATION_CONFIRM_COPY_LOWER_HOURS_MEETING,
  REGISTRATION_CONFIRM_COPY_DIFFERENT_DAY_MEETING,
} from '@/libs/common-types/constants';
import { IKid, UserGenderCode } from '@/libs/models';
import {
  RootState,
  AppDispatch,
  GetKids,
  GetMoreKids,
  updateCurrentKid,
} from '@/libs/state/redux';
import {
  ChurchRoles,
  KidChurchRegisterRoles,
  UserRole,
} from '@/libs/utils/auth';
import { capitalizeWords } from '@/libs/utils/text';
import { PiCaretRight, PiWarning, PiX } from 'react-icons/pi';
import Alert from '@/components/Alert';
import HomeNavBar from '@/components/navbar/HomeNavBar';
import { ColorType } from '@/libs/common-types/constants/theme';
import Cell from '@/components/Cell';

const Registration: NextPage = () => {
  const {
    data: kids,
    currentPage,
    totalPages,
    loading,
  } = useSelector((state: RootState) => state.kidSlice);
  const { current: churchCampus } = useSelector(
    (state: RootState) => state.churchCampusSlice,
  );
  const { current: churchMeeting } = useSelector(
    (state: RootState) => state.churchMeetingSlice,
  );
  const churchPrinterSlice = useSelector(
    (state: RootState) => state.churchPrinterSlice,
  );
  const authSlice = useSelector((state: RootState) => state.authSlice);
  const currentRole = authSlice.currentRole;

  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
  const router = useRouter();
  const [findText, setFindText] = useState('');
  const [warningAlert, setWarningAlert] = useState({
    message: '',
    icon: '',
    blockRegister: false,
  });

  useEffect(() => {
    dispatch(GetKids({ findText }));
  }, [dispatch, pathname]);

  useEffect(() => {
    const currentDay = DateTime.local().toFormat('EEEE');
    if (churchMeeting && churchPrinterSlice.current) {
      let warning = false;
      if (currentDay.toUpperCase() === churchMeeting.day.toUpperCase()) {
        const currentTime = DateTime.local().toFormat('HH:mm:ss');

        // If the current time is greater than the meeting end time
        if (churchMeeting.initialRegistrationHour >= currentTime) {
          warning = true;
          setWarningAlert({
            ...REGISTRATION_CONFIRM_COPY_LATER_HOURS_MEETING,
            blockRegister: true,
          });
        }
        // If the current time is greater than the meeting end time
        if (currentTime >= churchMeeting.finalRegistrationHour) {
          warning = true;
          setWarningAlert({
            ...REGISTRATION_CONFIRM_COPY_LOWER_HOURS_MEETING,
            blockRegister: true,
          });
        }
      } else {
        warning = true;
        setWarningAlert({
          ...REGISTRATION_CONFIRM_COPY_DIFFERENT_DAY_MEETING,
          blockRegister: true,
        });
      }
      if (!warning) {
        setWarningAlert({
          message: '',
          icon: '',
          blockRegister: false,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [churchMeeting, churchPrinterSlice.current]);

  const getMoreKids = async () => {
    dispatch(GetMoreKids({ findText }));
  };

  const registerKidViewHandler = (kid: IKid) => {
    dispatch(updateCurrentKid(kid));
    router.push('/kid-registration/registerKid');
  };

  return (
    <Layout>
      <HomeNavBar findText={findText} setFindText={setFindText} />
      {warningAlert.message && (
        <Alert
          title={warningAlert.message}
          type={
            warningAlert.blockRegister ? ColorType.ERROR : ColorType.WARNING
          }
          onClick={() => {
            const dialog = document.getElementById(
              'settingsKidRegistrationModal',
            ) as HTMLDialogElement | null;
            dialog?.showModal();
          }}
          icon={warningAlert.blockRegister ? <PiX /> : <PiWarning />}
          iconRight={
            warningAlert.blockRegister ? <PiCaretRight /> : <PiCaretRight />
          }
        />
      )}

      {/* <Search
        shape="round"
        placeholder="Buscar Niño"
        onSearch={(value) => setFindText(value)}
        onCancel={() => setFindText('')}
        background="#fbfcff"
        style={{
          position: 'sticky',
          top: '0',
          zIndex: 2,
        }}
      /> */}
      <Alert
        title={`Impresora: ${churchPrinterSlice.current?.name}`}
        subtitle={`Reunión: ${churchMeeting?.name} (${churchCampus?.name})`}
        type={ColorType.INFO}
      />

      {loading ? (
        <>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              avatar
              avatarSize={44}
              row={2}
              style={{ padding: '10px' }}
            />
          ))}
        </>
      ) : (
        <>
          <List
            onLoad={getMoreKids}
            finished={currentPage >= totalPages}
            loadingText={'Buscando...'}
            finishedText={'Hemos llegado al final :)'}
          >
            <ul className="list bg-base-100 rounded-box">
              {kids.length ? (
                kids.map((kid: IKid) => (
                  <Cell
                    disable={
                      warningAlert.blockRegister &&
                      currentRole !== UserRole.KID_REGISTER_ADMIN
                    }
                    key={kid.faithForgeId}
                    title={capitalizeWords(`${kid.firstName} ${kid.lastName}`)}
                    icon={
                      <img
                        className="size-10 rounded-box"
                        src={
                          kid.photoUrl
                            ? kid.photoUrl
                            : kid.gender === UserGenderCode.MALE
                              ? '/icons/boy-v2.png'
                              : '/icons/girl-v2.png'
                        }
                      />
                    }
                    label={
                      kid.age < 12
                        ? `Codigo: ${kid.faithForgeId} ${
                            kid.currentKidRegistration
                              ? `(Registrado a las ${dayjs(
                                  kid.currentKidRegistration.date.toString(),
                                )
                                  .locale('es')
                                  .format('h:mm:ss A')})`
                              : ''
                          }`
                        : 'El niño ya cumplió la edad máxima, no puede ser registrado.'
                    }
                    bgColorClass={
                      kid.currentKidRegistration && 'bg-neutral-200'
                    }
                    bgHoverColorClass={
                      kid.currentKidRegistration && 'hover:bg-neutral-300'
                    }
                    onClick={() =>
                      kid.age < 12 ||
                      currentRole === UserRole.KID_REGISTER_ADMIN
                        ? registerKidViewHandler(kid)
                        : null
                    }
                    iconRight={
                      <IoIosArrowForward
                        style={{
                          height:
                            kid.age < 12 ||
                            currentRole === UserRole.KID_REGISTER_ADMIN
                              ? '3em'
                              : '0em',
                          width: '1.2em',
                        }}
                      />
                    }
                  />
                ))
              ) : (
                <Empty description="No se encontraron registros" />
              )}
            </ul>
          </List>
        </>
      )}
    </Layout>
  );
};

export default withRoles(Registration, KidChurchRegisterRoles);
