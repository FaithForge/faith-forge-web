import type { NextPage } from 'next';
import { useRouter } from 'next/router';
// import { logout } from '@/redux/slices/user/auth.slice';
import { useDispatch } from 'react-redux';
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
import { Cell, Dialog, Notify, Toast } from 'react-vant';
import { Layout } from '../../components/Layout';
import {
  resetChurchState,
  resetChurchMeetingState,
  resetChurchPrinterState,
  logout,
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
  IsAdminRegisterKidChurch,
  IsRegisterKidChurch,
  IsSupervisorRegisterOrKidChurchSupervisor,
} from '../../utils/auth';
import { hasRequiredPermissions } from '../../components/Permissions';

const Setting: NextPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  return (
    <Layout>
      <Cell
        icon={<FaUserGear />}
        onClick={() => router.push('/settings/personalInfo')}
        title="Configuración Personal"
      />
      <Cell
        icon={<FaChurch />}
        onClick={() => router.push('/settings/churchInfo')}
        title="Configuración de Iglesia"
      />
      {IsRegisterKidChurch() && (
        <Cell
          icon={<FaPrint />}
          onClick={() => router.push('/settings/printerInfo')}
          title="Configuración de Impresora"
        />
      )}
      {IsSupervisorRegisterOrKidChurchSupervisor() && (
        <Cell
          icon={<FaFileInvoice />}
          onClick={() => router.push('/settings/generateChurchMeetingReport')}
          title="Generar Reporte de Servicio"
        />
      )}
      {hasRequiredPermissions(ChurchRoles) && (
        <Cell
          icon={<FaUserGroup />}
          onClick={() => router.push('/settings/users')}
          title="Actualizar usuarios"
        />
      )}

      <Cell
        title="  Cerrar Sesión"
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
    </Layout>
  );
};

export default Setting;
