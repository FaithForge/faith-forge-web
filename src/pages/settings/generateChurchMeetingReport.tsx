import {
  Button,
  DatePicker,
  DatePickerRef,
  Form,
  Grid,
  Selector,
} from 'antd-mobile';
import type { NextPage } from 'next';
import NavBarApp from '../../components/NavBarApp';
import { RefObject, useEffect, useState } from 'react';
import LoadingMask from '../../components/LoadingMask';
import dayjs from 'dayjs';
import {
  ApiVerbs,
  MS_CHURCH_PATH,
  MS_KID_CHURCH_PATH,
  makeApiRequest,
} from '../../api';
import ModalFaithForge from '../../components/ModalFaithForge';
import { DateTime } from 'luxon';
import { labelRendererCalendar } from '../../utils/date';
import { Layout } from '@/components/Layout';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

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
        await makeApiRequest(ApiVerbs.GET, `/${MS_CHURCH_PATH}/churches`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).data;
      setChurches(churchesResponse);
    })();
  }, []);

  const findChurchMeetings = async (meetingId: any) => {
    setIsLoading(true);
    const churchMeetingsResponse = (
      await makeApiRequest(
        ApiVerbs.GET,
        `${MS_CHURCH_PATH}/church/${meetingId}/meetings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
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
      await makeApiRequest(
        ApiVerbs.GET,
        `/${MS_KID_CHURCH_PATH}/report/kid-church-meeting`,
        {
          params: { churchMeetingId, date },
          headers: { Authorization: `Bearer ${token}` },
        },
      )
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
      await makeApiRequest(
        ApiVerbs.GET,
        `/${MS_KID_CHURCH_PATH}/report/kid-church-meeting/download`,
        {
          params: { churchMeetingId, date },
          headers: { Authorization: `Bearer ${token}` },
        },
      )
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
          footer={
            <Button block type="submit" color="primary" size="large">
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
            onClick={(e, datePickerRef: RefObject<DatePickerRef>) => {
              datePickerRef.current?.open();
            }}
            rules={[
              {
                required: true,
                message: 'Por favor seleccionar fecha de reporte',
              },
            ]}
          >
            <DatePicker
              max={now}
              min={dayjs().subtract(12, 'year').toDate()}
              title={'Fecha de reporte'}
              cancelText={'Cancelar'}
              confirmText={'Confirmar'}
              renderLabel={(type: string, data: number) =>
                labelRendererCalendar(type, data)
              }
            >
              {(value) =>
                value ? dayjs(value).format('YYYY-MM-DD') : 'Seleccionar fecha'
              }
            </DatePicker>
          </Form.Item>
        </Form>
      </>
      <div style={{ fontSize: 16 }} id="report">
        {report && (
          <>
            <h2>Totales generales</h2>
            <>
              <Grid
                columns={2}
                gap={8}
                style={{ paddingBottom: 10, border: '1px' }}
              >
                <Grid.Item style={{ fontWeight: 'bold' }}>
                  Total niños registrados
                </Grid.Item>
                <Grid.Item>{report.totalKids}</Grid.Item>
              </Grid>
              <Grid
                columns={2}
                gap={8}
                style={{ paddingBottom: 10, border: '1px' }}
              >
                <Grid.Item style={{ fontWeight: 'bold' }}>
                  Total niños nuevos
                </Grid.Item>
                <Grid.Item>{report.totalNewKids}</Grid.Item>
              </Grid>
            </>

            <h2>Totales por salones</h2>
            {report.statistics.byKidGroup.map((kidGroup: any) => {
              return (
                <Grid
                  columns={2}
                  gap={8}
                  style={{ paddingBottom: 10, border: '1px' }}
                  key={kidGroup.name}
                >
                  <Grid.Item style={{ fontWeight: 'bold' }}>
                    {kidGroup.name}
                  </Grid.Item>
                  <Grid.Item>{kidGroup.count}</Grid.Item>
                </Grid>
              );
            })}

            <h2>Totales por genero</h2>
            <Grid
              columns={2}
              gap={8}
              style={{ paddingBottom: 10, border: '1px' }}
            >
              <Grid.Item style={{ fontWeight: 'bold' }}>Masculino</Grid.Item>
              <Grid.Item>
                {report.statistics?.byGender?.find((d: any) => d.name === 'M')
                  ?.count ?? 0}
              </Grid.Item>
            </Grid>
            <Grid
              columns={2}
              gap={8}
              style={{ paddingBottom: 10, border: '1px' }}
            >
              <Grid.Item style={{ fontWeight: 'bold' }}>Femenino</Grid.Item>
              <Grid.Item>
                {report.statistics?.byGender?.find((d: any) => d.name === 'F')
                  ?.count ?? 0}
              </Grid.Item>
            </Grid>
            <h2>Lista niños por salones</h2>
            {report.list.byKidGroup.map((kidGroup: any, index: any) => {
              return <ModalFaithForge key={index} kidGroup={kidGroup} />;
            })}
            <Button
              block
              color="success"
              style={{ marginTop: 5 }}
              size="large"
              onClick={downloadFile}
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
