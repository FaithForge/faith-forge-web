/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextPage } from 'next';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import NavBarApp from '../../components/NavBarApp';
import { useEffect } from 'react';
import LoadingMask from '../../components/LoadingMask';
import { Button, Form, Selector } from 'react-vant';
import { Layout } from '../../components/Layout';
import {
  AppDispatch,
  GetChurches,
  GetChurchMeetings,
  RootState,
  updateCurrentChurch,
  updateCurrentChurchMeeting,
} from '@faith-forge-web/state/redux';
import { ChurchMeetingStateEnum } from '@faith-forge-web/models';

const ChurchInfo: NextPage = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const churchSlice = useSelector((state: RootState) => state.churchSlice);
  const churchMeetingSlice = useSelector(
    (state: RootState) => state.churchMeetingSlice,
  );

  useEffect(() => {
    form.setFieldsValue({
      church: [churchSlice.current?.id],
      churchMeeting: [churchMeetingSlice.current?.id],
    });
  }, [form, churchSlice.current?.id, churchMeetingSlice.current?.id]);

  const onFinish = async (values: any) => {
    const church = values.church[0] ?? churchSlice.current?.id;
    const churchMeeting =
      values.churchMeeting[0] ?? churchMeetingSlice.current?.id;

    if (church && churchMeeting) {
      await dispatch(updateCurrentChurch(church));
      await dispatch(updateCurrentChurchMeeting(churchMeeting));
      router.back();
    }
  };

  useEffect(() => {
    dispatch(GetChurches(false));
  }, [dispatch]);

  const churchOptions = churchSlice.data
    ? churchSlice.data.map((church: any) => {
        return {
          label: church.name,
          value: church.id,
        };
      })
    : [];

  const churchMeetingOptions = churchMeetingSlice.data
    ? churchMeetingSlice.data.map((church: any) => {
        return {
          label: church.name,
          value: church.id,
        };
      })
    : [];

  return (
    <Layout>
      {churchMeetingSlice && churchSlice ? (
        <>
          {churchSlice.loading || churchMeetingSlice.loading ? (
            <LoadingMask />
          ) : (
            ''
          )}
          <NavBarApp title="Configuración de Iglesia" />
          <Form
            layout="vertical"
            onFinish={onFinish}
            form={form}
            style={{ paddingLeft: 15, paddingRight: 15 }}
            footer={
              <Button
                block
                type="primary"
                size="large"
                nativeType="submit"
                style={{ paddingTop: 5, paddingBottom: 5, marginTop: 5 }}
              >
                Guardar
              </Button>
            }
          >
            <Form.Item
              name="church"
              label="Sede"
              rules={[
                { required: true, message: 'Por favor seleccionar una sede' },
              ]}
            >
              <Selector
                options={churchOptions}
                onChange={(arr) => {
                  form.resetFields(['churchMeeting']);
                  dispatch(
                    GetChurchMeetings({
                      churchId: arr[0] as string,
                      state: ChurchMeetingStateEnum.ACTIVE,
                    }),
                  );
                }}
              />
            </Form.Item>
            <Form.Item
              name="churchMeeting"
              label="Servicio"
              rules={[
                {
                  required: true,
                  message: 'Por favor seleccionar una reunión',
                },
              ]}
            >
              <Selector options={churchMeetingOptions} />
            </Form.Item>
          </Form>
        </>
      ) : null}
    </Layout>
  );
};

export default ChurchInfo;
