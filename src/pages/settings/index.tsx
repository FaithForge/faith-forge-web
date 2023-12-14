import type { NextPage } from 'next';
import { List, Modal, Toast } from 'antd-mobile';
import {
  HomeOutlined,
  LogoutOutlined,
  PrinterOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout';
import { logout } from '@/redux/slices/user/auth.slice';
import { useDispatch } from 'react-redux';

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
        <List.Item
          prefix={<PrinterOutlined />}
          onClick={() => router.push('/settings/printerInfo')}
        >
          Configuración de Impresora
        </List.Item>
        <List.Item
          prefix={<PrinterOutlined />}
          onClick={() => router.push('/settings/generateChurchMeetingReport')}
        >
          Generar Reporte de Servicio
        </List.Item>
        <List.Item
          prefix={<LogoutOutlined />}
          onClick={() =>
            Modal.confirm({
              content: '¿Desea cerrar sesión?',
              confirmText: 'Cerrar sesión',
              cancelText: 'Cancelar',
              onConfirm: async () => {
                await dispatch(logout());
                Toast.show({
                  icon: 'success',
                  content: 'Se ha cerrado la sesión',
                  position: 'bottom',
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
