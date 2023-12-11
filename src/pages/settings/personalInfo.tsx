import { Button, Form, Input, Selector } from 'antd-mobile';
import type { NextPage } from 'next';
import { AppDispatch, RootState } from '../../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { churchGroup } from '../../constants/church';
import { useRouter } from 'next/router';
import NavBarApp from '../../components/NavBarApp';
import { useEffect } from 'react';
import { updateUserChurchGroup } from '@/redux/slices/user/account.slice';

const PersonalInfo: NextPage = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const authSlice = useSelector((state: RootState) => state.authSlice);
  const accountSlice = useSelector((state: RootState) => state.accountSlice);

  const onFinish = (values: any) => {
    const churchGroup = values.churchGroup[0];

    dispatch(updateUserChurchGroup(churchGroup));
    router.back();
  };

  useEffect(() => {
    form.setFieldsValue({
      firstName: authSlice.user?.firstName,
      lastName: authSlice.user?.lastName,
      churchGroup: accountSlice.churchGroup,
    });
  }, [
    accountSlice.churchGroup,
    authSlice.user?.firstName,
    authSlice.user?.lastName,
    form,
  ]);

  return (
    <>
      <NavBarApp title="Configuración Personal" />
      <Form
        layout="vertical"
        onFinish={onFinish}
        form={form}
        footer={
          <Button block type="submit" color="primary" size="large">
            Guardar
          </Button>
        }
      >
        <Form.Item
          name="firstName"
          label="Nombre"
          rules={[{ required: true, message: 'Por favor coloca tu nombre' }]}
        >
          <Input placeholder="Ingresa tu nombre" disabled />
        </Form.Item>
        <Form.Item
          name="lastName"
          label="Apellido"
          rules={[{ required: true, message: 'Por favor coloca tu apellido' }]}
        >
          <Input placeholder="Ingresa tu apellido" disabled />
        </Form.Item>
        <Form.Item
          name="churchGroup"
          label="Grupo al que perteneces"
          rules={[{ required: true, message: 'Por favor seleccione un grupo' }]}
        >
          <Selector options={churchGroup} />
        </Form.Item>
      </Form>
    </>
  );
};

export default PersonalInfo;
