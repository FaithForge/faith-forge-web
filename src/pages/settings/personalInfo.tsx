import { Button, Form, Input, Selector } from 'antd-mobile';
import type { NextPage } from 'next';
import { AppDispatch, RootState } from '../../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { churchGroup } from '../../constants/church';
import { useRouter } from 'next/router';
import { setUser } from '../../redux/slices/userSlice';
import NavBarApp from '../../components/NavBarApp';
import { useEffect } from 'react';

const PersonalInfo: NextPage = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const userSlice = useSelector((state: RootState) => state.userSlice);

  const onFinish = (values: any) => {
    const firstName = values.firstName;
    const lastName = values.lastName;
    const churchGroup = values.churchGroup[0];

    dispatch(setUser({ firstName, lastName, churchGroup }));
    router.back();
  };

  useEffect(() => {
    form.setFieldsValue({
      firstName: userSlice.firstName,
      lastName: userSlice.lastName,
      churchGroup: userSlice.churchGroup,
    });
  }, [form, userSlice.churchGroup, userSlice.firstName, userSlice.lastName]);

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
          <Input placeholder="Ingresa tu nombre" value={userSlice.firstName} />
        </Form.Item>
        <Form.Item
          name="lastName"
          label="Apellido"
          rules={[{ required: true, message: 'Por favor coloca tu apellido' }]}
        >
          <Input placeholder="Ingresa tu apellido" />
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
