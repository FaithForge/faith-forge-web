import type { NextPage } from 'next';
import { List, Modal, Toast } from 'antd-mobile';
import {
  HomeOutlined,
  LogoutOutlined,
  PrinterOutlined,
  UserOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout';
import { logout } from '@/redux/slices/user/auth.slice';
import { useDispatch } from 'react-redux';
import {
  IsAdminRegisterKidChurch,
  IsRegisterKidChurch,
  IsSupervisorRegisterOrKidChurchSupervisor,
} from '@/utils/auth';
import { resetChurchState } from '@/redux/slices/church/church.slice';
import { resetChurchMeetingState } from '@/redux/slices/church/churchMeeting.slice';
import { resetChurchPrinterState } from '@/redux/slices/church/churchPrinter.slice';

const Setting: NextPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  return (
    <Layout>
      <List header="Configuraciones">
        <List.Item
          prefix={<UserOutlined />}
          onClick={() => router.push('/settings/personalInfo')}
        >
          Configuración Personal
        </List.Item>
        <List.Item
          prefix={<HomeOutlined />}
          onClick={() => router.push('/settings/churchInfo')}
        >
          Configuración de Iglesia
        </List.Item>
        {IsRegisterKidChurch() && (
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
        </List.Item>
      </List>
    </Layout>
  );
};

export default Setting;
