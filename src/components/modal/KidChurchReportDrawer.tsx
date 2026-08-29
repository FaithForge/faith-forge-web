import React, { useEffect, useMemo, useState } from 'react';
import { Drawer } from 'vaul';
import { FileText, MapPin, CalendarClock, Download, X, Loader2, Users, UserPlus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import Button from '@/components/ui/Button';
import DateCalendarPicker from '@/components/ui/DateCalendarPicker';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetChurchCampuses, GetChurchMeetings } from '@/libs/state/redux/thunks/church/church.thunk';
import { ChurchMeetingStateEnum } from '@/libs/models';
import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { microserviceApiRequest } from '@/libs/utils/http';

const DAYS_TO_NUM: Record<string, number> = {
  SUNDAY: 0,
  DOMINGO: 0,
  MONDAY: 1,
  LUNES: 1,
  TUESDAY: 2,
  MARTES: 2,
  WEDNESDAY: 3,
  MIERCOLES: 3,
  MIÉRCOLES: 3,
  THURSDAY: 4,
  JUEVES: 4,
  FRIDAY: 5,
  VIERNES: 5,
  SATURDAY: 6,
  SABADO: 6,
  SÁBADO: 6,
};

const DAY_TRANSLATIONS: Record<string, string> = {
  SUNDAY: 'Domingos',
  DOMINGO: 'Domingos',
  MONDAY: 'Lunes',
  LUNES: 'Lunes',
  TUESDAY: 'Martes',
  MARTES: 'Martes',
  WEDNESDAY: 'Miércoles',
  MIERCOLES: 'Miércoles',
  MIÉRCOLES: 'Miércoles',
  THURSDAY: 'Jueves',
  JUEVES: 'Jueves',
  FRIDAY: 'Viernes',
  VIERNES: 'Viernes',
  SATURDAY: 'Sábados',
  SABADO: 'Sábados',
  SÁBADO: 'Sábados',
};

const getTranslatedDay = (dayString?: string): string => {
  if (!dayString) return '';
  const key = String(dayString).toUpperCase().trim();
  return DAY_TRANSLATIONS[key] || dayString;
};

interface KidChurchReportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ReportStatistics = {
  byKidGroup: Array<{ name: string; count: number }>;
  byGender?: Array<{ name: string; count: number }>;
};

type ReportData = {
  totalKids: number;
  totalNewKids: number;
  statistics: ReportStatistics;
};

import { useModalBackClose } from '@/libs/hooks/useModalBackClose';

/**
 * Bottom sheet drawer for Iglekids service attendance and statistics reporting.
 *
 * @param {KidChurchReportDrawerProps} props - Open state and toggle callback.
 * @returns {JSX.Element}
 */
