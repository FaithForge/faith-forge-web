import React, { useState } from 'react';
import type { NextPage } from 'next';
import 'dayjs/locale/es';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import CreateNewKidGuardian from '../../components/forms/CreateNewKidGuardian';
import KidRegistrationView from '../../components/KidRegistrationView';
import { Layout } from '../../components/Layout';
import { MdEdit } from 'react-icons/md';
import { AiOutlineUserDelete, AiOutlineUsergroupAdd } from 'react-icons/ai';
import { AppDispatch, cleanCurrentKidGuardian, DeleteKid, RootState } from '@/libs/state/redux';
import BackNavBar, { PopoverAppAction } from '@/components/navbar/BackNavBar';
import ConfirmationModal, { showConfirmationModal } from '../../components/modal/ConfirmationModal';
import { ColorType } from '../../libs/common-types/constants/theme';
import { GetUserRoles, IsAdminRegisterKidChurch } from '../../libs/utils/auth';

const RegisterKidView: NextPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [openKidGuardianModal, setOpenKidGuardianModal] = useState(false);
  const kidSlice = useSelector((state: RootState) => state.kidSlice);
    const roles = GetUserRoles();
  
 const adminActions: PopoverAppAction[] = IsAdminRegisterKidChurch(roles)
  ? [
      {
        key: 'deleteKid',
        icon: <AiOutlineUserDelete />,
        text: 'Eliminar niño',
        onClick: () => {
          showConfirmationModal('deleteKidConfirmationModal');
        },
      },
    ]
  : [];

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
    ...adminActions,
  ];

  return (
    <Layout>
      <BackNavBar rightActions={actions} title="Registrar niño" />
      <KidRegistrationView />
      <CreateNewKidGuardian
        visible={openKidGuardianModal}
        onClose={(status: boolean) => setOpenKidGuardianModal(status)}
      />
       <ConfirmationModal
        id={'deleteKidConfirmationModal'}
        title={`Eliminar niño`}
        content={`¿Está seguro que desea eliminar al niño? Esta acción no se puede deshacer.`}
        confirmButtonText="Confirmar"
        confirmButtonType={ColorType.SUCCESS}
        onConfirm={async () => {kidSlice.current?.id && dispatch(DeleteKid({id: kidSlice.current.id})), router.push('/kid-registration'); }}
        cancelButtonText="Cancelar"
        cancelButtonType={ColorType.INFO}
      />
    </Layout>
  );
};

export default RegisterKidView;
