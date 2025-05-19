import { useRouter } from 'next/router';
import { Dispatch, SetStateAction, useState } from 'react';
import { Dialog, Notify } from 'react-vant';
import { PiUserSwitch } from 'react-icons/pi';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppDispatch,
  changeCurrentRole,
  GetKids,
  logout,
  resetChurchMeetingState,
  resetChurchPrinterState,
  resetChurchState,
  RootState,
} from '@/libs/state/redux';
import { IsRegisterKidChurch, UserRole } from '@/libs/utils/auth';
import { capitalizeWords } from '@/libs/utils/text';
import ConfirmationModal from '../modal/ConfirmationModal';
import { ColorType } from '@/libs/common-types/constants/theme';

type HomeNavBarProps = {
  findText?: string;
  setFindText?: Dispatch<SetStateAction<string>>;
};

const userRolesNavBarConfig: Partial<
  Record<UserRole, { color: string; text: string; dashboardUrl: string }>
> = {
  SUPER_ADMIN: {
    color: 'bg-gray-400',
    text: 'Super Administrador',
    dashboardUrl: '/admin',
  },
  ADMIN: {
    color: 'bg-amber-400',
    text: 'Administrador',
    dashboardUrl: '/admin',
  },
  // STAFF: {
  //   color: 'bg-amber-400',
  //   text: 'Staff',
  // },
  KID_CHURCH_ADMIN: {
    color: 'bg-amber-400',
    text: 'Administrador Iglekids',
    dashboardUrl: '/kid-church',
  },
  KID_REGISTER_ADMIN: {
    color: 'bg-green-600',
    text: 'Coordinador Regikids',
    dashboardUrl: '/registration',
  },
  KID_GROUP_ADMIN: {
    color: 'bg-pink-600',
    text: 'Coordinador Iglekids',
    dashboardUrl: '/kid-church',
  },
  KID_REGISTER_SUPERVISOR: {
    color: 'bg-green-600',
    text: 'Supervisor Regikids',
    dashboardUrl: '/registration',
  },
  KID_GROUP_SUPERVISOR: {
    color: 'bg-amber-400',
    text: 'Supervisor Iglekids',
    dashboardUrl: '/kid-church',
  },
  KID_REGISTER_USER: {
    color: 'bg-green-600',
    text: 'Maestro Regikids',
    dashboardUrl: '/registration',
  },
  KID_GROUP_USER: {
    color: 'bg-amber-400',
    text: 'Maestro Iglekids',
    dashboardUrl: '/registration',
  },
  // USER: {
  //   color: 'bg-amber-400',
  //   text: 'Usuario',
  // },
  // KID: {
  //   color: 'bg-amber-400',
  //   text: 'Niño',
  // },
};

const HomeNavBar = ({ findText, setFindText }: HomeNavBarProps) => {
  const authSlice = useSelector((state: RootState) => state.authSlice);
  const currentRole = authSlice.currentRole;
  const userRoles = authSlice.user?.roles;
  const router = useRouter();
  const dispatch = useDispatch();

  return (
    <>
      <div className="navbar bg-base-100 shadow-sm sticky top-0 z-100">
        <div className="flex-none">
          {userRoles &&
          userRoles.filter((role) => role in userRolesNavBarConfig).length >
            1 ? (
            <div className="indicator">
              <span
                className={`indicator-item indicator-bottom indicator-center status status-warning ${currentRole && userRolesNavBarConfig[currentRole]?.color}`}
              ></span>
              <div className="dropdown">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost btn-circle"
                >
                  <PiUserSwitch className="h-8 w-8" />
                </div>
                <ul
                  tabIndex={0}
                  className="menu dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
                >
                  {userRoles
                    .filter(
                      (userRole: UserRole) =>
                        userRolesNavBarConfig[userRole] !== undefined,
                    )
                    .map((userRole: UserRole) => {
                      return (
                        <li
                          key={userRole}
                          className={
                            currentRole === userRole ? 'menu-disabled' : ''
                          }
                        >
                          <a
                            onClick={async () => {
                              await dispatch(changeCurrentRole(userRole));
                              router.push(
                                userRolesNavBarConfig[userRole]
                                  ?.dashboardUrl as any,
                              );
                            }}
                            className={
                              currentRole === userRole ? 'menu-active' : ''
                            }
                          >
                            {userRolesNavBarConfig[userRole]?.text}
                            <span
                              className={`status status-lg ${userRolesNavBarConfig[userRole]?.color}`}
                            ></span>
                          </a>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>
          ) : null}
        </div>

        {IsRegisterKidChurch() && (
          <div className="flex-1 mx-2">
            <label className="input input-ghost">
              <svg
                className="h-[1em] opacity-50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <g
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </g>
              </svg>
              <input
                type="search"
                className="grow"
                placeholder="Buscar niño"
                onChange={(e) => setFindText && setFindText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    dispatch(findText && (GetKids({ findText }) as any));
                  }
                }}
              />
            </label>
          </div>
        )}

        <div className="flex-none">
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar"
            >
              <div className="w-8 rounded-full">
                <img
                  alt="Tailwind CSS Navbar component"
                  src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                />
              </div>
            </div>

            <ul
              tabIndex={0}
              className="menu menu-md dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
            >
              <li className={'menu-disabled'}>
                <a>
                  {capitalizeWords(authSlice.user?.firstName ?? '')}{' '}
                  {capitalizeWords(authSlice.user?.lastName ?? '')}
                </a>
              </li>
              {/* <li>
              <a className="justify-between">
                Profile
                <span className="badge">New</span>
              </a>
            </li>
            <li>
              <a>Settings</a>
            </li> */}
              <li>
                <a
                  onClick={() => {
                    const dialog = document.getElementById(
                      'logoutModal',
                    ) as HTMLDialogElement | null;
                    dialog?.showModal();
                  }}
                >
                  Cerrar Sesión
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <ConfirmationModal
        id={'logoutModal'}
        title="¿Deseas cerrar sesión?"
        content="Estás a punto de cerrar tu sesión. Si continúas, tendrás que volver a iniciar sesión para acceder nuevamente.
¿Estás seguro de que deseas continuar?"
        confirmButtonText="Cerrar sesión"
        confirmButtonType={ColorType.SUCCESS}
        onConfirm={async () => {
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
        }}
        cancelButtonText="Cancelar"
        cancelButtonType={ColorType.INFO}
      />
    </>
  );
};

export default HomeNavBar;
