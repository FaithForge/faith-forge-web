import { Button, Form, Input, Modal, Popup } from 'antd-mobile';
import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { AppDispatch, RootState } from '../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { ExclamationOutlined } from '@ant-design/icons';
import { UserLogin } from '@/redux/thunks/user/auth.thunk';
import { parseJwt } from '@/utils/jwt';

const jwtSecret = process.env.NEXT_PUBLIC_JWT_SECRET;

const Login: NextPage = () => {
  const authSlice = useSelector((state: RootState) => state.authSlice);

  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const onLogin = async (values: any) => {
    const username = values.username;
    const password = values.password;

    await dispatch(UserLogin({ username, password }));

    if (authSlice.error) {
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
            <div>
              Por favor digite su usuario y contraseña correctamente Error:
              description: {authSlice.error}
            </div>
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
      return;
    }

    router.reload();
  };

  useEffect(() => {
    if (!authSlice.token || authSlice.token === '') {
      setVisible(true);
      return;
    }

    if (jwtSecret) {
      const decodedToken = parseJwt(authSlice.token);
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp && decodedToken.exp < currentTime) {
        setVisible(true);
        return;
      }

      setVisible(false);
      return;
    }
  }, [authSlice.token, dispatch]);

  return (
    <Popup
      visible={visible}
      bodyStyle={{
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        padding: 5,
      }}
    >
      <h1>Login</h1>
      <div
        style={{ overflowY: 'scroll', minHeight: '80vh', maxHeight: '80vh' }}
      >
        <Form
          layout="vertical"
          onFinish={onLogin}
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
            <Input placeholder="Ingresa tu Contraseña" type="password" />
          </Form.Item>
        </Form>
      </div>
    </Popup>
  );
};

export default Login;
