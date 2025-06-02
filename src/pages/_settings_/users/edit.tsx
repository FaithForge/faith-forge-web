/* eslint-disable @nx/enforce-module-boundaries */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextPage } from 'next';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import NavBarApp from '../../../components/NavBarApp';
import { useEffect } from 'react';
import { Button, Form, Input, Selector } from 'react-vant';
import { Layout } from '../../../components/Layout';
import LoadingMask from '../../../components/LoadingMask';

import { checkPhoneField } from '../../../components/MobileInputApp';
import { idGuardianTypeSelect, userGenderSelect } from '@/libs/models';
import {
  AppDispatch,
  RootState,
  UpdateUser,
  resetEditUserState,
} from '@/libs/state/redux';
import { UserRole } from '@/libs/utils/auth';
import { capitalizeWords } from '@/libs/utils/text';
import { checkLastNameField } from '@/libs/utils/validator';

const EditUser: NextPage = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const userSlice = useSelector((state: RootState) => state.userSlice);
  const onFinish = (values: any) => {
    if (userSlice.current?.id) {
      const id = userSlice.current.id;
      const nationalIdType = values.nationalIdType[0];
      const nationalId = values.nationalId;
      const firstName = values.firstName;
      const lastName = values.lastName;
      const phone = values.phone;
      const gender = values.gender[0];
      dispatch(
        UpdateUser({
          id,
          updateUser: {
            nationalIdType,
            nationalId,
            firstName,
            lastName,
            phone,
            gender,
          },
        }),
      );
      router.back();
    }
  };

  useEffect(() => {
    dispatch(resetEditUserState());
    form.resetFields([
      'nationalIdType',
      'nationalId',
      'firstName',
      'lastName',
      'phone',
      'gender',
    ]);
  }, []);

  useEffect(() => {
    if (userSlice.current) {
      form.setFieldsValue({
        nationalIdType: [userSlice.current?.nationalIdType],
        nationalId: userSlice.current?.nationalId,
        firstName: capitalizeWords(userSlice.current?.firstName),
        lastName: capitalizeWords(userSlice.current?.lastName),
        phone: userSlice.current?.phone,
        gender: [userSlice.current?.gender],
      });
    }
  }, [form, userSlice]);

  return (
    <Layout>
      {userSlice.loading ? <LoadingMask /> : ''}
      <NavBarApp title="Actualizar Usuario" />
      <Form
        layout="vertical"
        onFinish={onFinish}
        form={form}
        footer={
          <Button block type="primary" size="large">
            Actualizar
          </Button>
        }
      >
        <Form.Item
          name="nationalIdType"
          label="Tipo de documento"
          rules={[
            {
              required: !userSlice.current?.roles?.find(
                (role: any) => role === UserRole.KID,
              ),
              message: 'Por favor seleccione un tipo de documento',
            },
          ]}
        >
          <Selector
            options={idGuardianTypeSelect}
            disabled={!userSlice.current}
          />
        </Form.Item>
        <Form.Item
          name="nationalId"
          label="Numero de documento"
          rules={[
            {
              required: !userSlice.current?.roles?.find(
                (role: any) => role === UserRole.KID,
              ),
              message: 'Numero de documento es requerido',
            },
          ]}
        >
          <Input
            placeholder="Escribir numero de documento..."
            autoComplete="false"
            disabled={!userSlice.current}
          />
        </Form.Item>
        <Form.Item
          name="firstName"
          label="Nombre"
          rules={[
            {
              required: true,
              message: 'Por favor coloca tu nombre',
            },
          ]}
        >
          <Input
            placeholder="Ingresa tu nombre"
            disabled={!userSlice.current}
          />
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
          <Input
            placeholder="Ingresa tu apellido"
            disabled={!userSlice.current}
          />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Teléfono"
          rules={
            !userSlice.current?.roles?.find(
              (role: any) => role === UserRole.KID,
            )
              ? [
                  {
                    required: true,
                    message:
                      'Por favor digite el numero teléfono del acudiente',
                  },
                  {
                    required: true,
                    message: 'El teléfono debe tener minimo 7 digitos',
                    validator: checkPhoneField,
                  },
                ]
              : []
          }
        >
          <Input
            placeholder="Escribir teléfono..."
            type="tel"
            autoComplete="false"
            disabled={!userSlice.current}
          />
        </Form.Item>
        <Form.Item
          name="gender"
          label="Genero"
          rules={[
            {
              required: true,
              message: 'Por favor seleccione el genero del acudiente',
            },
          ]}
        >
          <Selector options={userGenderSelect} disabled={!userSlice.current} />
        </Form.Item>
      </Form>
    </Layout>
  );
};

export default EditUser;
