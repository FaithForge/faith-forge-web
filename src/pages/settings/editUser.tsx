import { Button, Form, Input, SearchBar, Selector } from 'antd-mobile';
import type { NextPage } from 'next';
import { AppDispatch, RootState } from '../../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import NavBarApp from '../../components/NavBarApp';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { capitalizeWords } from '@/utils/text';
import { checkLastNameField, checkPhoneField } from '@/utils/validator';
import { SearchOutlined } from '@ant-design/icons';
import { idGuardianTypeSelect, userGenderSelect } from '@/models/User';
import {
  GetUserByNationalId,
  UpdateUser,
} from '@/redux/thunks/user/user.thunk';
import { resetEditUserState } from '@/redux/slices/user/editUser.slice';
import LoadingMask from '@/components/LoadingMask';

const EditUser: NextPage = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [findText, setFindText] = useState('');
  const editUserSlice = useSelector((state: RootState) => state.editUserSlice);
  const onFinish = (values: any) => {
    if (editUserSlice.user?.id) {
      const id = editUserSlice.user.id;
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
    if (findText !== '') {
      dispatch(GetUserByNationalId(findText));
    }
  }, [dispatch, findText]);

  useEffect(() => {
    if (editUserSlice.user) {
      form.setFieldsValue({
        nationalIdType: [editUserSlice.user?.nationalIdType],
        nationalId: editUserSlice.user?.nationalId,
        firstName: capitalizeWords(editUserSlice.user?.firstName),
        lastName: capitalizeWords(editUserSlice.user?.lastName),
        phone: editUserSlice.user?.phone,
        gender: [editUserSlice.user?.gender],
      });
    }
  }, [editUserSlice.user, form]);

  return (
    <Layout>
      {editUserSlice.loading ? <LoadingMask /> : ''}
      <NavBarApp title="Actualizar Usuario" />
      <SearchBar
        showCancelButton
        cancelText="Cancelar"
        placeholder="Buscar usuario (cedula o nombre)"
        onSearch={(value) => setFindText(value)}
        onCancel={() => setFindText('')}
        icon={<SearchOutlined />}
        style={{
          position: 'sticky',
          top: '0',
          zIndex: 2,
          '--height': '49px',
          padding: '10px 5px',
          backgroundColor: 'white',
        }}
      />
      <Form
        layout="vertical"
        onFinish={onFinish}
        form={form}
        footer={
          <Button block type="submit" color="primary" size="large">
            Actualizar
          </Button>
        }
      >
        <Form.Item
          name="nationalIdType"
          label="Tipo de documento"
          rules={[
            {
              required: true,
              message: 'Por favor seleccione un tipo de documento',
            },
          ]}
        >
          <Selector
            options={idGuardianTypeSelect}
            disabled={!editUserSlice.user}
          />
        </Form.Item>
        <Form.Item
          name="nationalId"
          label="Numero de documento"
          rules={[
            { required: true, message: 'Numero de documento es requerido' },
          ]}
        >
          <Input
            placeholder="Escribir numero de documento..."
            autoComplete="false"
            disabled={!editUserSlice.user}
          />
        </Form.Item>
        <Form.Item
          name="firstName"
          label="Nombre"
          rules={[{ required: true, message: 'Por favor coloca tu nombre' }]}
        >
          <Input
            placeholder="Ingresa tu nombre"
            disabled={!editUserSlice.user}
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
            disabled={!editUserSlice.user}
          />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Telefono"
          rules={[
            {
              required: true,
              message: 'Por favor digite el numero telefono del acudiente',
            },
            {
              required: true,
              message: 'El telefono debe tener minimo 10 digitos',
              validator: checkPhoneField,
            },
          ]}
        >
          <Input
            placeholder="Escribir telefono..."
            type="tel"
            autoComplete="false"
            disabled={!editUserSlice.user}
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
          <Selector options={userGenderSelect} disabled={!editUserSlice.user} />
        </Form.Item>
      </Form>
    </Layout>
  );
};

export default EditUser;
