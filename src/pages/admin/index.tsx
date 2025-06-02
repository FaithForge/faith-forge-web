import Cell from '@/components/Cell';
import HomeNavBar from '@/components/navbar/HomeNavBar';
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
import { SiGoogleclassroom } from 'react-icons/si';

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
    disable: true,
    title: 'Borrar cache (Pronto)',
    icon: <PiArrowsClockwise style={{ height: '3em', width: '1.2em' }} />,
    label: '',
    bgColorClass: '',
    bgHoverColorClass: 'hover:bg-neutral-100',
    onclick: () => null,
  },
];
const AdminHome: NextPage = () => {
  return (
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
              iconRight={
                <IoIosArrowForward style={{ height: '3em', width: '1.2em' }} />
              }
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
              iconRight={
                <IoIosArrowForward style={{ height: '3em', width: '1.2em' }} />
              }
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
              iconRight={
                <IoIosArrowForward style={{ height: '3em', width: '1.2em' }} />
              }
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
              iconRight={
                <IoIosArrowForward style={{ height: '3em', width: '1.2em' }} />
              }
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminHome;
