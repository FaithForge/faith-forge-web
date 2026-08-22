import BackNavBar from '@/components/navbar/BackNavBar';
import Alert from '@/components/ui/Alert';
import { Layout } from '@/components/Layout';
import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { ColorType } from '@/libs/common-types/constants/theme';
import { RootState } from '@/libs/state/redux';
import { FFDay } from '@/libs/utils/ffDay';
import { microserviceApiRequest } from '@/libs/utils/http';
import dayjs from 'dayjs';
import { DateTime } from 'luxon';
import type { NextPage } from 'next';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Button from '@/components/ui/Button';
import DateCalendarPicker from '@/components/ui/DateCalendarPicker';

type ChurchCampus = {
  id: string;
  name: string;
};

type ChurchMeeting = {
  id: string;
  name: string;
};

type ReportStatistics = {
  byKidGroup: Array<{ name: string; count: number }>;
  byGender?: Array<{ name: string; count: number }>;
};

type ReportData = {
  totalKids: number;
  totalNewKids: number;
  statistics: ReportStatistics;
};

type ReportNotice = {
  type: ColorType;
  title: string;
  subtitle?: string;
};

const ReportRegistrationGroup: NextPage = () => {
  const [churches, setChurches] = useState<ChurchCampus[]>([]);
  const [churchMeetings, setChurchMeetings] = useState<ChurchMeeting[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [reportNotice, setReportNotice] = useState<ReportNotice | null>(null);
  const { token } = useSelector((state: RootState) => state.authSlice);

  const now = useMemo(
    () => FFDay.utc().tz('America/Bogota').startOf('day').format('YYYY-MM-DD'),
    [],
  );
  const todayLabel = useMemo(() => FFDay.utc().tz('America/Bogota').format('YYYY-MM-DD'), []);
  const minDate = useMemo(() => dayjs().subtract(12, 'year').format('YYYY-MM-DD'), []);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChurchCampusId, setSelectedChurchCampusId] = useState('');
  const [selectedChurchMeetingId, setSelectedChurchMeetingId] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayLabel);
  const [dateCache, setDateCache] = useState(todayLabel);
  const [churchMeetingCache, setChurchMeetingCache] = useState('');

  const resetReportState = () => {
    setReport(null);
    setReportNotice(null);
  };

  const isEmptyReportPayload = (payload: unknown) => {
    if (!payload) {
      return true;
    }

    if (Array.isArray(payload)) {
      return payload.length === 0;
    }

    if (typeof payload !== 'object') {
      return true;
    }

    return Object.keys(payload).length === 0;
  };

  useEffect(() => {
    if (!token) {
      return;
    }

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
      setChurches(churchesResponse as ChurchCampus[]);
    })();
  }, [token]);

  const findChurchMeetings = async (churchCampusId: string) => {
    setIsLoading(true);
    try {
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
      setChurchMeetings(churchMeetingsResponse as ChurchMeeting[]);
    } finally {
      setIsLoading(false);
    }
  };

  const onFinish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedChurchCampusId || !selectedChurchMeetingId || !selectedDate) {
      return;
    }

    setIsLoading(true);
    setReport(null);
    setReportNotice(null);

    try {
      const reportResponse = (
        await microserviceApiRequest({
          microservice: MS.KidChurch,
          method: HttpRequestMethod.GET,
          url: `/report/kid-church-meeting`,
          options: {
            params: { churchMeetingId: selectedChurchMeetingId, date: selectedDate },
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      if (isEmptyReportPayload(reportResponse)) {
        setReportNotice({
          type: ColorType.WARNING,
          title: 'No se encontró reporte',
          subtitle: 'El servicio no devolvió información para la fecha y el servicio seleccionados.',
        });
        setChurchMeetingCache('');
        setDateCache(selectedDate);
        return;
      }

      setReport(reportResponse as ReportData);
      setChurchMeetingCache(selectedChurchMeetingId);
      setDateCache(selectedDate);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Inténtalo nuevamente.';

      setReport(null);
      setChurchMeetingCache('');
      setDateCache(selectedDate);
      setReportNotice({
        type: ColorType.ERROR,
        title: 'No se pudo generar el reporte',
        subtitle: errorMessage,
      });
      return;
    } finally {
      setIsLoading(false);
    }

    requestAnimationFrame(() => {
      const reportHTML = document.getElementById('report');
      reportHTML?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const churchMeetingInfo = useMemo(
    () => churchMeetings.find((churchMeeting) => churchMeeting.id === churchMeetingCache),
    [churchMeetingCache, churchMeetings],
  );

  const downloadFile = async () => {
    setIsLoading(true);

    try {
      const reportResponse = (
        await microserviceApiRequest({
          microservice: MS.KidChurch,
          method: HttpRequestMethod.GET,
          url: `/report/kid-church-meeting/download`,
          options: {
            params: { churchMeetingId: churchMeetingCache, date: dateCache },
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;

      const bufferData = Buffer.from(reportResponse['data']);
      const blob = new Blob([bufferData], {
        type: 'application/pdf',
      });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${DateTime.local().toISODate()}-${churchMeetingInfo?.name.replace(
        /\s+/g,
        '-',
      )}.pdf`;
      a.click();

      window.URL.revokeObjectURL(url);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 pb-36 pt-4">
        <BackNavBar title="Generar reporte servicio" />

        <form
          onSubmit={onFinish}
          className="mt-4 space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="space-y-2">
            <label htmlFor="churchCampus" className="text-sm font-medium text-gray-700">
              Sede
            </label>
            <select
              id="churchCampus"
              name="churchCampus"
              required
              value={selectedChurchCampusId}
              onChange={async (event) => {
                const churchCampusId = event.target.value;
                setSelectedChurchCampusId(churchCampusId);
                setSelectedChurchMeetingId('');
                setChurchMeetingCache('');
                setDateCache(todayLabel);
                setSelectedDate(todayLabel);
                resetReportState();

                if (churchCampusId) {
                  await findChurchMeetings(churchCampusId);
                } else {
                  setChurchMeetings([]);
                }
              }}
              className="select select-bordered w-full"
            >
              <option value="">Seleccionar sede</option>
              {churches.map((church) => (
                <option key={church.id} value={church.id}>
                  {church.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="churchMeeting" className="text-sm font-medium text-gray-700">
              Servicio
            </label>
            <select
              id="churchMeeting"
              name="churchMeeting"
              required
              value={selectedChurchMeetingId}
              onChange={(event) => {
                setSelectedChurchMeetingId(event.target.value);
                resetReportState();
              }}
              disabled={!churchMeetings.length}
              className="select select-bordered w-full disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="">Seleccionar servicio</option>
              {churchMeetings.map((churchMeeting) => (
                <option key={churchMeeting.id} value={churchMeeting.id}>
                  {churchMeeting.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <DateCalendarPicker
              label="Fecha de reporte"
              value={selectedDate}
              minDate={minDate}
              maxDate={now}
              helpText={`Por defecto queda en hoy. Selecciona una fecha entre ${minDate} y ${now}.`}
                onChange={(date) => {
                  setSelectedDate(date);
                  resetReportState();
                }}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            loadingText="Generando reporte..."
            block
            size="lg"
            className="disabled:cursor-not-allowed"
          >
            Generar reporte
          </Button>
        </form>

        {reportNotice ? (
          <div className="mt-4">
            <Alert title={reportNotice.title} subtitle={reportNotice.subtitle} type={reportNotice.type} />
          </div>
        ) : null}

        {report && (
          <section
            id="report"
            className="mt-4 space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">Totales generales</h2>
              <div className="grid grid-cols-2 divide-x divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 text-left">
                <div className="px-4 py-3 font-medium text-gray-700">Total niños registrados</div>
                <div className="px-4 py-3 text-gray-900">{report.totalKids}</div>
                <div className="px-4 py-3 font-medium text-gray-700">Total niños nuevos</div>
                <div className="px-4 py-3 text-gray-900">{report.totalNewKids}</div>
              </div>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">Totales por salones</h2>
              <div className="grid grid-cols-2 divide-x divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 text-left">
                {report.statistics.byKidGroup.map((kidGroup) => (
                  <React.Fragment key={kidGroup.name}>
                    <div className="px-4 py-3 font-medium text-gray-700">{kidGroup.name}</div>
                    <div className="px-4 py-3 text-gray-900">{kidGroup.count}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">Totales por género</h2>
              <div className="grid grid-cols-2 divide-x divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 text-left">
                <div className="px-4 py-3 font-medium text-gray-700">Masculino</div>
                <div className="px-4 py-3 text-gray-900">
                  {report.statistics?.byGender?.find((gender) => gender.name === 'M')?.count ?? 0}
                </div>
                <div className="px-4 py-3 font-medium text-gray-700">Femenino</div>
                <div className="px-4 py-3 text-gray-900">
                  {report.statistics?.byGender?.find((gender) => gender.name === 'F')?.count ?? 0}
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              loading={isLoading}
              loadingText="Descargando reporte..."
              block
              size="lg"
              onClick={downloadFile}
              className="disabled:cursor-not-allowed"
            >
              Descargar reporte
            </Button>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default ReportRegistrationGroup;
