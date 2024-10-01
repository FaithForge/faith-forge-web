import type { NextPage } from 'next';
import { AppDispatch, RootState } from '../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { UserLogin } from '@/redux/thunks/user/auth.thunk';
import styled from 'styled-components';
import { useEffect, useState } from 'react';
import LoadingMask from '@/components/LoadingMask';
import { IsRegisterKidChurch, IsSupervisorKidChurch } from '@/utils/auth';
import packageJson from '../../package.json';
import { Button, Card, Form, Input } from 'react-vant';

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
    const username = values.username.toLowerCase();
    const password = values.password;

    await dispatch(UserLogin({ username, password }));

    setInitialCheckDone(true);
    setIsLoading(false);
  };

  useEffect(() => {
    if (initialCheckDone) {
      if (authSlice.error || authSlice.token === '') {
        // Modal.show({
        //   header: (
        //     <ExclamationOutlined
        //       style={{
        //         fontSize: 64,
        //         color: 'var(--adm-color-warning)',
        //       }}
        //     />
        //   ),
        //   title: 'Contraseña o usuario Incorrecto',
        //   content: (
        //     <>
        //       <div>Por favor digita su usuario y contraseña correctamente</div>
        //     </>
        //   ),
        //   closeOnMaskClick: true,
        //   closeOnAction: true,
        //   actions: [
        //     {
        //       key: 'close',
        //       text: 'Cerrar',
        //       primary: true,
        //     },
        //   ],
        // });
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
  }, [authSlice.token, authSlice.error, initialCheckDone]);

  return (
    <CenteredContainer>
      {isLoading ? <LoadingMask /> : ''}
      {/* <AutoCenter>
        <Image alt="Logo Iglekdis" src={'/logo-iglekids.png'} width={350} />
      </AutoCenter> */}
      <Card style={{ width: '350px' }}>
        <Form
          layout="vertical"
          onFinish={async (values) => await onLogin(values)}
          footer={
            <Button block type="primary" size="large">
              Iniciar sesión
            </Button>
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
      Versión {packageJson.version}
    </CenteredContainer>
  );
};

export default Login;
