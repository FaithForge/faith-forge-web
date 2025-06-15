/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDispatch, GetChurchCampuses, RootState, UserLogin } from '@/libs/state/redux';
import { getMainUserRole, GetUserRoles, UserRole } from '@/libs/utils/auth';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import LoadingMask from '../components/LoadingMask';
import ConfirmationModal, { showConfirmationModal } from '@/components/modal/ConfirmationModal';
import { ColorType } from '@/libs/common-types/constants/theme';
import Form from '@/components/ui/Form';
import Input from '@/components/ui/Input';

interface IFormLoginInput {
  username: string;
  password: string;
}

const Login: NextPage = () => {
  const roles = GetUserRoles();
  const mainRole = getMainUserRole(roles);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const authSlice = useSelector((state: RootState) => state.authSlice);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit: SubmitHandler<IFormLoginInput> = async (data) => {
    setIsLoading(true);
    const username = data.username.toLowerCase().trim();
    const password = data.password;

    await dispatch(UserLogin({ username, password }));
    setInitialCheckDone(true);
    setIsLoading(false);
  };

  const redirect = () => {
    switch (mainRole) {
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
        router.push('/admin');
        break;
      case UserRole.STAFF:
      case UserRole.KID:
      case UserRole.USER:
        router.push('/');
        break;
      case UserRole.KID_CHURCH_ADMIN:
      case UserRole.KID_GROUP_ADMIN:
      case UserRole.KID_GROUP_SUPERVISOR:
      case UserRole.KID_GROUP_USER:
        router.push('/kid-church');
        break;
      case UserRole.KID_REGISTER_ADMIN:
      case UserRole.KID_REGISTER_SUPERVISOR:
      case UserRole.KID_REGISTER_USER:
        router.push('/kid-registration');
        break;
      default:
        router.push('/');
        break;
    }
  };

  useEffect(() => {
    if (mainRole) redirect();
  }, []);

  useEffect(() => {
    if (initialCheckDone) {
      if (authSlice.error || authSlice.token === '') {
        showConfirmationModal('errorTryLoginModal');
        setInitialCheckDone(false);
        return;
      }

      setInitialCheckDone(false);
      dispatch(GetChurchCampuses());
      redirect();
    }
  }, [authSlice.token, authSlice.error, initialCheckDone]);

  if (mainRole) return null;

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      {isLoading && <LoadingMask />}

      <div className="pb-5">
        <img alt="Logo Iglekids" src="/logo-iglekids.png" width={350} />
      </div>

      <Form
        className="w-4/5 md:w-1/3 px-4"
        onSubmit={onSubmit}
        defaultValues={{ username: '', password: '' }}
      >
        <Form.Item
          name="username"
          label="Usuario/Email"
          rules={{ required: 'Este campo es obligatorio' }}
        >
          <Input type="text" className="input w-full" placeholder="Ingresa tu usuario/email" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Contraseña"
          rules={{
            required: 'La contraseña es obligatoria',
            minLength: { value: 6, message: 'Mínimo 6 caracteres' },
          }}
        >
          <Input type="password" className="input w-full" placeholder="Ingresa tu contraseña" />
        </Form.Item>

        <button className="btn btn-block mt-4 btn-lg bg-blue-950" type="submit">
          <span className="text-white">Iniciar sesión</span>
        </button>

        <p className="text-center pt-4">V 2.2.0 Beta</p>
      </Form>

      <ConfirmationModal
        id="errorTryLoginModal"
        title="Contraseña o usuario Incorrecto"
        content="Por favor digita su usuario y contraseña correctamente"
        confirmButtonText="Cerrar"
        confirmButtonType={ColorType.ERROR}
      />
    </div>
  );
};

export default Login;
