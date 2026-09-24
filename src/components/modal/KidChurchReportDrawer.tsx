import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppDrawer from '@/components/ui/AppDrawer';
import { FileText, MapPin, CalendarClock, Download, Loader2, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import Button from '@/components/ui/Button';
import DateCalendarPicker from '@/components/ui/DateCalendarPicker';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetChurchCampuses, GetChurchMeetings } from '@/libs/state/redux/thunks/church/church.thunk';
import { ChurchMeetingStateEnum, IAttendanceReportData } from '@/libs/models';
import { getAttendanceReportDetail } from '@/services/kidChurchReportService';
import { generateKidAttendancePdf } from '@/services/pdf/iglekidsAttendancePdf';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { useChurchTerm, useKidsTerm } from '@/libs/hooks/useTerm';
import { sortKidGroupsByAge } from '@/libs/utils/kidGroup';

const DAYS_TO_NUM: Record<string, number> = {
  SUNDAY: 0,
  DOMINGO: 0,
  '0': 0,
  MONDAY: 1,
  LUNES: 1,
  '1': 1,
  TUESDAY: 2,
  MARTES: 2,
  '2': 2,
  WEDNESDAY: 3,
  MIERCOLES: 3,
  MIÉRCOLES: 3,
  '3': 3,
  THURSDAY: 4,
  JUEVES: 4,
  '4': 4,
  FRIDAY: 5,
  VIERNES: 5,
  '5': 5,
  SATURDAY: 6,
  SABADO: 6,
  SÁBADO: 6,
  '6': 6,
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

type ReportData = IAttendanceReportData;

/**
 * Bottom sheet drawer for kids ministry service attendance and statistics reporting.
 *
 * @param {KidChurchReportDrawerProps} props - Open state and toggle callback.
 * @returns {JSX.Element}
 */
const KidChurchReportDrawer: React.FC<KidChurchReportDrawerProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation(['kidChurch', 'common']);
  useModalBackClose(open, () => onOpenChange(false));

  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.authSlice.token);
  const campuses = useAppSelector((state) => state.churchCampusSlice);
  const meetings = useAppSelector((state) => state.churchMeetingSlice);

  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');

  const kidsModuleName = useKidsTerm('module_alias');
  const campusTerm = useChurchTerm('campus');
  const meetingTerm = useChurchTerm('meeting');
  const todayStr = useMemo(() => dayjs().format('YYYY-MM-DD'), []);
  const minDateStr = useMemo(() => dayjs().subtract(5, 'year').format('YYYY-MM-DD'), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [report, setReport] = useState<IAttendanceReportData | null>(null);

  const sortedGroups = useMemo(() => {
    const raw = report?.summary?.byKidGroup || (report as any)?.statistics?.byKidGroup || [];
    return sortKidGroupsByAge(raw, report?.attendees);
  }, [report]);

  const availableMeetings = useMemo(() => {
    const byCampus = (meetings as any).meetingsByCampus?.[selectedCampusId];
    if (byCampus && byCampus.length > 0) {
      return byCampus;
    }
    return meetings.data.filter((m) => !m.churchId || m.churchId === selectedCampusId);
  }, [meetings, selectedCampusId]);

  const selectedMeetingObj = useMemo(() => {
    return (
      availableMeetings.find((m: any) => m.id === selectedMeetingId) ||
      (meetings.current?.id === selectedMeetingId ? meetings.current : undefined)
    );
  }, [availableMeetings, meetings.current, selectedMeetingId]);

  const allowedDaysOfWeek = useMemo(() => {
    if (selectedMeetingObj?.day === undefined || selectedMeetingObj?.day === null) return undefined;
    if (typeof selectedMeetingObj.day === 'number') {
      return [selectedMeetingObj.day];
    }
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
      if (initialMeeting?.day !== undefined && initialMeeting?.day !== null) {
        const dayKey = String(initialMeeting.day).toUpperCase().trim();
        const targetDayNum = typeof initialMeeting.day === 'number' ? initialMeeting.day : DAYS_TO_NUM[dayKey];
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

  // Auto-select valid meeting when availableMeetings are loaded or campus changes
  useEffect(() => {
    if (!open || !selectedCampusId) return;
    if (availableMeetings.length > 0) {
      const exists = availableMeetings.some((m: any) => m.id === selectedMeetingId);
      if (!exists) {
        const preferred =
          (meetings.current && availableMeetings.find((m: any) => m.id === meetings.current?.id)) ||
          availableMeetings[0];
        if (preferred) {
          handleMeetingChange(preferred.id);
        }
      }
    }
  }, [open, selectedCampusId, availableMeetings, selectedMeetingId, meetings.current]);

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

    const campusMeetings = (meetings as any).meetingsByCampus?.[campusId];
    if (campusMeetings && campusMeetings.length > 0) {
      handleMeetingChange(campusMeetings[0].id);
    }
  };

  const handleMeetingChange = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setReport(null);

    const targetMeeting =
      availableMeetings.find((m: any) => m.id === meetingId) ||
      meetings.data.find((m) => m.id === meetingId) ||
      (meetings.current?.id === meetingId ? meetings.current : undefined);

    if (targetMeeting?.day !== undefined && targetMeeting?.day !== null) {
      const dayKey = String(targetMeeting.day).toUpperCase().trim();
      const targetDayNum = typeof targetMeeting.day === 'number' ? targetMeeting.day : DAYS_TO_NUM[dayKey];
      if (targetDayNum !== undefined) {
        let d = dayjs(todayStr);
        while (d.day() !== targetDayNum) {
          d = d.subtract(1, 'day');
        }
        setSelectedDate(d.format('YYYY-MM-DD'));
      }
    }
  };

  /**
   * Fetches attendance report details from /report/kid-church-meeting/attendance-detail
   * and saves them in local state for both on-screen display and subsequent PDF export.
   *
   * @returns {Promise<void>}
   */
  const handleGenerateReport = async () => {
    if (!selectedCampusId || !selectedMeetingId || !selectedDate) {
      toast.error('Por favor selecciona sede, servicio y fecha.');
      return;
    }

    setIsLoading(true);
    setReport(null);

    try {
      const campusObj = campuses.data.find((c) => c.id === selectedCampusId);
      const detailReport = await getAttendanceReportDetail({
        churchMeetingId: selectedMeetingId,
        date: selectedDate,
        token,
        campusName: campusObj?.name,
        meetingName: selectedMeetingObj?.name,
        meetingDay: selectedMeetingObj?.day ? getTranslatedDay(selectedMeetingObj.day) : undefined,
      });

      if (!detailReport || (!detailReport.summary && (!detailReport.attendees || detailReport.attendees.length === 0))) {
        toast.info(t('report.toast_no_data'));
        return;
      }

      setReport(detailReport);
      toast.success(t('report.toast_success'));
    } catch (err: any) {
      console.error('Error generating report', err);
      toast.error(err?.response?.data?.message || t('report.toast_error'));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generates and downloads the official service attendance PDF report using the currently stored report state without refetching from the API.
   *
   * @returns {void}
   */
  const handleDownloadPdf = () => {
    if (!report) {
      toast.error(t('report.toast_pdf_no_data'));
      return;
    }

    setIsDownloading(true);
    try {
      generateKidAttendancePdf(report);
      toast.success(t('report.toast_pdf_success'));
    } catch (err) {
      console.error('Error generating report PDF', err);
      toast.error(t('report.toast_pdf_error'));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      icon={<FileText size={18} className="text-primary shrink-0" />}
      title={t('report.title', { module: kidsModuleName })}
      bodyClassName="p-4 flex flex-col gap-4 pb-12"
    >
            {/* Filter Form Card */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3.5">
              {/* Sede */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  <MapPin size={15} className="text-primary" /> {campusTerm}
                </label>
                <div className="relative">
                  <select
                    className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-2.5 px-3.5 focus:border-primary focus:ring-0 transition-colors outline-none text-sm shadow-sm appearance-none font-medium"
                    value={selectedCampusId}
                    onChange={(e) => handleCampusChange(e.target.value)}
                  >
                    <option value="" disabled>{t('report.select_campus', { campus: campusTerm.toLowerCase() })}</option>
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
                  <CalendarClock size={15} className="text-primary" /> {meetingTerm}
                </label>
                <div className="relative">
                  <select
                    className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-2.5 px-3.5 focus:border-primary focus:ring-0 transition-colors outline-none text-sm shadow-sm appearance-none font-medium disabled:bg-gray-50 disabled:text-gray-400"
                    value={selectedMeetingId}
                    onChange={(e) => handleMeetingChange(e.target.value)}
                    disabled={!selectedCampusId || (meetings.loading && availableMeetings.length === 0)}
                  >
                    <option value="" disabled>{t('report.select_meeting', { meeting: meetingTerm.toLowerCase() })}</option>
                    {availableMeetings.map((meeting: any) => (
                      <option key={meeting.id} value={meeting.id}>{meeting.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    {meetings.loading && availableMeetings.length === 0 ? <Loader2 size={16} className="animate-spin" /> : <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>}
                  </div>
                </div>
              </div>

              {/* Fecha */}
              <div>
                <DateCalendarPicker
                  label={t('report.meeting_date_label', { meeting: meetingTerm.toLowerCase() })}
                  value={selectedDate}
                  minDate={minDateStr}
                  maxDate={todayStr}
                  allowedDaysOfWeek={allowedDaysOfWeek}
                  disabled={!selectedMeetingId}
                  onChange={(date) => {
                    setSelectedDate(date);
                    setReport(null);
                  }}
                  helpText={
                    selectedMeetingObj?.day
                      ? t('report.meeting_date_help', { meeting: meetingTerm.toLowerCase(), day: getTranslatedDay(selectedMeetingObj.day) })
                      : t('report.meeting_date_help_empty', { meeting: meetingTerm.toLowerCase() })
                  }
                />
              </div>

              <Button
                onClick={handleGenerateReport}
                block
                variant="primary"
                loading={isLoading}
                loadingText={t('report.generating')}
                disabled={!selectedCampusId || !selectedMeetingId || !selectedDate || isLoading}
                className="mt-1"
              >
                {t('report.generate_button')}
              </Button>
            </div>

            {/* Results Section */}
            {report && (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* General Totals */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Users size={16} className="text-primary" /> {t('report.general_totals')}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-primary/10 border border-primary/20 p-3.5 rounded-xl text-center">
                      <span className="text-xs font-semibold text-primary block mb-1">{t('report.total_registered')}</span>
                      <span className="text-2xl font-black text-primary">
                        {report.summary?.totalKids ?? (report as any).totalKids ?? report.attendees?.length ?? 0}
                      </span>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-center">
                      <span className="text-xs font-semibold text-amber-800 block mb-1 flex items-center justify-center gap-1">
                        <Sparkles size={13} /> {t('report.total_new')}
                      </span>
                      <span className="text-2xl font-black text-amber-900">
                        {report.summary?.totalNewKids ?? (report as any).totalNewKids ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Classrooms Breakdown */}
                {sortedGroups.length > 0 && (
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
                      {t('report.classrooms_totals')}
                    </h3>
                    <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                      {sortedGroups.map((group: any) => {
                        const groupName = group.groupName || group.name || 'Salón';
                        return (
                          <div key={group.groupId || groupName} className="flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50">
                            <span className="text-sm font-semibold text-gray-700">{groupName}</span>
                            <span className="text-sm font-black text-primary px-2.5 py-0.5 bg-primary/10 rounded-full">
                              {group.count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Gender Breakdown */}
                {((report.summary?.byGender && report.summary.byGender.length > 0) ||
                  ((report as any).statistics?.byGender && (report as any).statistics.byGender.length > 0)) && (
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
                      {t('report.gender_totals')}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-center">
                        <span className="text-xs font-semibold text-blue-700 block">{t('report.gender_male')}</span>
                        <span className="text-xl font-black text-blue-900 mt-1 block">
                          {(report.summary?.byGender || (report as any).statistics?.byGender || []).find(
                            (g: any) => g.gender === 'M' || g.name === 'M' || (g.label && g.label.toLowerCase().includes('masc'))
                          )?.count ?? 0}
                        </span>
                      </div>

                      <div className="bg-pink-50 border border-pink-200 p-3 rounded-xl text-center">
                        <span className="text-xs font-semibold text-pink-700 block">{t('report.gender_female')}</span>
                        <span className="text-xl font-black text-pink-900 mt-1 block">
                          {(report.summary?.byGender || (report as any).statistics?.byGender || []).find(
                            (g: any) => g.gender === 'F' || g.name === 'F' || (g.label && g.label.toLowerCase().includes('fem'))
                          )?.count ?? 0}
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
                  loadingText={t('report.downloading_pdf')}
                  disabled={isDownloading}
                  className="flex items-center justify-center gap-2 shadow-md"
                >
                  <Download size={18} /> {t('report.download_pdf')}
                </Button>
              </div>
            )}
    </AppDrawer>
  );
};

export default KidChurchReportDrawer;
