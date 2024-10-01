import type { NextPage } from 'next';
import { AppDispatch, RootState } from '../../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { churchGroup } from '../../constants/church';
import { useRouter } from 'next/router';
import NavBarApp from '../../components/NavBarApp';
import { useEffect } from 'react';
import { updateUserChurchGroup } from '@/redux/slices/user/account.slice';
import { Layout } from '@/components/Layout';
import { capitalizeWords } from '@/utils/text';
import { UserRole } from '@/utils/auth';
import { checkLastNameField } from '@/utils/validator';
import { Button, Form, Input, Selector } from 'react-vant';

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
    let role;
    if (authSlice.user?.roles.includes(UserRole.KID_REGISTER_ADMIN))
      role = 'Administrador Regikids';
    else if (authSlice.user?.roles.includes(UserRole.KID_REGISTER_SUPERVISOR))
      role = 'Supervisor Regikids';
    else if (authSlice.user?.roles.includes(UserRole.KID_REGISTER_USER))
      role = 'Maestro Regikids';
    else if (authSlice.user?.roles.includes(UserRole.KID_GROUP_ADMIN))
      role = 'Coordinador Iglekids';
    else if (authSlice.user?.roles.includes(UserRole.KID_GROUP_SUPERVISOR))
      role = 'Supervisor Iglekids';

    form.setFieldsValue({
      role,
      firstName: capitalizeWords(authSlice.user?.firstName ?? ''),
      lastName: capitalizeWords(authSlice.user?.lastName ?? ''),
      churchGroup: accountSlice.churchGroup,
    });
  }, [
    accountSlice.churchGroup,
    authSlice.user?.firstName,
    authSlice.user?.lastName,
    form,
  ]);

  return (
    <Layout>
      <NavBarApp title="Configuración Personal" />
      <Form
        layout="vertical"
        onFinish={onFinish}
        form={form}
        footer={
          <Button block type="primary" size="large">
            Guardar
          </Button>
        }
      >
        <Form.Item name="role" label="Rol">
          <Input placeholder="" disabled />
        </Form.Item>
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
          rules={[
            {
              required: true,
              message: 'Apellido es requerido',
            },
            {
              required: true,
              message: 'Se debe colocar ambos apellidos',
              validator: checkLastNameField,
            },
          ]}
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
    </Layout>
  );
};

export default PersonalInfo;
