import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarClock, Sparkles, Plus } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import { useGetChurchCampusesQuery } from '@/libs/state/redux/api/churchApi';
import { IChurchMeeting } from '@/libs/models';
import { APP_ROUTES } from '@/config/routes';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import ChurchMeetingModal from './components/ChurchMeetingModal';
import ChurchScheduleCalendar from '@/components/calendar/ChurchScheduleCalendar';
import { useChurchTerm } from '@/libs/hooks/useTerm';

/**
 * Main view for managing church meetings across campuses at /admin/church-meetings.
 * Desktop-First calendar management with direct scheduling, instance operations, and campus filtering.
 *
 * @returns {JSX.Element} Rendered view.
 */
const ChurchMeetingsView: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const campusTerm = useChurchTerm('campus');
  const meetingTerm = useChurchTerm('meeting');
  const meetingsTerm = useChurchTerm('meetings');

  const queryCampusId = searchParams.get('campusId');
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [meetingToEdit, setMeetingToEdit] = useState<IChurchMeeting | null>(null);

  // RTK Query: fetch campuses
  const { data: campusesData = [], isLoading: loadingCampuses } = useGetChurchCampusesQuery();

  // Sync selected campus with query params or first available campus
  useEffect(() => {
    if (campusesData.length === 0) return;

    if (queryCampusId && campusesData.some((c) => c.id === queryCampusId)) {
      setSelectedCampusId(queryCampusId);
    } else if (!selectedCampusId) {
      setSelectedCampusId(campusesData[0].id);
      setSearchParams({ campusId: campusesData[0].id }, { replace: true });
    }
  }, [campusesData, queryCampusId, selectedCampusId, setSearchParams]);

  /**
   * Handles campus selection update and query param synchronization.
   *
   * @param {string} newId - Target campus ID.
   */
  const handleSelectCampus = (newId: string) => {
    setSelectedCampusId(newId);
    setSearchParams({ campusId: newId });
  };

  const campusOptions = useMemo(() => {
    return campusesData.map((campus) => ({
      id: campus.id,
      name: campus.name,
    }));
  }, [campusesData]);

  return (
    <div className="min-h-full flex-1 w-full bg-slate-50/60 pb-28">
      {/* Mobile-only header with back button */}
      <PageHeader
        className="lg:hidden"
        title={t('admin:meetings.header_title', { meetings: meetingsTerm })}
        onBack={() => navigate(APP_ROUTES.admin.root)}
        rightAction={
          selectedCampusId ? (
            <button
              type="button"
              onClick={() => {
                setMeetingToEdit(null);
                setModalOpen(true);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all shadow-xs cursor-pointer"
              title={t('admin:meetings.new_meeting_btn', { meeting: meetingTerm })}
            >
              <Plus size={18} />
            </button>
          ) : undefined
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-20 sm:pb-32 flex flex-col gap-6">
        {/* Header Summary Banner (Desktop-First) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 lg:p-7 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <CalendarClock size={24} className="lg:w-7 lg:h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
                <Sparkles size={13} />
                <span>{t('admin:meetings.info_badge', { meetings: meetingsTerm })}</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight truncate">
                {t('admin:meetings.availability_title', { campus: campusTerm })}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-1">
                {t('admin:meetings.availability_subtitle', { meetings: meetingsTerm.toLowerCase() })}
              </p>
            </div>
          </div>

          {/* Integrated Campus Selector & Desktop Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <div className="w-full sm:w-64">
              <Select
                value={selectedCampusId}
                onChange={(e) => handleSelectCampus(e.target.value)}
                disabled={loadingCampuses}
              >
                <option value="" disabled>
                  {t('admin:meetings.select_campus_placeholder', { campus: campusTerm.toLowerCase() })}
                </option>
                {campusOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </Select>
            </div>

            {selectedCampusId && (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setMeetingToEdit(null);
                  setModalOpen(true);
                }}
                className="hidden sm:inline-flex items-center gap-2 text-sm shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Plus size={16} />
                <span>{t('admin:meetings.new_meeting_btn', { meeting: meetingTerm })}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {loadingCampuses ? (
          <CellListSkeleton count={3} />
        ) : selectedCampusId ? (
          <ChurchScheduleCalendar churchCampusId={selectedCampusId} />
        ) : (
          <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-xs text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
              <CalendarClock size={28} />
            </div>
            <h3 className="font-bold text-slate-800 text-base sm:text-lg mt-1">
              {t('admin:meetings.no_meetings_title', { meetings: meetingsTerm.toLowerCase() })}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              {t('admin:meetings.select_campus_placeholder', { campus: campusTerm.toLowerCase() })}
            </p>
          </div>
        )}
      </div>

      {/* Meeting Modal for Create and Edit from Header Button */}
      <ChurchMeetingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        meetingToEdit={meetingToEdit}
        churchCampusId={selectedCampusId}
      />
    </div>
  );
};

export default ChurchMeetingsView;
