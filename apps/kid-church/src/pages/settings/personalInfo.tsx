/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextPage } from 'next';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import NavBarApp from '../../components/NavBarApp';
import { useEffect } from 'react';
import { Button, Form, Input, Picker, Selector } from 'react-vant';
import { UserRole } from '../../utils/auth';
import { capitalizeWords } from '../../utils/text';
import { checkLastNameField } from '../../utils/validator';
import { Layout } from '../../components/Layout';
import {
  AppDispatch,
  RootState,
  updateUserChurchGroup,
} from '@faith-forge-web/state/redux';
import {
  churchGroup,
  churchGroupArray,
} from '@faith-forge-web/common-types/constants';

const PersonalInfo: NextPage = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const authSlice = useSelector((state: RootState) => state.authSlice);
  const accountSlice = useSelector((state: RootState) => state.accountSlice);

  const onFinish = (values: any) => {
    const churchGroup = values.churchGroup;

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
        onFinish={onFinish}
        form={form}
        footer={
          <Button
            nativeType="submit"
            type="primary"
            block
            style={{ paddingTop: 5, paddingBottom: 5, marginTop: 5 }}
          >
            Guardar
          </Button>
        }
        style={{ paddingLeft: 15, paddingRight: 15 }}
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
          isLink
          name="churchGroup"
          label="Grupo al que perteneces"
          rules={[{ required: true, message: 'Por favor seleccione un grupo' }]}
          onClick={(_, action) => {
            action?.current?.open();
          }}
        >
          <Picker
            popup
            columns={churchGroupArray}
            placeholder={'Seleccione un grupo'}
            confirmButtonText={'Confirmar'}
            cancelButtonText={'Cancelar'}
          >
            {(val) => val || 'Seleccione un grupo'}
          </Picker>
        </Form.Item>
      </Form>
    </Layout>
  );
};

export default PersonalInfo;
