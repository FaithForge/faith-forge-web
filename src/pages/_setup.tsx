import { Button, Form, Popup, Selector } from 'antd-mobile';
import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { AppDispatch, RootState } from '../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import {
  GetChurchMeetings,
  GetChurchPrinters,
  GetChurches,
} from '@/redux/thunks/church/church.thunk';
import { updateCurrentChurch } from '@/redux/slices/church/church.slice';
import { updateCurrentChurchMeeting } from '@/redux/slices/church/churchMeeting.slice';
import { updateCurrentChurchPrinter } from '@/redux/slices/church/churchPrinter.slice';
import { parseJwt } from '@/utils/jwt';
import { churchGroup } from '@/constants/church';
import { updateUserChurchGroup } from '@/redux/slices/user/account.slice';
import { IsRegisterKidChurch } from '@/utils/auth';
import { ChurchMeetingStateEnum } from '@/models/Church';

const Setup: NextPage = () => {
  const [form] = Form.useForm();
  const authSlice = useSelector((state: RootState) => state.authSlice);
  const accountSlice = useSelector((state: RootState) => state.accountSlice);
  const churchSlice = useSelector((state: RootState) => state.churchSlice);
  const churchMeetingSlice = useSelector(
    (state: RootState) => state.churchMeetingSlice,
  );
  const churchPrinterSlice = useSelector(
    (state: RootState) => state.churchPrinterSlice,
  );
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const isRegisterKidChurch = IsRegisterKidChurch();
  const dispatch = useDispatch<AppDispatch>();

  const onFinish = async (values: any) => {
    const church = values.church[0];
    const churchMeeting = values.churchMeeting[0];
    const churchGroup = values.churchGroup[0];

    await dispatch(updateCurrentChurch(church));
    await dispatch(updateCurrentChurchMeeting(churchMeeting));
    await dispatch(updateUserChurchGroup(churchGroup));

    if (isRegisterKidChurch) {
      const churchPrinter = values.churchPrinter[0];
      await dispatch(updateCurrentChurchPrinter(churchPrinter));
    }

    router.reload();
  };

  useEffect(() => {
    if (authSlice.token || authSlice.token !== '') {
      const decodedToken = parseJwt(authSlice.token);
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp && decodedToken.exp >= currentTime) {
        if (
          !churchSlice.current ||
          !churchMeetingSlice.current ||
          (!churchPrinterSlice.current && isRegisterKidChurch) ||
          !accountSlice.churchGroup
        ) {
          setVisible(true);
          dispatch(GetChurches(false));
        }
        return;
      }

      setVisible(false);
      return;
    }

    setVisible(false);
  }, [authSlice.token, dispatch]);

  useEffect(() => {
    form.setFieldsValue({
      church: [churchSlice.current?.id],
      churchMeeting: [churchMeetingSlice.current?.id],
      churchPrinter: [churchPrinterSlice.current?.id],
    });
  }, [form, churchSlice.current?.id, churchMeetingSlice.current?.id]);

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

  const churchPrinterOptions = churchPrinterSlice.data
    ? churchPrinterSlice.data.map((churchPrinter) => {
        return {
          label: churchPrinter.name,
          value: churchPrinter.id,
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
          form={form}
          footer={
            <Button block type="submit" color="primary" size="large">
              Comenzar
            </Button>
          }
        >
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
                dispatch(
                  GetChurchMeetings({
                    churchId: arr[0],
                    state: ChurchMeetingStateEnum.ACTIVE,
                  }),
                );
                dispatch(GetChurchPrinters(arr[0]));
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
          {isRegisterKidChurch && (
            <Form.Item
              name="churchPrinter"
              label="Impresora seleccionada"
              rules={[
                {
                  required: true,
                  message: 'Por favor selecciona una impresora',
                },
              ]}
            >
              <Selector options={churchPrinterOptions} />
            </Form.Item>
          )}
          <Form.Item
            name="churchGroup"
            label="Grupo al que perteneces"
            rules={[
              { required: true, message: 'Por favor seleccione un grupo' },
            ]}
          >
            <Selector options={churchGroup} />
          </Form.Item>
        </Form>
      </div>
    </Popup>
  );
};

export default Setup;
