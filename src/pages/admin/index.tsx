import Cell from '@/components/ui/Cell';
import ConfirmationModal from '@/components/modal/ConfirmationModal';
import HomeNavBar from '@/components/navbar/HomeNavBar';
import { ColorType } from '@/libs/common-types/constants/theme';
import { AppDispatch } from '@/libs/state/redux';
import { CleanCache } from '@/libs/state/redux/thunks/admin/admin.thunk';
import type { NextPage } from 'next';
import { FaChildReaching, FaChildren } from 'react-icons/fa6';
import { IoIosArrowForward } from 'react-icons/io';
import {
  PiArrowsClockwise,
  PiMapPinSimpleArea,
  PiPrinter,
  PiUser,
  PiUserCirclePlus,
} from 'react-icons/pi';
import { useDispatch } from 'react-redux';

const churchAdminOptions = [
  {
    key: 'servicios',
    disable: true,
    title: 'Servicios (Pronto)',
    icon: <PiMapPinSimpleArea style={{ height: '3em', width: '1.2em' }} />,
    label: 'Gestionar el tema de sedes. (des)habilitar y/o crear',
    bgColorClass: '',
    bgHoverColorClass: 'hover:bg-neutral-100',
    onclick: () => null,
  },
  {
    key: 'impresoras',
    disable: true,
    title: 'Impresoras (Pronto)',
    icon: <PiPrinter style={{ height: '3em', width: '1.2em' }} />,
    label: '',
    bgColorClass: '',
    bgHoverColorClass: 'hover:bg-neutral-100',
    onclick: () => null,
  },
];

const kidChurchAdminOptions = [
  {
    key: 'niños',
    disable: true,
    title: 'Niños',
    icon: <FaChildReaching style={{ height: '3em', width: '1.2em' }} />,
    label: '',
    bgColorClass: '',
    bgHoverColorClass: 'hover:bg-neutral-100',
    onclick: () => null,
  },
  {
    key: 'kid-child',
    disable: true,
    title: 'Salon de niños',
    icon: <FaChildren style={{ height: '3em', width: '1.2em' }} />,
    label: '',
    bgColorClass: '',
    bgHoverColorClass: 'hover:bg-neutral-100',
    onclick: () => null,
  },
];

const userAdminOptions = [
  {
    key: 'users',
    disable: true,
    title: 'Usuarios',
    icon: <PiUser style={{ height: '3em', width: '1.2em' }} />,
    label: '',
    bgColorClass: '',
    bgHoverColorClass: 'hover:bg-neutral-100',
    onclick: () => null,
  },
  {
    key: 'roles',
    disable: true,
    title: 'Roles',
    icon: <PiUserCirclePlus style={{ height: '3em', width: '1.2em' }} />,
    label: '',
    bgColorClass: '',
    bgHoverColorClass: 'hover:bg-neutral-100',
    onclick: () => null,
  },
];
const systemAdminOptions = [
  {
    key: 'cache',
    disable: false,
    title: 'Borrar cache del servidor',
    icon: <PiArrowsClockwise style={{ height: '3em', width: '1.2em' }} />,
    label: 'Función para borrar cache del servidor',
    bgColorClass: '',
    bgHoverColorClass: 'hover:bg-neutral-100',
    onclick: () => {
      const dialog = document.getElementById('cleanCacheModal') as HTMLDialogElement | null;
      dialog?.showModal();
    },
  },
];
const AdminHome: NextPage = () => {
  const dispatch = useDispatch<AppDispatch>();

  return (
    <>
      <div className="bg-gray-50">
        <HomeNavBar />
        <div className="p-2 ">
          <ul className="list bg-base-100 rounded-box shadow-md py-4">
            <li className="p-4 pb-2 tracking-wide">Iglesia</li>
            {churchAdminOptions.map((option) => (
              <Cell
                key={option.key}
                disable={option.disable}
                title={option.title}
                icon={option.icon}
                label={option.label}
                bgColorClass={option.bgColorClass}
                bgHoverColorClass={option.bgHoverColorClass}
                onClick={option.onclick}
                iconRight={<IoIosArrowForward style={{ height: '3em', width: '1.2em' }} />}
              />
            ))}
          </ul>
        </div>

        <div className="p-2 ">
          <ul className="list bg-base-100 rounded-box shadow-md py-4">
            <li className="p-4 pb-2 tracking-wide">Iglesia de niños</li>
            {kidChurchAdminOptions.map((option) => (
              <Cell
                key={option.key}
                disable={option.disable}
                title={option.title}
                icon={option.icon}
                label={option.label}
                bgColorClass={option.bgColorClass}
                bgHoverColorClass={option.bgHoverColorClass}
                onClick={option.onclick}
                iconRight={<IoIosArrowForward style={{ height: '3em', width: '1.2em' }} />}
              />
            ))}
          </ul>
        </div>

        <div className="p-2 ">
          <ul className="list bg-base-100 rounded-box shadow-md py-4">
            <li className="p-4 pb-2 tracking-wide">Usuarios</li>
            {userAdminOptions.map((option) => (
              <Cell
                key={option.key}
                disable={option.disable}
                title={option.title}
                icon={option.icon}
                label={option.label}
                bgColorClass={option.bgColorClass}
                bgHoverColorClass={option.bgHoverColorClass}
                onClick={option.onclick}
                iconRight={<IoIosArrowForward style={{ height: '3em', width: '1.2em' }} />}
              />
            ))}
          </ul>
        </div>
        <div className="p-2 ">
          <ul className="list bg-base-100 rounded-box shadow-md py-4">
            <li className="p-4 pb-2 tracking-wide">Sistema</li>
            {systemAdminOptions.map((option) => (
              <Cell
                key={option.key}
                disable={option.disable}
                title={option.title}
                icon={option.icon}
                label={option.label}
                bgColorClass={option.bgColorClass}
                bgHoverColorClass={option.bgHoverColorClass}
                onClick={option.onclick}
                iconRight={<IoIosArrowForward style={{ height: '3em', width: '1.2em' }} />}
              />
            ))}
          </ul>
        </div>
      </div>
      <ConfirmationModal
        id={'cleanCacheModal'}
        title="¿Deseas borrar cache?"
        content="Esto eliminará toda la caché del servidor, incluyendo los servicios previamente registrados para reimpresión y otros puntos de entrada (EP) que actualmente responden con datos almacenados en caché."
        confirmButtonText="Borrar cache"
        confirmButtonType={ColorType.SUCCESS}
        onConfirm={async () => {
          dispatch(CleanCache());
        }}
        cancelButtonText="Cancelar"
        cancelButtonType={ColorType.INFO}
      />
    </>
  );
};

export default AdminHome;
