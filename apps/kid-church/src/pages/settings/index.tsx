import type { NextPage } from 'next';
import { useRouter } from 'next/router';
// import { logout } from '@/redux/slices/user/auth.slice';
// import { useDispatch } from 'react-redux';
// import {
//   ChurchRoles,
//   IsAdminRegisterKidChurch,
//   IsRegisterKidChurch,
//   IsSupervisorRegisterOrKidChurchSupervisor,
// } from '@/utils/auth';
// import { resetChurchState } from '@/redux/slices/church/church.slice';
// import { resetChurchMeetingState } from '@/redux/slices/church/churchMeeting.slice';
// import { resetChurchPrinterState } from '@/redux/slices/church/churchPrinter.slice';
// import { hasRequiredPermissions } from '@/components/Permissions';
import { Cell } from 'react-vant';
import { Layout } from '../../components/Layout';

const Setting: NextPage = () => {
  const router = useRouter();
  // const dispatch = useDispatch();
  return (
    <Layout>
      <Cell
        // icon={<UserOutlined />}
        onClick={() => router.push('/settings/personalInfo')}
        title="Configuración Personal"
      />
      <Cell
        // icon={<HomeOutlined />}
        onClick={() => router.push('/settings/churchInfo')}
        title="Configuración de Iglesia"
      />
      <Cell
        // icon={<UserOutlined />}
        onClick={() => router.push('/settings/personalInfo')}
        title="Configuración Personal"
      />

      {/* {IsRegisterKidChurch() && (
          <List.Item
            prefix={<PrinterOutlined />}
            onClick={() => router.push('/settings/printerInfo')}
          >
            Configuración de Impresora
          </List.Item>
        )}
        {IsSupervisorRegisterOrKidChurchSupervisor() && (
          <List.Item
            prefix={<FileSearchOutlined />}
            onClick={() => router.push('/settings/generateChurchMeetingReport')}
          >
            Generar Reporte de Servicio
          </List.Item>
        )}
        {IsAdminRegisterKidChurch() && (
          <List.Item
            prefix={<FileSearchOutlined />}
            onClick={() => router.push('/settings/generateChurchDayReport')}
          >
            Generar Reporte del dia
          </List.Item>
        )}
        {hasRequiredPermissions(ChurchRoles) && (
          <List.Item
            prefix={<EditOutlined />}
            onClick={() => router.push('/settings/users')}
          >
            Actualizar usuarios
          </List.Item>
        )}
        <List.Item
          prefix={<LogoutOutlined />}
          onClick={() =>
            Modal.confirm({
              content: '¿Desea cerrar sesión?',
              confirmText: 'Cerrar sesión',
              cancelText: 'Cancelar',
              onConfirm: async () => {
                dispatch(resetChurchState());
                dispatch(resetChurchMeetingState());
                dispatch(resetChurchPrinterState());
                await dispatch(logout());
                Toast.show({
                  icon: 'success',
                  content: 'Se ha cerrado la sesión',
                  position: 'bottom',
                  duration: 5000,
                });
                router.push('/login');
              },
            })
          }
        >
          Cerrar Sesión
        </List.Item> */}
    </Layout>
  );
};

export default Setting;
