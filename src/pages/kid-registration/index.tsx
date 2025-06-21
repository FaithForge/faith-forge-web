import dayjs from 'dayjs';
import { DateTime } from 'luxon';
import type { NextPage } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Alert from '@/components/ui/Alert';
import Cell from '@/components/ui/Cell';
import HomeNavBar from '@/components/navbar/HomeNavBar';
import {
  REGISTRATION_CONFIRM_COPY_DIFFERENT_DAY_MEETING,
  REGISTRATION_CONFIRM_COPY_LATER_HOURS_MEETING,
  REGISTRATION_CONFIRM_COPY_LOWER_HOURS_MEETING,
} from '@/libs/common-types/constants';
import { ColorType } from '@/libs/common-types/constants/theme';
import { IKid, UserGenderCode } from '@/libs/models';
import { AppDispatch, GetKids, GetMoreKids, RootState, updateCurrentKid } from '@/libs/state/redux';
import { KidChurchRegisterRoles, UserRole } from '@/libs/utils/auth';
import { capitalizeWords } from '@/libs/utils/text';
import { IoIosArrowForward } from 'react-icons/io';
import { PiCaretRight, PiWarning, PiX } from 'react-icons/pi';
import { Empty, List } from 'react-vant';
import { Layout } from '../../components/Layout';
import { withRoles } from '../../components/Permissions';
import { showConfirmationModal } from '@/components/modal/ConfirmationModal';
import Skeleton, { SkeletonType } from '@/components/ui/Skeleton';
import _ from 'lodash';

const Registration: NextPage = () => {
  const {
    data: kids,
    currentPage,
    totalPages,
    loading,
  } = useSelector((state: RootState) => state.kidSlice);
  const { current: churchCampus } = useSelector((state: RootState) => state.churchCampusSlice);
  const { current: churchMeeting } = useSelector((state: RootState) => state.churchMeetingSlice);
  const churchPrinterSlice = useSelector((state: RootState) => state.churchPrinterSlice);
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
          type={warningAlert.blockRegister ? ColorType.ERROR : ColorType.WARNING}
          onClick={() => showConfirmationModal('settingsKidRegistrationModal')}
          icon={warningAlert.blockRegister ? <PiX /> : <PiWarning />}
          iconRight={warningAlert.blockRegister ? <PiCaretRight /> : <PiCaretRight />}
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
          {_.times(10, (index) => (
            <Skeleton key={index} type={SkeletonType.CELL} width="full" height="8" />
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
                      warningAlert.blockRegister && currentRole !== UserRole.KID_REGISTER_ADMIN
                    }
                    key={kid.faithForgeId}
                    title={capitalizeWords(`${kid.firstName} ${kid.lastName}`)}
                    icon={
                      <img
                        alt={`${capitalizeWords(`${kid.firstName} ${kid.lastName}`)}`}
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
                      kid.currentKidRegistration
                        ? 'bg-neutral-200'
                        : kid.age < 12
                          ? 'bg-red-200'
                          : null
                    }
                    bgHoverColorClass={
                      kid.currentKidRegistration
                        ? 'hover:bg-neutral-300'
                        : kid.age < 12
                          ? 'hover:bg-red-300'
                          : null
                    }
                    onClick={() =>
                      kid.age < 12 || currentRole === UserRole.KID_REGISTER_ADMIN
                        ? registerKidViewHandler(kid)
                        : null
                    }
                    iconRight={
                      <IoIosArrowForward
                        style={{
                          height:
                            kid.age < 12 || currentRole === UserRole.KID_REGISTER_ADMIN
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
