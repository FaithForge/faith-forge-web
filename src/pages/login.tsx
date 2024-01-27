import {
  Button,
  Form,
  Input,
  Modal,
  Image,
  AutoCenter,
  Card,
} from 'antd-mobile';
import type { NextPage } from 'next';
import { AppDispatch, RootState } from '../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { ExclamationOutlined } from '@ant-design/icons';
import { UserLogin } from '@/redux/thunks/user/auth.thunk';
import styled from 'styled-components';
import { useEffect, useState } from 'react';
import LoadingMask from '@/components/LoadingMask';
import { resetChurchState } from '@/redux/slices/church/church.slice';
import { resetChurchMeetingState } from '@/redux/slices/church/churchMeeting.slice';
import { resetChurchPrinterState } from '@/redux/slices/church/churchPrinter.slice';

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

  const onLogin = async (values: any) => {
    setIsLoading(true);
    const username = values.username.toLowerCase();
    const password = values.password;

    await dispatch(UserLogin({ username, password }));

    dispatch(resetChurchState());
    dispatch(resetChurchMeetingState());
    dispatch(resetChurchPrinterState());
    setInitialCheckDone(true);
    setIsLoading(false);
  };

  useEffect(() => {
    if (initialCheckDone) {
      if (authSlice.error || authSlice.token === '') {
        Modal.show({
          header: (
            <ExclamationOutlined
              style={{
                fontSize: 64,
                color: 'var(--adm-color-warning)',
              }}
            />
          ),
          title: 'Contraseña o usuario Incorrecto',
          content: (
            <>
              <div>Por favor digita su usuario y contraseña correctamente</div>
            </>
          ),
          closeOnMaskClick: true,
          closeOnAction: true,
          actions: [
            {
              key: 'close',
              text: 'Cerrar',
              primary: true,
            },
          ],
        });
        setInitialCheckDone(false);
        return;
      }

      setInitialCheckDone(false);
      router.push('/registration');
    }
  }, [authSlice.token, authSlice.error, initialCheckDone]);

  return (
    <CenteredContainer>
      {isLoading ? <LoadingMask /> : ''}
      <AutoCenter>
        <Image alt="Logo Iglekdis" src={'/logo-iglekids.png'} width={350} />
      </AutoCenter>
      <Card style={{ width: '350px' }}>
        <Form
          layout="vertical"
          onFinish={async (values) => await onLogin(values)}
          footer={
            <Button block type="submit" color="primary" size="large">
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
            <Input placeholder="Ingresa tu Usuario/Email" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Contraseña"
            rules={[
              { required: true, message: 'Por favor escribe tu Contraseña' },
            ]}
          >
            <Input
              placeholder="Ingresa tu Contraseña"
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
