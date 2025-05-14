/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextPage } from 'next';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Image, Dialog } from 'react-vant';
import LoadingMask from '../components/LoadingMask';
import { RootState, AppDispatch, UserLogin } from '@/libs/state/redux';
import { IsRegisterKidChurch, IsSupervisorKidChurch } from '@/libs/utils/auth';

const CenteredContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const Login: NextPage = () => {
  const authSlice = useSelector((state: RootState) => state.authSlice);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const isRegisterKidChurch = IsRegisterKidChurch();
  const isSupervisorKidChurch = IsSupervisorKidChurch();

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

      if (isRegisterKidChurch) {
        router.push('/registration');
        return;
      }
      if (isSupervisorKidChurch) {
        router.push('/kid-church');
        return;
      }
      router.push('/settings');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSlice.token, authSlice.error, initialCheckDone]);

  return (
    <CenteredContainer>
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

              <p style={{ textAlign: 'center' }}>V 2.1.0</p>
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
    </CenteredContainer>
  );
};

export default Login;
