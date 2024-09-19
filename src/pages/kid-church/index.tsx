import type { NextPage } from 'next';
import {
  Image,
  List,
  SearchBar,
  ErrorBlock,
  NoticeBar,
  Selector,
  FloatingBubble,
} from 'antd-mobile';
import {
  HomeOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { useEffect, useState } from 'react';
import { UserGenderCode } from '../../models/User';
import LoadingMask from '../../components/LoadingMask';
import { capitalizeWords } from '../../utils/text';
import { DateTime } from 'luxon';
import {
  GENERAL_COPY_DIFFERENT_DAY_MEETING,
  GENERAL_COPY_LATER_HOURS_MEETING,
  GENERAL_COPY_LOWER_HOURS_MEETING,
} from '../../constants/copy';
import { IKid } from '@/models/KidChurch';
import { Layout } from '@/components/Layout';
import {
  GetKidGroupRegistered,
  GetKidGroups,
} from '@/redux/thunks/kid-church/kid-group.thunk';
import ShowKidRegisteredModal from '@/components/ShowKidRegisteredModal';
import { ChurchRoles, KidChurchSupervisorRoles } from '@/utils/auth';
import { hasRequiredPermissions, withRoles } from '@/components/Permissions';

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

  const kidGroupsSelect = kidGroupSlice.data
    ? kidGroupSlice.data.map((kidGroup) => {
        return {
          label: kidGroup.name,
          value: kidGroup.id,
          description: `Total: ${
            kids.length
              ? kids.filter((kid) => kid.kidGroup?.id === kidGroup.id).length
              : 0
          }`,
        };
      })
    : [];

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
  }, [dispatch, pathname]);

  useEffect(() => {
    const findTextSearch = findText.toLowerCase();

    let kidsFiltered = kids.filter((kid) => {
      const fullName = `${kid.firstName} ${kid.lastName}`.toLowerCase();
      return fullName.includes(findTextSearch);
    });

    kidsFiltered = kidsFiltered.filter((kid) =>
      selectedKidGroup !== '' ? kid.kidGroup?.id === selectedKidGroup : true,
    );

    setKidList(kidsFiltered);
  }, [findText, selectedKidGroup, kids]);

  return (
    <Layout>
      {loading ? <LoadingMask /> : ''}

      <div style={{ position: 'sticky', top: '0', zIndex: 2 }}>
        <SearchBar
          showCancelButton
          cancelText="Cancelar"
          placeholder="Buscar Niño"
          onChange={(value) => setFindText(value)}
          onSearch={(value) => setFindText(value)}
          onCancel={() => setFindText('')}
          icon={<SearchOutlined />}
          style={{
            '--height': '49px',
            padding: '10px 5px 5px 5px',
            backgroundColor: 'white',
          }}
        />
        <NoticeBar
          style={{
            '--height': '25px',
          }}
          icon={<HomeOutlined />}
          content={`${churchMeeting?.name} Total Niños: ${kids.length}`}
          color="info"
        />
        <Selector
          columns={3}
          style={{
            '--border': 'solid transparent 1px',
            '--checked-border': 'solid var(--adm-color-primary) 1px',
            '--padding': '8px 12px',
            padding: '5px 5px 5px 5px',
            backgroundColor: 'white',
          }}
          showCheckMark={false}
          options={kidGroupsSelect}
          onChange={(v) => {
            if (v.length) {
              setSelectedKidGroup(v[0]);
            } else {
              setSelectedKidGroup('');
            }
          }}
        />
      </div>

      {warningAlert.message && (
        <NoticeBar
          content={warningAlert.message}
          color={warningAlert.blockRegister ? 'error' : 'alert'}
        />
      )}
      <List>
        {kidList.length ? (
          kidList.map((kid) => (
            <>
              <List.Item
                disabled={warningAlert.blockRegister && !isAdmin}
                key={kid.faithForgeId}
                style={{
                  backgroundColor: 'white',
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
                description={`Salon: ${
                  kid.kidGroup ? `${kid.kidGroup?.name}` : ''
                } | Edad: ${Math.floor(kid.age ?? 0)} años y ${
                  kid.ageInMonths - Math.floor(kid.age) * 12
                } meses`}
                onClick={() => {
                  setKidToUpdate(kid);
                  setOpenShowKidRegisteredModal(true);
                }}
              >
                {capitalizeWords(`${kid.firstName} ${kid.lastName}`)}
              </List.Item>
            </>
          ))
        ) : (
          <ErrorBlock
            status="empty"
            title="No hay registros"
            description="No se encontraron registros"
          />
        )}
      </List>
      {kidToUpdate && (
        <ShowKidRegisteredModal
          visible={openShowKidRegisteredModal}
          onClose={(status: boolean) => setOpenShowKidRegisteredModal(status)}
          kid={kidToUpdate}
        />
      )}
      <FloatingBubble
        style={{
          '--initial-position-bottom': '70px',
          '--initial-position-right': '20px',
          '--edge-distance': '24px',
        }}
        onClick={() => {
          const currentDate = DateTime.local().toJSDate();
          dispatch(GetKidGroupRegistered({ date: currentDate }));
        }}
      >
        <ReloadOutlined style={{ fontSize: '28px' }} />
      </FloatingBubble>
    </Layout>
  );
};

export default withRoles(KidChurch, KidChurchSupervisorRoles);
