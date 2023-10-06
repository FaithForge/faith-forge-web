import type { NextPage } from 'next';
import {
  Image,
  List,
  SearchBar,
  FloatingBubble,
  ErrorBlock,
  InfiniteScroll,
  NoticeBar,
} from 'antd-mobile';
import { UserAddOutlined } from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { useEffect, useState } from 'react';
import { GetKids, GetMoreKids } from '../../services/kidService';
import { UserGenderCode } from '../../models/Uset';
import LoadingMask from '../../components/LoadingMask';
import { capitalizeWords } from '../../utils/text';
import { IKid } from '../../models/Kid';
import { updateCurrentKid } from '../../redux/slices/kidSlice';
import { DateTime } from 'luxon';
import {
  REGISTRATION_CONFIRM_COPY_DIFFERENT_DAY_MEETING,
  REGISTRATION_CONFIRM_COPY_LATER_HOURS_MEETING,
  REGISTRATION_CONFIRM_COPY_LOWER_HOURS_MEETING,
} from '../../constants/copy';

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
    console.log(currentDay, churchMeeting);
    if (churchMeeting) {
      let warning = false;
      if (currentDay.toUpperCase() === churchMeeting.day.toUpperCase()) {
        const currentTime = DateTime.local().toFormat('HH:mm:ss');

        // If the current time is greater than the meeting end time
        if (churchMeeting.initialRegistrationHour >= currentTime) {
          warning = true;
          setWarningAlert({
            ...REGISTRATION_CONFIRM_COPY_LATER_HOURS_MEETING,
            blockRegister: false,
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
  }, [dispatch, findText, pathname]);

  const getMoreKids = async () => {
    dispatch(GetMoreKids());
  };

  const registerKidViewHandler = (kid: IKid) => {
    dispatch(updateCurrentKid(kid));
    router.push('/registration/registerKid');
  };

  return (
    <>
      {loading ? <LoadingMask /> : ''}
      {warningAlert.message && (
        <NoticeBar
          content={warningAlert.message}
          color={warningAlert.blockRegister ? 'error' : 'alert'}
        />
      )}
      <SearchBar
        showCancelButton
        cancelText="Cancelar"
        placeholder="Buscar Niño"
        onSearch={(value) => setFindText(value)}
        style={{
          position: 'sticky',
          top: '0',
          zIndex: 2,
          '--height': '49px',
          padding: '10px 5px',
          backgroundColor: 'white',
        }}
      />
      <List>
        {kids.length ? (
          kids.map((kid) => (
            <List.Item
              disabled={warningAlert.blockRegister}
              key={kid.firstName}
              style={{
                backgroundColor: kid.isRegistered ? '#dddddd' : 'white',
              }}
              prefix={
                <Image
                  alt={`${kid.firstName} ${kid.lastName}`}
                  src={
                    kid.photoUrl
                      ? kid.photoUrl
                      : kid.gender === UserGenderCode.MALE
                      ? '/icons/boy.png'
                      : '/icons/girl.png'
                  }
                  style={{ borderRadius: 20 }}
                  fit="cover"
                  width={40}
                  height={40}
                />
              }
              description={capitalizeWords(
                `Codigo: ${kid.faithForgeId} ${
                  kid.isRegistered ? '(Registrado)' : ''
                }`,
              )}
              onClick={() => registerKidViewHandler(kid)}
            >
              {capitalizeWords(`${kid.firstName} ${kid.lastName}`)}
            </List.Item>
          ))
        ) : (
          <ErrorBlock
            status="empty"
            title="No hay registros"
            description="No se encontraron registros"
          />
        )}
      </List>
      {loading ? (
        ''
      ) : (
        <InfiniteScroll
          loadMore={getMoreKids}
          hasMore={currentPage < totalPages}
        >
          {currentPage < totalPages ? '' : 'Final'}
        </InfiniteScroll>
      )}

      <FloatingBubble
        style={{
          '--initial-position-bottom': '70px',
          '--initial-position-right': '20px',
          '--edge-distance': '24px',
        }}
        onClick={() => router.push('/registration/newKid')}
      >
        <UserAddOutlined style={{ fontSize: '28px' }} />
      </FloatingBubble>
    </>
  );
};

export default Registration;