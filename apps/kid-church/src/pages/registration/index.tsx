import type { NextPage } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import LoadingMask from '../../components/LoadingMask';
import { capitalizeWords } from '../../utils/text';
import { DateTime } from 'luxon';
import dayjs from 'dayjs';

import {
  Cell,
  Empty,
  List,
  NoticeBar,
  Search,
  Image,
  Skeleton,
  Overlay,
} from 'react-vant';
import {
  hasRequiredPermissions,
  withRoles,
} from '../../components/Permissions';
import { ChurchRoles, KidChurchRegisterRoles } from '../../utils/auth';
import { Layout } from '../../components/Layout';
import {
  AppDispatch,
  GetKids,
  GetMoreKids,
  RootState,
  updateCurrentKid,
} from '@faith-forge-web/state/redux';
import {
  REGISTRATION_CONFIRM_COPY_LATER_HOURS_MEETING,
  REGISTRATION_CONFIRM_COPY_LOWER_HOURS_MEETING,
  REGISTRATION_CONFIRM_COPY_DIFFERENT_DAY_MEETING,
} from '@faith-forge-web/common-types/constants';
import { IKid, UserGenderCode } from '@faith-forge-web/models';
import { FaInfo } from 'react-icons/fa';
import { IoIosArrowForward } from 'react-icons/io';
import { AiOutlineQrcode } from 'react-icons/ai';
import FloatingBubbleApp from '../../components/FloatingBubbleApp';
import { AiOutlineUserAdd } from 'react-icons/ai';

const Registration: NextPage = () => {
  const {
    data: kids,
    currentPage,
    totalPages,
    loading,
  } = useSelector((state: RootState) => state.kidSlice);
  const { current: churchMeeting } = useSelector(
    (state: RootState) => state.churchMeetingSlice,
  );
  const churchPrinterSlice = useSelector(
    (state: RootState) => state.churchPrinterSlice,
  );
  const isAdmin = hasRequiredPermissions(ChurchRoles);
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
  }, [dispatch, findText, pathname]);

  const getMoreKids = async () => {
    dispatch(GetMoreKids({ findText }));
  };

  const registerKidViewHandler = (kid: IKid) => {
    dispatch(updateCurrentKid(kid));
    router.push('/registration/registerKid');
  };

  return (
    <Layout>
      {warningAlert.message && (
        <NoticeBar
          wrapable
          mode="link"
          text={warningAlert.message}
          background={warningAlert.blockRegister ? '#da342e' : 'alert'}
          color={warningAlert.blockRegister ? 'white' : 'alert'}
          onClick={() => router.push('/settings/churchInfo')}
          style={{ zIndex: 3 }}
        />
      )}

      <Search
        shape="round"
        placeholder="Buscar Niño"
        onSearch={(value) => setFindText(value)}
        onCancel={() => setFindText('')}
        style={{
          position: 'sticky',
          top: '0',
          zIndex: 2,
        }}
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
          <Overlay
            zIndex={2}
            visible={!isAdmin}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
          <List
            onLoad={getMoreKids}
            finished={currentPage >= totalPages}
            loadingText={'Buscando...'}
            finishedText={'Hemos llegado al final :)'}
          >
            {kids.length ? (
              kids.map((kid: IKid) => (
                <Cell
                  clickable={warningAlert.blockRegister && !isAdmin}
                  key={kid.faithForgeId}
                  border={true}
                  style={{
                    backgroundColor: kid.currentKidRegistration
                      ? '#ebebeb'
                      : kid.age >= 12
                        ? '#ffdad6'
                        : 'white',
                  }}
                  icon={
                    <Image
                      alt={`${kid.firstName} ${kid.lastName}`}
                      src={
                        kid.photoUrl
                          ? kid.photoUrl
                          : kid.gender === UserGenderCode.MALE
                            ? '/icons/boy-v2.png'
                            : '/icons/girl-v2.png'
                      }
                      style={{ borderRadius: 20 }}
                      fit="cover"
                      width={44}
                      height={44}
                    />
                  }
                  title={capitalizeWords(`${kid.firstName} ${kid.lastName}`)}
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
                  isLink
                  size="large"
                  rightIcon={
                    <IoIosArrowForward
                      style={{ height: '3em', width: '1.2em' }}
                    />
                  }
                  onClick={() => registerKidViewHandler(kid)}
                />
              ))
            ) : (
              <Empty description="No se encontraron registros" />
            )}
          </List>
        </>
      )}
      <FloatingBubbleApp
        icon={<AiOutlineUserAdd style={{ fontSize: '32px', color: 'white' }} />}
        right={20}
        bottom={70}
        size={50}
        onClick={() => router.push('/registration/newKid')}
      />
      <FloatingBubbleApp
        icon={<AiOutlineQrcode style={{ fontSize: '32px', color: 'white' }} />}
        right={20}
        bottom={140}
        size={50}
        backgroundColor="#334551"
        onClick={() => router.push('/registration/qrReader')}
      />
      {/* <NoticeBar leftIcon={<FaInfo />}>
        <Swiper autoplay={3000} indicator={false} className="notice-swipe">
          <Swiper.Item>Servicio actual: {churchMeeting?.name}</Swiper.Item>
          <Swiper.Item>
            Impresora: {churchPrinterSlice.current?.name}
          </Swiper.Item>
          <Swiper.Item>
            Impresora: {churchPrinterSlice.current?.name}
          </Swiper.Item>
        </Swiper>
      </NoticeBar> */}
    </Layout>
  );
};

export default withRoles(Registration, KidChurchRegisterRoles);
