/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AppDispatch,
  GetChurchCampuses,
  RootState,
  UserLogin,
} from '@/libs/state/redux';
import { getMainUserRole, GetUserRoles, UserRole } from '@/libs/utils/auth';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog, Image } from 'react-vant';
import LoadingMask from '../components/LoadingMask';

interface IFormLoginInput {
  username: string;
  password: string;
}

const Login: NextPage = () => {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<IFormLoginInput>();
  const onSubmit: SubmitHandler<IFormLoginInput> = async (data) => {
    setIsLoading(true);
    const username = data.username.toLowerCase().trim();
    const password = data.password;

    await dispatch(UserLogin({ username, password }));

    setInitialCheckDone(true);
    setIsLoading(false);
  };

  const roles = GetUserRoles();
  const authSlice = useSelector((state: RootState) => state.authSlice);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const redirect = () => {
    switch (mainRole) {
      case UserRole.SUPER_ADMIN:
        router.push('/admin');
        break;
      case UserRole.ADMIN:
        router.push('/admin');
        break;
      case UserRole.STAFF:
        router.push('/');
        break;

      case UserRole.KID:
        router.push('/');
        break;
      case UserRole.USER:
        router.push('/');
        break;

      // Kid MS Roles
      case UserRole.KID_CHURCH_ADMIN:
        router.push('/kid-church');
        break;
      case UserRole.KID_REGISTER_ADMIN:
        router.push('/kid-registration');
        break;
      case UserRole.KID_REGISTER_SUPERVISOR:
        router.push('/kid-registration');
        break;
      case UserRole.KID_REGISTER_USER:
        router.push('/kid-registration');
        break;
      case UserRole.KID_GROUP_ADMIN:
        router.push('/kid-church');
        break;
      case UserRole.KID_GROUP_SUPERVISOR:
        router.push('/kid-church');
        break;
      case UserRole.KID_GROUP_USER:
        router.push('/kid-church');
        break;

      default:
        router.push('/');
        break;
    }
  };

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const mainRole = getMainUserRole(roles);

  useEffect(() => {
    if (mainRole) redirect();
  }, []);

  useEffect(() => {
    if (initialCheckDone) {
      if (authSlice.error || authSlice.token === '') {
        Dialog.alert({
          title: 'Contraseña o usuario Incorrecto',
          message: 'Por favor digita su usuario y contraseña correctamente',
          confirmButtonText: 'Cerrar',
        });
        setInitialCheckDone(false);
        return;
      }

      setInitialCheckDone(false);
      dispatch(GetChurchCampuses());
      redirect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSlice.token, authSlice.error, initialCheckDone]);

  if (mainRole) return null;

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      {isLoading ? <LoadingMask /> : ''}
      <div style={{ paddingBottom: 20 }}>
        <Image alt="Logo Iglekdis" src={'/logo-iglekids.png'} width={350} />
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="w-4/5 md:w-1/3 px-4">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Usuario/Email</legend>
          <input
            type="text"
            className={`input ${errors.username && 'input-error'} w-full`}
            placeholder="Ingresa tu usuario/email"
            {...register('username', { required: true })}
          />
          {errors.username && (
            <p className="label text-red-700">
              Por favor escribe tu email o usuario
            </p>
          )}
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Contraseña</legend>
          <input
            type="password"
            className={`input ${errors.password && 'input-error'} w-full`}
            placeholder="Ingresa tu contraseña"
            {...register('password', { min: 6, required: true })}
          />
          {errors.password && (
            <p className="label text-red-700">
              Por favor, escribe tu contraseña
            </p>
          )}
        </fieldset>
        <button
          className={'btn btn-block mt-4 btn-lg bg-blue-950'}
          type="submit"
        >
          <span className="text-white">Iniciar sesión</span>
        </button>
        <p className="text-center pt-4">V 2.2.0 Beta</p>
      </form>
    </div>
  );
};

export default Login;
