import HomeNavBar from '@/components/navbar/HomeNavBar';
import {
  GENERAL_COPY_DIFFERENT_DAY_MEETING,
  GENERAL_COPY_LATER_HOURS_MEETING,
  GENERAL_COPY_LOWER_HOURS_MEETING,
} from '@/libs/common-types/constants';
import { IKid, IKidGroup, UserGenderCode } from '@/libs/models';
import { AppDispatch, GetKidGroupRegistered, GetKidGroups, RootState } from '@/libs/state/redux';
import { ChurchRoles, KidChurchSupervisorRoles } from '@/libs/utils/auth';
import { capitalizeWords } from '@/libs/utils/text';
import { PRIMARY_COLOR_APP } from '@/libs/utils/theme';
import { DateTime } from 'luxon';
import type { NextPage } from 'next';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IoIosArrowForward } from 'react-icons/io';
import { TbReload } from 'react-icons/tb';
import { useDispatch, useSelector } from 'react-redux';
import { Empty, NoticeBar } from 'react-vant';
import FloatingBubbleApp from '../../components/FloatingBubbleApp';
import { Layout } from '../../components/Layout';
import { useHasRequiredPermissions, withRoles } from '../../components/Permissions';
import ShowKidRegisteredModal from '../../components/ShowKidRegisteredModal';
import Cell from '@/components/ui/Cell';
import _ from 'lodash';
import Skeleton, { SkeletonType } from '@/components/ui/Skeleton';

const KidChurch: NextPage = () => {
  const { data: kids, loading } = useSelector((state: RootState) => state.kidGroupRegisteredSlice);
  const [kidList, setKidList] = useState<IKid[]>(kids);
  const { current: churchMeeting } = useSelector((state: RootState) => state.churchMeetingSlice);
  const kidGroupSlice = useSelector((state: RootState) => state.kidGroupSlice);
  const [selectedKidGroup, setSelectedKidGroup] = useState('');
  const [openShowKidRegisteredModal, setOpenShowKidRegisteredModal] = useState(false);
  const [kidToUpdate, setKidToUpdate] = useState<IKid | undefined>();
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
  const [findText, setFindText] = useState('');
  const [warningAlert, setWarningAlert] = useState({
    message: '',
    icon: '',
    blockRegister: false,
  });
  const isAdmin = useHasRequiredPermissions(ChurchRoles);

  useEffect(() => {
    const currentDate = DateTime.local().toJSDate();
    dispatch(GetKidGroups({}));
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
      <div style={{ position: 'sticky', top: '0', zIndex: 2 }}>
        <HomeNavBar findText={findText} setFindText={setFindText} />
        {loading ? (
          <Skeleton type={SkeletonType.TEXT} width="w-64" height="h-4" rows={1} />
        ) : (
          <NoticeBar
            style={{
              '--height': '25px',
            }}
            text={`${churchMeeting?.name} Total Niños: ${kids.length}`}
            color="info"
          />
        )}
      </div>
      {/* Bebes, Caminadores y Zaqueos */}
      <div className="grid grid-cols-2 gap-2 bg-white px-2">
        {kidGroupSlice.data &&
          kidGroupSlice.data.slice(0, 4).map((kidGroup: IKidGroup) => {
            const isSelected = selectedKidGroup === kidGroup.id;
            return (
              <div
                key={kidGroup.id}
                className={`flex flex-col items-center justify-center p-2 rounded-md cursor-pointer text-center ${
                  isSelected ? 'bg-indigo-100' : 'bg-gray-100'
                }`}
                onClick={() => setSelectedKidGroup(isSelected ? '' : kidGroup.id)}
              >
                <p className={`font-medium ${isSelected ? 'text-indigo-600' : 'text-gray-800'}`}>
                  {kidGroup.name}
                </p>
                {loading ? (
                  <div className="w-32 h-4 bg-gray-300 rounded animate-pulse mt-1" />
                ) : (
                  <p className="text-sm text-gray-500 mt-1">
                    {`Total: ${
                      kids.length
                        ? kids.filter((kid: IKid) => kid.kidGroup?.id === kidGroup.id).length
                        : 0
                    }`}
                  </p>
                )}
              </div>
            );
          })}
      </div>

      {/* Jeremias, Timoteos, Titos y Yo Soy Iglekids */}
      <div className="grid grid-cols-3 gap-2 bg-white px-2 pb-2 mt-2">
        {kidGroupSlice.data &&
          kidGroupSlice.data.slice(4).map((kidGroup: IKidGroup) => {
            const isSelected = selectedKidGroup === kidGroup.id;
            return (
              <div
                key={kidGroup.id}
                className={`flex flex-col items-center justify-center p-2 rounded-md cursor-pointer text-center ${
                  isSelected ? 'bg-indigo-100' : 'bg-gray-100'
                }`}
                onClick={() => setSelectedKidGroup(isSelected ? '' : kidGroup.id)}
              >
                <p className={`font-medium ${isSelected ? 'text-indigo-600' : 'text-gray-800'}`}>
                  {kidGroup.name}
                </p>
                {loading ? (
                  <div className="w-16 h-4 bg-gray-300 rounded animate-pulse mt-1" />
                ) : (
                  <p className="text-sm text-gray-500 mt-1">
                    {`Total: ${
                      kids.length
                        ? kids.filter((kid: IKid) => kid.kidGroup?.id === kidGroup.id).length
                        : 0
                    }`}
                  </p>
                )}
              </div>
            );
          })}
      </div>

      {warningAlert.message && (
        <NoticeBar
          text={warningAlert.message}
          color={warningAlert.blockRegister ? 'error' : 'alert'}
        />
      )}
      {loading ? (
        <>
          {_.times(10, (index) => (
            <Skeleton key={index} type={SkeletonType.CELL} width="full" height="8" />
          ))}
        </>
      ) : (
        <ul className="list bg-base-100 rounded-box">
          {kidList.length ? (
            kidList.map((kid) => (
              <>
                <Cell
                  disable={warningAlert.blockRegister && !isAdmin}
                  key={kid.faithForgeId}
                  title={capitalizeWords(`${kid.firstName} ${kid.lastName}`)}
                  icon={
                    <img
                      alt={`${kid.firstName} ${kid.lastName}`}
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
                  label={`Salon: ${
                    kid.kidGroup ? `${kid.kidGroup?.name}` : ''
                  } | Edad: ${Math.floor(kid.age ?? 0)} años y ${
                    kid.ageInMonths - Math.floor(kid.age) * 12
                  } meses`}
                  bgColorClass={kid.currentKidRegistration && 'bg-neutral-200'}
                  bgHoverColorClass={kid.currentKidRegistration && 'hover:bg-neutral-300'}
                  onClick={() => {
                    setKidToUpdate(kid);
                    setOpenShowKidRegisteredModal(true);
                  }}
                  iconRight={<IoIosArrowForward style={{ height: '3em', width: '1.2em' }} />}
                />
              </>
            ))
          ) : (
            <Empty description="No se encontraron registros" />
          )}
        </ul>
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
