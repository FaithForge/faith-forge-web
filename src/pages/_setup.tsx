import { Button, Form, Input, Modal, Popup, Selector } from 'antd-mobile';
import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { AppDispatch, RootState } from '../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { GetChurches, GetPrinters } from '../services/churchService';
import { GetChurchMeetings } from '../services/churchMeetingService';
import { churchGroup } from '../constants/church';
import { setUser } from '../redux/slices/userSlice';
import { updateCurrentChurchMeeting } from '../redux/slices/churchMeetingSlice';
import {
  updateCurrentChurch,
  updateCurrentPrinter,
} from '../redux/slices/churchSlice';
import { useRouter } from 'next/router';
import { ExclamationOutlined } from '@ant-design/icons';

const Setup: NextPage = () => {
  const userSlice = useSelector((state: RootState) => state.userSlice);
  const churchSlice = useSelector((state: RootState) => state.churchSlice);
  const churchMeetingSlice = useSelector(
    (state: RootState) => state.churchMeetingSlice,
  );
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const onFinish = async (values: any) => {
    const firstName = values.firstName;
    const lastName = values.lastName;
    const churchGroup = values.churchGroup[0];
    const church = values.church[0];
    const churchMeeting = values.churchMeeting[0];
    const printer = values.printer[0];
    const password = values.password;

    if (password !== '963741') {
      Modal.show({
        header: (
          <ExclamationOutlined
            style={{
              fontSize: 64,
              color: 'var(--adm-color-warning)',
            }}
          />
        ),
        title: 'Contraseña Incorrecta',
        content: (
          <>
            <div>
              Por favor coloque la contraseña correcta. Si no la sabe por favor
              preguntar al administrador del sistema
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
    await dispatch(setUser({ firstName, lastName, churchGroup }));
    await dispatch(updateCurrentChurch(church));
    await dispatch(updateCurrentChurchMeeting(churchMeeting));
    await dispatch(updateCurrentPrinter(printer));
    router.reload();
  };

  useEffect(() => {
    if (!churchMeetingSlice.current || !userSlice.firstName) {
      setVisible(true);
    }
    dispatch(GetChurches());
  }, [churchMeetingSlice, dispatch, userSlice]);

  const churchOptions = churchSlice.data
    ? churchSlice.data.map((church) => {
        return {
          label: church.name,
          value: church.id,
        };
      })
    : [];

  const churchMeetingOptions = churchMeetingSlice.data
    ? churchMeetingSlice.data.map((church) => {
        return {
          label: church.name,
          value: church.id,
        };
      })
    : [];

  const printerOptions = churchSlice.printers
    ? churchSlice.printers.map((printer) => {
        return {
          label: printer.name,
          value: printer.id,
        };
      })
    : [];

  return (
    <Popup
      visible={visible}
      bodyStyle={{
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        padding: 5,
      }}
    >
      <h1>Configuración Inicial</h1>
      <div
        style={{ overflowY: 'scroll', minHeight: '80vh', maxHeight: '80vh' }}
      >
        <Form
          layout="vertical"
          onFinish={onFinish}
          footer={
            <Button block type="submit" color="primary" size="large">
              Comenzar
            </Button>
          }
        >
          <Form.Item
            name="firstName"
            label="Nombre"
            rules={[{ required: true, message: 'Por favor escribe tu nombre' }]}
          >
            <Input placeholder="Ingresa tu nombre" />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="Apellido"
            rules={[
              { required: true, message: 'Por favor escribe tu apellido' },
            ]}
          >
            <Input placeholder="Ingresa tu apellido" />
          </Form.Item>
          <Form.Item
            name="churchGroup"
            label="Grupo al que perteneces"
            rules={[
              { required: true, message: 'Por favor seleccione un grupo' },
            ]}
          >
            <Selector options={churchGroup} />
          </Form.Item>
          <Form.Item
            name="church"
            label="Sede"
            rules={[
              { required: true, message: 'Por favor selecciona una sede' },
            ]}
          >
            <Selector
              options={churchOptions}
              onChange={(arr) => {
                dispatch(GetChurchMeetings(arr[0]));
                dispatch(GetPrinters(arr[0]));
              }}
            />
          </Form.Item>
          <Form.Item
            name="churchMeeting"
            label="Servicio"
            rules={[
              { required: true, message: 'Por favor selecciona una reunión' },
            ]}
          >
            <Selector options={churchMeetingOptions} />
          </Form.Item>
          <Form.Item
            name="printer"
            label="Impresora seleccionada"
            rules={[
              {
                required: true,
                message: 'Por favor selecciona una impresora',
              },
            ]}
          >
            <Selector options={printerOptions} />
          </Form.Item>
          <Form.Item
            name="password"
            label="Contraseña de ingreso"
            rules={[
              {
                required: true,
                message: 'Por favor escribe la contraseña para acceder',
              },
            ]}
          >
            <Input
              placeholder="Ingresa contraseña de acceso"
              type="number"
              maxLength={6}
            />
          </Form.Item>
        </Form>
      </div>
    </Popup>
  );
};

export default Setup;
