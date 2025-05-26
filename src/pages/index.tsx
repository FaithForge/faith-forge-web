/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextPage } from 'next';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Image, Dialog } from 'react-vant';
import LoadingMask from '../components/LoadingMask';
import {
  RootState,
  AppDispatch,
  UserLogin,
  GetChurches,
} from '@/libs/state/redux';
import { getMainUserRole, UserRole } from '@/libs/utils/auth';

const Login: NextPage = () => {
  const authSlice = useSelector((state: RootState) => state.authSlice);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const mainRole = getMainUserRole();

  const onLogin = async (values: any) => {
    setIsLoading(true);
    const username = values.username.toLowerCase().trim();
    const password = values.password;

    await dispatch(UserLogin({ username, password }));

    setInitialCheckDone(true);
    setIsLoading(false);
  };

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
      dispatch(GetChurches(false));

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSlice.token, authSlice.error, initialCheckDone]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {isLoading ? <LoadingMask /> : ''}
      <div style={{ paddingBottom: 20 }}>
        <Image alt="Logo Iglekdis" src={'/logo-iglekids.png'} width={350} />
      </div>
      <Card style={{ width: '350px' }}>
        <Form
          layout="vertical"
          onFinish={async (values) => await onLogin(values)}
          footer={
            <>
              <Form.Item style={{ paddingTop: 20 }}>
                <Button block nativeType="submit" type="primary" size="large">
                  Iniciar sesión
                </Button>
              </Form.Item>

              <p style={{ textAlign: 'center' }}>V 2.2.0 Beta</p>
            </>
          }
        >
          <Form.Item
            name="username"
            label="Usuario/Email"
            rules={[
              {
                required: true,
                message: 'Por favor escribe tu email o usuario',
              },
            ]}
          >
            <Input placeholder="Ingresa tu usuario/email" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Contraseña"
            rules={[
              { required: true, message: 'Por favor, escribe tu contraseña' },
            ]}
          >
            <Input
              placeholder="Ingresa tu contraseña"
              type="password"
              minLength={6}
              maxLength={16}
            />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
