import React, { useState } from 'react';
import type { NextPage } from 'next';
import 'dayjs/locale/es';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import CreateNewKidGuardian from '../../components/forms/CreateNewKidGuardian';
import KidRegistrationView from '../../components/KidRegistrationView';
import { Layout } from '../../components/Layout';
import { PopoverApp, PopoverAppAction } from '../../components/PopoverApp';
import { MdEdit } from 'react-icons/md';
import { AiOutlineUsergroupAdd } from 'react-icons/ai';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import { AppDispatch, cleanCurrentKidGuardian } from '@/libs/state/redux';
import BackNavBar from '@/components/BackNavBar';

const RegisterKidView: NextPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [openKidGuardianModal, setOpenKidGuardianModal] = useState(false);

  const actions: PopoverAppAction[] = [
    {
      key: 'updateKid',
      icon: <MdEdit />,
      text: 'Actualizar datos del niño',
      onClick: () => {
        router.push('/kid-registration/updateKid');
      },
    },
    {
      key: 'addNewKidGuardian',
      icon: <AiOutlineUsergroupAdd />,
      text: 'Asignar nuevo acudiente',
      onClick: () => {
        dispatch(cleanCurrentKidGuardian());
        setOpenKidGuardianModal(true);
      },
    },
  ];

  return (
    <Layout>
      <BackNavBar rightActions={actions} title="Registrar niño" />
      <KidRegistrationView />
      <CreateNewKidGuardian
        visible={openKidGuardianModal}
        onClose={(status: boolean) => setOpenKidGuardianModal(status)}
      />
    </Layout>
  );
};

export default RegisterKidView;
