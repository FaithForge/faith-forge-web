import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { Cell, Dialog, Grid, Notify, Typography } from 'react-vant';
import { Layout } from '../../components/Layout';
import {
  resetChurchState,
  resetChurchMeetingState,
  resetChurchPrinterState,
  logout,
  RootState,
} from '@faith-forge-web/state/redux';
import {
  FaUserGear,
  FaChurch,
  FaPrint,
  FaRightFromBracket,
  FaFileInvoice,
  FaUserGroup,
} from 'react-icons/fa6';
import {
  ChurchRoles,
  IsRegisterKidChurch,
  IsSupervisorRegisterOrKidChurchSupervisor,
} from '../../utils/auth';
import { hasRequiredPermissions } from '../../components/Permissions';
import { FaHouseFloodWaterCircleArrowRight } from 'react-icons/fa6';
import { capitalizeWords } from '../../utils/text';

const Setting: NextPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const authSlice = useSelector((state: RootState) => state.authSlice);

  return (
    <Layout>
      <Grid gutter={10} columnNum={1} center={false} border={false}>
        <Grid.Item>
          <Typography.Title level={1} style={{ margin: 0 }}>
            Hola,
          </Typography.Title>
          <Typography.Title level={2} style={{ margin: 0, fontWeight: 400 }}>
            {capitalizeWords(authSlice.user?.firstName ?? '')}{' '}
            {capitalizeWords(authSlice.user?.lastName ?? '')}
          </Typography.Title>
        </Grid.Item>
      </Grid>
      <Grid gutter={10} columnNum={2}>
        <Grid.Item
          key={'Configuración Personal'}
          icon={<FaUserGear />}
          text="Configuración Personal"
          onClick={() => router.push('/settings/personalInfo')}
        />
        <Grid.Item
          key={'Configuración de Iglesia'}
          icon={<FaChurch />}
          text="Configuración de Iglesia"
          onClick={() => router.push('/settings/churchInfo')}
        />
        {IsRegisterKidChurch() && (
          <Grid.Item
            key="Configuración de Impresora"
            icon={<FaPrint />}
            onClick={() => router.push('/settings/printerInfo')}
            text="Configuración de Impresora"
          />
        )}
        {IsSupervisorRegisterOrKidChurchSupervisor() && (
          <Grid.Item
            key="Generar Reporte de Servicio"
            icon={<FaFileInvoice />}
            onClick={() => router.push('/settings/generateChurchMeetingReport')}
            text="Generar Reporte de Servicio"
          />
        )}
        {hasRequiredPermissions(ChurchRoles) && (
          <Grid.Item
            key="Actualizar usuarios"
            icon={<FaUserGroup />}
            onClick={() => router.push('/settings/users')}
            text="Actualizar usuarios"
          />
        )}
      </Grid>
      <Grid gutter={10} columnNum={1} style={{ paddingTop: 10 }}>
        <Grid.Item
          key="Cerrar Sesión"
          text="Cerrar Sesión"
          icon={<FaRightFromBracket />}
          onClick={() =>
            Dialog.confirm({
              title: '¿Desea cerrar sesión?',
              confirmButtonText: 'Cerrar sesión',
              cancelButtonText: 'Cancelar',
              onConfirm: async () => {
                dispatch(resetChurchState());
                dispatch(resetChurchMeetingState());
                dispatch(resetChurchPrinterState());
                await dispatch(logout());
                Notify.show({
                  message: 'Se ha cerrado la sesión',
                  duration: 5000,
                  type: 'success',
                });
                router.push('/login');
              },
            })
          }
        />
      </Grid>
    </Layout>
  );
};

export default Setting;
