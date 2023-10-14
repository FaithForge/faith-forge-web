import { Button, Form, Selector } from 'antd-mobile';
import type { NextPage } from 'next';
import { AppDispatch, RootState } from '../../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import NavBarApp from '../../components/NavBarApp';
import { useEffect } from 'react';
import { GetChurches } from '../../services/churchService';
import { GetChurchMeetings } from '../../services/churchMeetingService';
import { updateCurrentChurch } from '../../redux/slices/churchSlice';
import { updateCurrentChurchMeeting } from '../../redux/slices/churchMeetingSlice';
import LoadingMask from '../../components/LoadingMask';

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
      church: churchSlice.current?.id,
      churchMeeting: churchMeetingSlice.current?.id,
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
    dispatch(GetChurches());
  }, [dispatch]);

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

  return (
    <>
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
            footer={
              <Button block type="submit" color="primary" size="large">
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
                  dispatch(GetChurchMeetings(arr[0]));
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
    </>
  );
};

export default ChurchInfo;
