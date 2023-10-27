import type { NextPage } from 'next';
import { List } from 'antd-mobile';
import { HomeOutlined, PrinterOutlined, UserOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const Setting: NextPage = () => {
  const router = useRouter();
  return (
    <>
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
      </List>
    </>
  );
};

export default Setting;
