import type { NextPage } from 'next';
import { usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import LoadingMask from '../../components/LoadingMask';
import { capitalizeWords } from '../../utils/text';
import { DateTime } from 'luxon';
import {
  Grid,
  NoticeBar,
  Search,
  Image,
  Typography,
  Empty,
  Cell,
} from 'react-vant';
import {
  hasRequiredPermissions,
  withRoles,
} from '../../components/Permissions';
import { ChurchRoles, KidChurchSupervisorRoles } from '../../utils/auth';
import { Layout } from '../../components/Layout';
import {
  AppDispatch,
  GetKidGroupRegistered,
  GetKidGroups,
  RootState,
} from '@faith-forge-web/state/redux';

import { IKid, IKidGroup, UserGenderCode } from '@faith-forge-web/models';
import {
  GENERAL_COPY_LATER_HOURS_MEETING,
  GENERAL_COPY_LOWER_HOURS_MEETING,
  GENERAL_COPY_DIFFERENT_DAY_MEETING,
} from '@faith-forge-web/common-types/constants';
import { PRIMARY_COLOR_APP } from '../theme';
import { IoIosArrowForward } from 'react-icons/io';
import ShowKidRegisteredModal from '../../components/ShowKidRegisteredModal';
import FloatingBubbleApp from '../../components/FloatingBubbleApp';
import { TbReload } from 'react-icons/tb';

const KidChurch: NextPage = () => {
  const { data: kids, loading } = useSelector(
    (state: RootState) => state.kidGroupRegisteredSlice,
  );
  const [kidList, setKidList] = useState<IKid[]>(kids);
  const { current: churchMeeting } = useSelector(
    (state: RootState) => state.churchMeetingSlice,
  );
  const kidGroupSlice = useSelector((state: RootState) => state.kidGroupSlice);
  const [selectedKidGroup, setSelectedKidGroup] = useState('');
  const [openShowKidRegisteredModal, setOpenShowKidRegisteredModal] =
    useState(false);
  const [kidToUpdate, setKidToUpdate] = useState<IKid | undefined>();
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
  const [findText, setFindText] = useState('');
  const [warningAlert, setWarningAlert] = useState({
    message: '',
    icon: '',
    blockRegister: false,
  });
  const isAdmin = hasRequiredPermissions(ChurchRoles);

  useEffect(() => {
    const currentDate = DateTime.local().toJSDate();
    dispatch(GetKidGroups());
    dispatch(GetKidGroupRegistered({ date: currentDate }));
    const currentDay = DateTime.local().toFormat('EEEE');
    if (churchMeeting) {
      let warning = false;
      if (currentDay.toUpperCase() === churchMeeting.day.toUpperCase()) {
        const currentTime = DateTime.local().toFormat('HH:mm:ss');

        // If the current time is greater than the meeting end time
        if (churchMeeting.initialRegistrationHour >= currentTime) {
          warning = true;
          setWarningAlert({
            ...GENERAL_COPY_LATER_HOURS_MEETING,
            blockRegister: true,
          });
        }
        // If the current time is greater than the meeting end time
        if (
          currentTime >=
          DateTime.local(churchMeeting.finalRegistrationHour)
            .plus({ hours: 2 })
            .toFormat('HH:mm:ss')
        ) {
          warning = true;
          setWarningAlert({
            ...GENERAL_COPY_LOWER_HOURS_MEETING,
            blockRegister: true,
          });
        }
      } else {
        warning = true;
        setWarningAlert({
          ...GENERAL_COPY_DIFFERENT_DAY_MEETING,
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
  }, [dispatch, pathname]);

  useEffect(() => {
    const findTextSearch = findText.toLowerCase();

    let kidsFiltered = kids.filter((kid: IKid) => {
      const fullName = `${kid.firstName} ${kid.lastName}`.toLowerCase();
      return fullName.includes(findTextSearch);
    });

    kidsFiltered = kidsFiltered.filter((kid: IKid) =>
      selectedKidGroup !== '' ? kid.kidGroup?.id === selectedKidGroup : true,
    );

    setKidList(kidsFiltered);
  }, [findText, selectedKidGroup, kids]);

  return (
    <Layout>
      {loading ? <LoadingMask /> : ''}

      <div style={{ position: 'sticky', top: '0', zIndex: 2 }}>
        <Search
          placeholder="Buscar Niño"
          onChange={(value) => setFindText(value)}
          onSearch={(value) => setFindText(value)}
          onCancel={() => setFindText('')}
          style={{
            height: '49px',
            padding: '10px 5px 5px 5px',
            backgroundColor: 'white',
          }}
        />
        <NoticeBar
          style={{
            '--height': '25px',
          }}
          text={`${churchMeeting?.name} Total Niños: ${kids.length}`}
          color="info"
        />
      </div>
      <Grid
        columnNum={3}
        gutter={8}
        style={{ backgroundColor: 'white', paddingBottom: 10 }}
      >
        {kidGroupSlice.data &&
          kidGroupSlice.data.map((kidGroup: IKidGroup) => {
            return (
              <Grid.Item
                key={kidGroup.id}
                contentStyle={{
                  backgroundColor:
                    selectedKidGroup === kidGroup.id ? '#efefff' : '#f2f3f5',
                }}
                onClick={() => {
                  if (selectedKidGroup !== kidGroup.id) {
                    setSelectedKidGroup(kidGroup.id);
                  } else {
                    setSelectedKidGroup('');
                  }
                }}
              >
                <Typography.Text
                  style={{
                    color:
                      selectedKidGroup === kidGroup.id
                        ? PRIMARY_COLOR_APP
                        : '#323232',
                  }}
                >
                  {kidGroup.name}
                </Typography.Text>
                <Typography.Text style={{ color: '#969799' }}>{`Total: ${
                  kids.length
                    ? kids.filter(
                        (kid: IKid) => kid.kidGroup?.id === kidGroup.id,
                      ).length
                    : 0
                }`}</Typography.Text>
              </Grid.Item>
            );
          })}
      </Grid>

      {warningAlert.message && (
        <NoticeBar
          text={warningAlert.message}
          color={warningAlert.blockRegister ? 'error' : 'alert'}
        />
      )}
      {kidList.length ? (
        kidList.map((kid) => (
          <>
            <Cell
              clickable={warningAlert.blockRegister && !isAdmin}
              key={kid.faithForgeId}
              style={{
                backgroundColor: kid.currentKidRegistration
                  ? '#ebebeb'
                  : kid.age >= 12
                    ? '#FBDAD7'
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
              label={`Salon: ${
                kid.kidGroup ? `${kid.kidGroup?.name}` : ''
              } | Edad: ${Math.floor(kid.age ?? 0)} años y ${
                kid.ageInMonths - Math.floor(kid.age) * 12
              } meses`}
              isLink
              size="large"
              rightIcon={
                <IoIosArrowForward style={{ height: '3em', width: '1.2em' }} />
              }
              onClick={() => {
                setKidToUpdate(kid);
                setOpenShowKidRegisteredModal(true);
              }}
            />
          </>
        ))
      ) : (
        <Empty description="No se encontraron registros" />
      )}
      {kidToUpdate && (
        <ShowKidRegisteredModal
          visible={openShowKidRegisteredModal}
          onClose={(status: boolean) => setOpenShowKidRegisteredModal(status)}
          kid={kidToUpdate}
        />
      )}
      <FloatingBubbleApp
        icon={<TbReload style={{ fontSize: '32px', color: 'white' }} />}
        right={20}
        bottom={70}
        size={50}
        onClick={() => {
          const currentDate = DateTime.local().toJSDate();
          dispatch(GetKidGroupRegistered({ date: currentDate }));
        }}
      />
    </Layout>
  );
};

export default withRoles(KidChurch, KidChurchSupervisorRoles);
