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
import { ApiVerbs, makeApiRequest } from '../../api';
import ModalFaithForge from '../../components/ModalFaithForge';

const GenerateChurchMeetingReport: NextPage = () => {
  const [form] = Form.useForm();
  const [churches, setChurches] = useState([]);
  const [churchMeetings, setChurchMeetings] = useState([]);
  const [report, setReport] = useState<any>(null);

  const now = new Date();
  const [isLoading, setIsLoading] = useState(false);
  const [dateCache, setDateCache] = useState(null);
  const [churchMeetingCache, setChurchMeetingCache] = useState(null);

  useEffect(() => {
    (async () => {
      const churchesResponse = (await makeApiRequest(ApiVerbs.GET, '/churches'))
        .data;
      setChurches(churchesResponse);
    })();
  }, []);

  const findChurchMeetings = async (meetingId: any) => {
    setIsLoading(true);
    const churchMeetingsResponse = (
      await makeApiRequest(ApiVerbs.GET, `/churches/${meetingId}/meetings`)
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
      await makeApiRequest(ApiVerbs.GET, `/report/kidsChurchMeeting`, {
        params: { churchMeetingId, date },
      })
    ).data;
    setReport(reportResponse);
    setIsLoading(false);
  };

  const downloadFile = async () => {
    setIsLoading(true);
    const churchMeetingId = churchMeetingCache;
    const date = dateCache;

    const reportResponse = (
      await makeApiRequest(ApiVerbs.GET, `/report/kidsChurchMeeting/download`, {
        params: { churchMeetingId, date },
      })
    ).data;

    const bufferData = Buffer.from(reportResponse['data']);
    console.log(bufferData);
    const blob = new Blob([bufferData], {
      type: 'application/pdf',
    });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'archivo.pdf';
    a.click();

    window.URL.revokeObjectURL(url);
    setIsLoading(false);
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

  return (
    <>
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
            rules={[{ required: true, message: 'Por favor seleccionar fecha de reporte' }]}
          >
            <DatePicker
              max={now}
              min={dayjs().subtract(12, 'year').toDate()}
              title={'Fecha de reporte'}
              cancelText={'Cancelar'}
              confirmText={'Confirmar'}
            >
              {(value) =>
                value ? dayjs(value).format('YYYY-MM-DD') : 'Seleccionar fecha'
              }
            </DatePicker>
          </Form.Item>
        </Form>
      </>
      {report && (
        <div style={{ fontSize: 16 }}>
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
              <Grid.Item>{report.total}</Grid.Item>
            </Grid>
            <Grid
              columns={2}
              gap={8}
              style={{ paddingBottom: 10, border: '1px' }}
            >
              <Grid.Item style={{ fontWeight: 'bold' }}>
                Total niños nuevos
              </Grid.Item>
              <Grid.Item>{report.new}</Grid.Item>
            </Grid>
          </>

          <h2>Totales por salones</h2>
          {report.report.byKidGroup.map((kidGroup: any) => {
            return (
              <Grid
                columns={2}
                gap={8}
                style={{ paddingBottom: 10, border: '1px' }}
                key={kidGroup.room}
              >
                <Grid.Item style={{ fontWeight: 'bold' }}>
                  {kidGroup.room}
                </Grid.Item>
                <Grid.Item>{kidGroup.count}</Grid.Item>
              </Grid>
            );
          })}

          <h2>Totales por género</h2>
          <Grid
            columns={2}
            gap={8}
            style={{ paddingBottom: 10, border: '1px' }}
          >
            <Grid.Item style={{ fontWeight: 'bold' }}>Masculino</Grid.Item>
            <Grid.Item>{report.report.byGender.M ?? 0}</Grid.Item>
          </Grid>
          <Grid
            columns={2}
            gap={8}
            style={{ paddingBottom: 10, border: '1px' }}
          >
            <Grid.Item style={{ fontWeight: 'bold' }}>Femenino</Grid.Item>
            <Grid.Item>{report.report.byGender.F ?? 0}</Grid.Item>
          </Grid>
          <h2>Lista niños por salones</h2>
          {report.list.byKidGroup.map((kidGroup: any, index: any) => {
            return <ModalFaithForge key={index} kidGroup={kidGroup} />;
          })}
          {/* <Text category="h4" style={styles.subTitles}>
            Lista niños por salones
          </Text>
          {report.list.byKidGroup.map((kidGroup: any) => {
            return <ModalFaithForge kidGroup={kidGroup} />;
          })} */}
          <Button block color="primary" size="large" onClick={downloadFile}>
            Descargar reporte
          </Button>
        </div>
      )}
    </>
  );
};

export default GenerateChurchMeetingReport;
