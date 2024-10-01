/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import type { NextPage } from 'next';
import NavBarApp from '../../components/NavBarApp';
import 'dayjs/locale/es';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import { useRouter } from 'next/router';
import CreateNewKidGuardian from '../../components/forms/CreateNewKidGuardian';
import { cleanCurrentKidGuardian } from '@/redux/slices/kid-church/kid-guardian.slice';
import { Layout } from '@/components/Layout';
import KidRegistrationView from '@/components/KidRegistrationView';
import { Space } from 'react-vant';

const RegisterKidView: NextPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [openKidGuardianModal, setOpenKidGuardianModal] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const actions: Action[] = [
  //   {
  //     key: 'updateKid',
  //     icon: <EditOutlined />,
  //     text: 'Actualizar datos del niño',
  //     onClick: () => {
  //       router.push('/registration/updateKid');
  //     },
  //   },
  //   {
  //     key: 'addNewKidGuardian',
  //     icon: <TeamOutlined />,
  //     text: 'Asignar nuevo acudiente',
  //     onClick: () => {
  //       dispatch(cleanCurrentKidGuardian());
  //       setOpenKidGuardianModal(true);
  //     },
  //   },
  // ];

  const right = (
    <div style={{ fontSize: 24 }}>
      <Space style={{ '--gap': '16px' }}>
        {/* <Popover.Menu
          actions={actions}
          placement="bottom-start"
          trigger="click"
          onAction={(node) => node.onClick}
        >
          <MoreOutline />
        </Popover.Menu> */}
      </Space>
    </div>
  );

  return (
    <Layout>
      <NavBarApp right={right} title="Registrar niño" />
      <KidRegistrationView />
      <CreateNewKidGuardian
        visible={openKidGuardianModal}
        onClose={(status: boolean) => setOpenKidGuardianModal(status)}
      />
    </Layout>
  );
};

export default RegisterKidView;
