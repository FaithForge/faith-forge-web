import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { RootState } from '@/libs/state/redux';
import { FFDay } from '@/libs/utils/ffDay';
import { microserviceApiRequest } from '@/libs/utils/http';
import dayjs from 'dayjs';
import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Button,
  DatetimePicker,
  Form,
  Selector,
} from 'react-vant';

const KidChurchReportModal = () => {
  const [form] = Form.useForm();
  const [churches, setChurches] = useState([]);
  const [churchMeetings, setChurchMeetings] = useState([]);
  const [report, setReport] = useState<any>(null);
  const { token } = useSelector((state: RootState) => state.authSlice);

  const now = FFDay.utc().tz('America/Bogota').startOf('day').toDate();
  const [isLoading, setIsLoading] = useState(false);
  const [dateCache, setDateCache] = useState(null);
  const [churchMeetingCache, setChurchMeetingCache] = useState(null);

  useEffect(() => {
    (async () => {
      const churchesResponse = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.GET,
          url: `/churches`,
          options: {
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;
      setChurches(churchesResponse);
    })();
  }, []);

  const findChurchMeetings = async (meetingId: any) => {
    setIsLoading(true);
    const churchMeetingsResponse = (
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.GET,
        url: `/church/${meetingId}/meetings`,
        options: {
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;
    setChurchMeetings(churchMeetingsResponse);
    setIsLoading(false);
  };

  const onFinish = async (values: any) => {
    setIsLoading(true);
    const churchMeetingId = values.churchMeeting[0];
    const date = values.date;

    setChurchMeetingCache(churchMeetingId);
    setDateCache(date);

    const reportResponse = (
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.GET,
        url: `/report/kid-church-meeting`,
        options: {
          params: { churchMeetingId, date },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;
    await setReport(reportResponse);
    setIsLoading(false);
    const reportHTML = document.getElementById('report');
    reportHTML?.scrollIntoView({ behavior: 'smooth' });
  };

  const churchOptions = churches
    ? churches.map((church: any) => {
        return {
          label: church.name,
          value: church.id,
        };
      })
    : [];

  const churchMeetingOptions = churchMeetings
    ? churchMeetings.map((churchMeeting: any) => {
        return {
          label: churchMeeting.name,
          value: churchMeeting.id,
        };
      })
    : [];

  const downloadFile = async () => {
    setIsLoading(true);
    const churchMeetingId = churchMeetingCache;
    const date = dateCache;

    const reportResponse = (
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.GET,
        url: `/report/kid-church-meeting/download`,
        options: {
          params: { churchMeetingId, date },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;

    const bufferData = Buffer.from(reportResponse['data']);
    const blob = new Blob([bufferData], {
      type: 'application/pdf',
    });
    const url = window.URL.createObjectURL(blob);

    const churchMeetingInfo = churchMeetingOptions.find(
      (churchMeeting) => churchMeeting.value === churchMeetingId,
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `${DateTime.local().toISODate()}-${churchMeetingInfo?.label.replace(
      ' ',
      '-',
    )}.pdf`;
    a.click();

    window.URL.revokeObjectURL(url);
    setIsLoading(false);
  };

  return (
    <dialog id="reportKidChurchModal" className="modal modal-bottom">
      <div className="modal-box">
        <form method="dialog">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={onFinish}
          >
            ✕
          </button>
        </form>
        <h3 className="text-xl font-bold text-center">Reporte Iglekids</h3>
        <div className="py-4">
          <Form
            layout="vertical"
            onFinish={onFinish}
            form={form}
            style={{ paddingLeft: 15, paddingRight: 15 }}
            footer={
              <Button
                loading={isLoading}
                loadingText="Generando reporte..."
                disabled={isLoading}
                block
                type="primary"
                size="large"
                nativeType="submit"
                style={{ paddingLeft: 15, paddingRight: 15 }}
              >
                Generar reporte
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
                onChange={async (arr) => {
                  if (arr.length) {
                    await findChurchMeetings(arr[0]);
                  } else {
                    setChurchMeetings([]);
                  }
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
            <Form.Item
              name="date"
              label="Fecha de reporte"
              trigger="onConfirm"
              onClick={(_, action) => {
                action?.current?.open();
              }}
              rules={[
                {
                  required: true,
                  message: 'Por favor seleccionar fecha de reporte',
                },
              ]}
            >
              <DatetimePicker
                popup
                type="date"
                minDate={dayjs().subtract(12, 'year').toDate()}
                maxDate={now}
                title={'Fecha de nacimiento'}
                cancelButtonText={'Cancelar'}
                confirmButtonText={'Confirmar'}
              >
                {(value: Date) =>
                  value
                    ? `${dayjs(value).format('YYYY-MM-DD')}`
                    : 'Seleccionar fecha'
                }
              </DatetimePicker>
            </Form.Item>
          </Form>

          <form method="dialog">
            <button className="btn btn-block btn-success" onClick={onFinish}>
              Finalizar
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
};

export default KidChurchReportModal;
