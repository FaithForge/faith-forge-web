import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { RootState } from '@/libs/state/redux';
import { FFDay } from '@/libs/utils/ffDay';
import { microserviceApiRequest } from '@/libs/utils/http';
import dayjs from 'dayjs';
import { DateTime } from 'luxon';
import type { NextPage } from 'next';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, DatetimePicker, Form, Selector } from 'react-vant';
import { Layout } from '../../components/Layout';
import BackNavBar from '@/components/navbar/BackNavBar';

const ReportRegistrationGroup: NextPage = () => {
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
          url: `/church-campus`,
          options: {
            params: {
              churchId: process.env.NEXT_PUBLIC_CHURCH_ID,
            },
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;
      setChurches(churchesResponse);
    })();
  }, []);

  const findChurchMeetings = async (churchCampusId: string) => {
    setIsLoading(true);
    const churchMeetingsResponse = (
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.GET,
        url: `/church-meeting`,
        options: {
          params: {
            churchCampusId,
          },
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
    <Layout>
      <>
        <BackNavBar title="Generar reporte servicio" />
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
            name="churchCampus"
            label="Sede"
            rules={[{ required: true, message: 'Por favor seleccionar una sede' }]}
          >
            <Selector
              options={churchOptions}
              onChange={async (arr) => {
                if (arr.length) {
                  await findChurchMeetings(arr[0] as string);
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
                value ? `${dayjs(value).format('YYYY-MM-DD')}` : 'Seleccionar fecha'
              }
            </DatetimePicker>
          </Form.Item>
        </Form>
      </>
      <div
        style={{
          fontSize: 16,
          paddingLeft: 15,
          paddingRight: 15,
          paddingBottom: 140,
        }}
      >
        {report && (
          <>
            <h2 className="mt-4 mb-2 font-semibold text-lg">Totales generales</h2>
            <div className="grid grid-cols-2 border border-gray-300 divide-x divide-y divide-gray-300 text-left">
              <div className="font-bold px-4 py-2">Total niños registrados</div>
              <div className="px-4 py-2">{report.totalKids}</div>
              <div className="font-bold px-4 py-2">Total niños nuevos</div>
              <div className="px-4 py-2">{report.totalNewKids}</div>
            </div>

            <h2 className="mt-4 mb-2 font-semibold text-lg">Totales por salones</h2>
            <div className="grid grid-cols-2 border border-gray-300 divide-x divide-y divide-gray-300 text-left">
              {report.statistics.byKidGroup.map((kidGroup: any) => (
                <React.Fragment key={kidGroup.name}>
                  <div className="font-bold px-4 py-2">{kidGroup.name}</div>
                  <div className="px-4 py-2">{kidGroup.count}</div>
                </React.Fragment>
              ))}
            </div>

            <h2 className="mt-4 mb-2 font-semibold text-lg">Totales por género</h2>
            <div className="grid grid-cols-2 border border-gray-300 divide-x divide-y divide-gray-300 text-left mb-4">
              <div className="font-bold px-4 py-2">Masculino</div>
              <div className="px-4 py-2">
                {report.statistics?.byGender?.find((d: any) => d.name === 'M')?.count ?? 0}
              </div>
              <div className="font-bold px-4 py-2">Femenino</div>
              <div className="px-4 py-2">
                {report.statistics?.byGender?.find((d: any) => d.name === 'F')?.count ?? 0}
              </div>
            </div>

            <Button
              loading={isLoading}
              loadingText="Descargando reporte..."
              disabled={isLoading}
              block
              type="primary"
              style={{ marginTop: 5 }}
              size="large"
              onClick={downloadFile}
              id="report"
            >
              Descargar reporte
            </Button>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ReportRegistrationGroup;