const KidChurchReportDrawer: React.FC<KidChurchReportDrawerProps> = ({ open, onOpenChange }) => {
  useModalBackClose(open, () => onOpenChange(false));

  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.authSlice.token);
  const campuses = useAppSelector((state) => state.churchCampusSlice);
  const meetings = useAppSelector((state) => state.churchMeetingSlice);

  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const todayStr = useMemo(() => dayjs().format('YYYY-MM-DD'), []);
  const minDateStr = useMemo(() => dayjs().subtract(5, 'year').format('YYYY-MM-DD'), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);

  const selectedMeetingObj = useMemo(
    () => meetings.data.find((m) => m.id === selectedMeetingId),
    [meetings.data, selectedMeetingId]
  );

  const allowedDaysOfWeek = useMemo(() => {
    if (!selectedMeetingObj?.day) return undefined;
    const dayKey = String(selectedMeetingObj.day).toUpperCase().trim();
    const dayNum = DAYS_TO_NUM[dayKey];
    return dayNum !== undefined ? [dayNum] : undefined;
  }, [selectedMeetingObj?.day]);

  // Initial load
  useEffect(() => {
    if (open) {
      if (campuses.data.length === 0) {
        dispatch(GetChurchCampuses());
      }
      const activeCampusId = campuses.current?.id || '';
      setSelectedCampusId(activeCampusId);
      const initialMeetingId = meetings.current?.id || '';
      setSelectedMeetingId(initialMeetingId);

      if (activeCampusId) {
        dispatch(
          GetChurchMeetings({
            churchCampusId: activeCampusId,
            states: [ChurchMeetingStateEnum.ACTIVE, ChurchMeetingStateEnum.ACTIVE_WITHOUT_DISPLAY],
          })
        );
      }
      
      const initialMeeting = meetings.data.find((m) => m.id === initialMeetingId) || meetings.current;
      if (initialMeeting?.day) {
        const dayKey = String(initialMeeting.day).toUpperCase().trim();
        const targetDayNum = DAYS_TO_NUM[dayKey];
        if (targetDayNum !== undefined) {
          let d = dayjs(todayStr);
          while (d.day() !== targetDayNum) {
            d = d.subtract(1, 'day');
          }
          setSelectedDate(d.format('YYYY-MM-DD'));
          return;
        }
      }
      setSelectedDate(todayStr);
    }
  }, [open]);

  // Load meetings when campus changes
  useEffect(() => {
    if (selectedCampusId) {
      dispatch(
        GetChurchMeetings({
          churchCampusId: selectedCampusId,
          states: [ChurchMeetingStateEnum.ACTIVE, ChurchMeetingStateEnum.ACTIVE_WITHOUT_DISPLAY],
        })
      );
    }
  }, [selectedCampusId, dispatch]);

  const handleCampusChange = (campusId: string) => {
    setSelectedCampusId(campusId);
    setSelectedMeetingId('');
    setReport(null);
  };

  const handleMeetingChange = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setReport(null);

    const targetMeeting = meetings.data.find((m) => m.id === meetingId);
    if (targetMeeting?.day) {
      const dayKey = String(targetMeeting.day).toUpperCase().trim();
      const targetDayNum = DAYS_TO_NUM[dayKey];
      if (targetDayNum !== undefined) {
        let d = dayjs(todayStr);
        while (d.day() !== targetDayNum) {
          d = d.subtract(1, 'day');
        }
        setSelectedDate(d.format('YYYY-MM-DD'));
      }
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedCampusId || !selectedMeetingId || !selectedDate) {
      toast.error('Por favor selecciona sede, servicio y fecha.');
      return;
    }

    setIsLoading(true);
    setReport(null);

    try {
      const response = await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.GET,
        url: `/report/kid-church-meeting`,
        options: {
          params: { churchMeetingId: selectedMeetingId, date: selectedDate },
          headers: { Authorization: `Bearer ${token}` },
        },
      });

      const reportData = response.data;
      if (!reportData || (typeof reportData === 'object' && Object.keys(reportData).length === 0)) {
        toast.info('No se encontraron registros de asistencia para los criterios seleccionados.');
        return;
      }

      setReport(reportData as ReportData);
      toast.success('Reporte generado exitosamente');
    } catch (err: any) {
      console.error('Error generating report', err);
      toast.error(err?.response?.data?.message || 'Error al generar el reporte de Iglekids.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedMeetingId || !selectedDate) return;

    setIsDownloading(true);
    try {
      const response = await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.GET,
        url: `/report/kid-church-meeting/download`,
        options: {
          params: { churchMeetingId: selectedMeetingId, date: selectedDate },
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'arraybuffer',
        },
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const meetingNameSanitized = (selectedMeetingObj?.name || 'servicio').replace(/\s+/g, '-');
      link.download = `${selectedDate}-${meetingNameSanitized}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success('Reporte PDF descargado correctamente');
    } catch (err) {
      console.error('Error downloading report PDF', err);
      toast.error('Error al descargar el archivo PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Drawer.Root handleOnly repositionInputs={false} open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/50 z-[300]" />
        <Drawer.Content 
          className="bg-gray-50 flex flex-col rounded-t-[24px] fixed bottom-0 left-0 right-0 z-[301] outline-none mt-20 max-h-[calc(100dvh-3rem)]"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Top Bar */}
          <div className="w-full bg-white rounded-t-[24px] border-b border-gray-100 shadow-xs z-20 flex items-center justify-between px-4 py-3.5 sticky top-0">
            <div className="w-8 shrink-0" />
            <h3 className="font-bold text-gray-800 text-base sm:text-lg flex items-center justify-center gap-2 text-center flex-1 truncate px-2">
              <FileText size={18} className="text-primary shrink-0" />
              <span className="truncate">Reporte de Asistencia Iglekids</span>
            </h3>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 active:scale-95 transition-all shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto p-4 flex flex-col gap-4 pb-12">
            {/* Filter Form Card */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3.5">
              {/* Sede */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  <MapPin size={15} className="text-primary" /> Sede
                </label>
                <div className="relative">
                  <select
                    className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-2.5 px-3.5 focus:border-primary focus:ring-0 transition-colors outline-none text-sm shadow-sm appearance-none font-medium"
                    value={selectedCampusId}
                    onChange={(e) => handleCampusChange(e.target.value)}
                  >
                    <option value="" disabled>Seleccione sede...</option>
                    {campuses.data.map((campus) => (
                      <option key={campus.id} value={campus.id}>{campus.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {/* Servicio */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  <CalendarClock size={15} className="text-primary" /> Servicio
                </label>
                <div className="relative">
                  <select
                    className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-2.5 px-3.5 focus:border-primary focus:ring-0 transition-colors outline-none text-sm shadow-sm appearance-none font-medium disabled:bg-gray-50 disabled:text-gray-400"
                    value={selectedMeetingId}
                    onChange={(e) => handleMeetingChange(e.target.value)}
                    disabled={!selectedCampusId || meetings.loading}
                  >
                    <option value="" disabled>Seleccione servicio...</option>
                    {meetings.data.map((meeting) => (
                      <option key={meeting.id} value={meeting.id}>{meeting.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    {meetings.loading ? <Loader2 size={16} className="animate-spin" /> : <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>}
                  </div>
                </div>
              </div>

              {/* Fecha */}
              <div>
                <DateCalendarPicker
                  label="Fecha del Servicio"
                  value={selectedDate}
                  minDate={minDateStr}
                  maxDate={todayStr}
                  allowedDaysOfWeek={allowedDaysOfWeek}
                  onChange={(date) => {
                    setSelectedDate(date);
                    setReport(null);
                  }}
                  helpText={
                    selectedMeetingObj?.day
                      ? `Solo se habilitan los días correspondientes a este servicio (${getTranslatedDay(selectedMeetingObj.day)}).`
                      : 'Selecciona la fecha exacta del servicio a consultar.'
                  }
                />
              </div>

              <Button
                onClick={handleGenerateReport}
                block
                variant="primary"
                loading={isLoading}
                loadingText="Generando reporte..."
                disabled={!selectedCampusId || !selectedMeetingId || !selectedDate || isLoading}
                className="mt-1"
              >
                Generar Reporte
              </Button>
            </div>

            {/* Results Section */}
            {report && (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* General Totals */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Users size={16} className="text-primary" /> Totales Generales
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-primary/10 border border-primary/20 p-3.5 rounded-xl text-center">
                      <span className="text-xs font-semibold text-primary block mb-1">Total Registrados</span>
                      <span className="text-2xl font-black text-primary">{report.totalKids ?? 0}</span>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-center">
                      <span className="text-xs font-semibold text-amber-800 block mb-1 flex items-center justify-center gap-1">
                        <Sparkles size={13} /> Nuevos
                      </span>
                      <span className="text-2xl font-black text-amber-900">{report.totalNewKids ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* Classrooms Breakdown */}
                {report.statistics?.byKidGroup && report.statistics.byKidGroup.length > 0 && (
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
                      Totales por Salones
                    </h3>
                    <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                      {report.statistics.byKidGroup.map((group) => (
                        <div key={group.name} className="flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50">
                          <span className="text-sm font-semibold text-gray-700">{group.name}</span>
                          <span className="text-sm font-black text-primary px-2.5 py-0.5 bg-primary/10 rounded-full">
                            {group.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gender Breakdown */}
                {report.statistics?.byGender && report.statistics.byGender.length > 0 && (
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
                      Totales por Género
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-center">
                        <span className="text-xs font-semibold text-blue-700 block">Masculino</span>
                        <span className="text-xl font-black text-blue-900 mt-1 block">
                          {report.statistics.byGender.find((g) => g.name === 'M')?.count ?? 0}
                        </span>
                      </div>

                      <div className="bg-pink-50 border border-pink-200 p-3 rounded-xl text-center">
                        <span className="text-xs font-semibold text-pink-700 block">Femenino</span>
                        <span className="text-xl font-black text-pink-900 mt-1 block">
                          {report.statistics.byGender.find((g) => g.name === 'F')?.count ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Download PDF Button */}
                <Button
                  onClick={handleDownloadPdf}
                  block
                  variant="primary"
                  loading={isDownloading}
                  loadingText="Descargando PDF..."
                  disabled={isDownloading}
                  className="flex items-center justify-center gap-2 shadow-md"
                >
                  <Download size={18} /> Descargar Reporte en PDF
                </Button>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default KidChurchReportDrawer;
