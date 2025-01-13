/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextPage } from 'next';
import NavBarApp from '../../components/NavBarApp';
import { useEffect, useState } from 'react';
import LoadingMask from '../../components/LoadingMask';
import dayjs from 'dayjs';
import { DateTime } from 'luxon';
import { useSelector } from 'react-redux';
import { Button, DatetimePicker, Form, Grid, Selector } from 'react-vant';
import { Layout } from '../../components/Layout';
import { microserviceApiRequest } from '@faith-forge-web/utils/http';
import { HttpRequestMethod, MS } from '@faith-forge-web/common-types/global';
import { RootState } from '@faith-forge-web/state/redux';
import React from 'react';

const GenerateChurchMeetingReport: NextPage = () => {
  const [form] = Form.useForm();
  const [churches, setChurches] = useState([]);
  const [churchMeetings, setChurchMeetings] = useState([]);
  const [report, setReport] = useState<any>(null);
  const { token } = useSelector((state: RootState) => state.authSlice);

  const now = new Date();
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
    <Layout>
      <>
        {isLoading ? <LoadingMask /> : ''}
        <NavBarApp title="Generar reporte servicio" />
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
      </>
      <div style={{ fontSize: 16, paddingLeft: 15, paddingRight: 15 }}>
        {report && (
          <>
            <h2>Totales generales</h2>
            <Grid columnNum={2} gutter={0} border={true} center={false}>
              <Grid.Item style={{ fontWeight: 'bold' }}>
                Total niños registrados
              </Grid.Item>
              <Grid.Item>{report.totalKids}</Grid.Item>
              <Grid.Item style={{ fontWeight: 'bold' }}>
                Total niños nuevos
              </Grid.Item>
              <Grid.Item>{report.totalNewKids}</Grid.Item>
            </Grid>

            <h2>Totales por salones</h2>
            <Grid columnNum={2} gutter={0} border={true} center={false}>
              {report.statistics.byKidGroup.map((kidGroup: any) => {
                return (
                  <React.Fragment key={kidGroup.name}>
                    <Grid.Item style={{ fontWeight: 'bold', flexBasis: '50%' }}>
                      {kidGroup.name}
                    </Grid.Item>
                    <Grid.Item style={{ flexBasis: '50%' }}>
                      {kidGroup.count}
                    </Grid.Item>
                  </React.Fragment>
                );
              })}
            </Grid>

            <h2>Totales por genero</h2>
            <Grid columnNum={2} gutter={0} border={true} center={false}>
              <Grid.Item style={{ fontWeight: 'bold' }}>Masculino</Grid.Item>
              <Grid.Item>
                {report.statistics?.byGender?.find((d: any) => d.name === 'M')
                  ?.count ?? 0}
              </Grid.Item>
              <Grid.Item style={{ fontWeight: 'bold' }}>Femenino</Grid.Item>
              <Grid.Item>
                {report.statistics?.byGender?.find((d: any) => d.name === 'F')
                  ?.count ?? 0}
              </Grid.Item>
            </Grid>
            {/* <h2>Lista niños por salones</h2>
            {report.list.byKidGroup.map((kidGroup: any, index: any) => {
              return <ModalFaithForge key={index} kidGroup={kidGroup} />;
            })} */}
            <Button
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

export default GenerateChurchMeetingReport;
