import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Search,
  Users,
  CheckCircle2,
  Clock,
  LogOut,
  DoorOpen,
  Filter,
  RefreshCw,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import { FaWhatsapp, FaChild, FaChildDress } from 'react-icons/fa6';
import { toast } from 'sonner';
import clsx from 'clsx';
import dayjs from 'dayjs';

import PageHeader from '@/components/ui/PageHeader';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import { APP_ROUTES } from '@/config/routes';
import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';
import { useKidChurchLiveSync } from '@/libs/hooks/useKidChurchLiveSync';
import {
  useGetKidLiveTrackingQuery,
  useConfirmKidEntryMutation,
  useConfirmKidCheckoutMutation,
  useGetKidGroupsQuery,
} from '@/libs/state/redux/api/kidChurchApi';
import {
  KidAttendanceFlowModeEnum,
  KidAttendanceStatusEnum,
  IKidLiveTrackingItem,
} from '@/libs/models';
import { capitalizeWords } from '@/libs/utils/text';
import { sortKidGroupsByAge } from '@/libs/utils/kidGroup';
import { KidCheckoutModal } from './components/KidCheckoutModal';

type TabStatusFilter = 'ALL' | KidAttendanceStatusEnum;

/**
 * Attendance Tracking View for Kids Ministry.
 * Allows coordinators and registration volunteers to track child entry and checkout in real time.
 *
 * @returns {JSX.Element}
 */
const AttendanceTrackingView: React.FC = () => {
  const { t } = useTranslation(['kidRegistration', 'common']);
  const navigate = useNavigate();
  const { currentMeeting, currentCampus, isConfigured } = useChurchMeetingStatus();

  const flowMode = currentCampus?.kidAttendanceFlowMode || KidAttendanceFlowModeEnum.ONLY_CHECK_IN;
  const isOnlyCheckIn = flowMode === KidAttendanceFlowModeEnum.ONLY_CHECK_IN;

  const [activeTab, setActiveTab] = useState<TabStatusFilter>(() => {
    if (flowMode === KidAttendanceFlowModeEnum.DIRECT_ENTRY_AND_CHECK_OUT) {
      return KidAttendanceStatusEnum.IN_AREA;
    }
    return KidAttendanceStatusEnum.CHECKED_IN;
  });

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [checkoutItem, setCheckoutItem] = useState<IKidLiveTrackingItem | null>(null);
  const [openCheckoutModal, setOpenCheckoutModal] = useState(false);

  const todayIso = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

  // RTK Query: Live tracking data
  const {
    data: trackingData,
    isLoading: loadingTracking,
    isFetching: fetchingTracking,
    refetch,
  } = useGetKidLiveTrackingQuery(
    {
      churchMeetingId: currentMeeting?.id || '',
      date: todayIso,
    },
    {
      skip: !currentMeeting?.id || isOnlyCheckIn,
    },
  );

  // RTK Query: Kid groups for classroom filter
  const { data: kidGroups = [] } = useGetKidGroupsQuery();
  const sortedKidGroups = useMemo(() => sortKidGroupsByAge(kidGroups), [kidGroups]);

  // Mutations
  const [confirmEntry, { isLoading: confirmingEntry }] = useConfirmKidEntryMutation();
  const [confirmCheckout, { isLoading: confirmingCheckout }] = useConfirmKidCheckoutMutation();
  const [activeActionKidId, setActiveActionKidId] = useState<string | null>(null);

  // Real-time live sync
  useKidChurchLiveSync({
    churchMeetingId: currentMeeting?.id,
    enabled: Boolean(currentMeeting?.id) && !isOnlyCheckIn,
  });

  const handleEntryConfirm = async (item: IKidLiveTrackingItem) => {
    setActiveActionKidId(item.id);
    try {
      await confirmEntry(item.id).unwrap();
      toast.success(t('kidRegistration:attendance_tracking.entry_success'));
    } catch (error: any) {
      toast.error(error?.message || 'Error al confirmar ingreso');
    } finally {
      setActiveActionKidId(null);
    }
  };

  const handleOpenCheckout = (item: IKidLiveTrackingItem) => {
    setCheckoutItem(item);
    setOpenCheckoutModal(true);
  };

  const handleCheckoutSubmit = async (payload: { id: string; guardianId?: string; observation?: string }) => {
    try {
      await confirmCheckout(payload).unwrap();
      toast.success(t('kidRegistration:attendance_tracking.checkout_modal.success_message'));
    } catch (error: any) {
      toast.error(error?.message || 'Error al registrar salida');
      throw error;
    }
  };

  const summary = trackingData?.summary || {
    totalRegistered: 0,
    pendingEntry: 0,
    inArea: 0,
    checkedOut: 0,
  };

  const filteredItems = useMemo(() => {
    let list = trackingData?.data || [];
    if (activeTab !== 'ALL') {
      list = list.filter((i) => i.attendanceStatus === activeTab);
    }
    if (selectedGroupId) {
      list = list.filter((i) => i.groupId === selectedGroupId);
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.kidFullName.toLowerCase().includes(q) ||
          i.guardianFullName.toLowerCase().includes(q) ||
          (i.faithForgeId && i.faithForgeId.toString().includes(q)),
      );
    }
    return list;
  }, [trackingData?.data, activeTab, selectedGroupId, searchText]);

  // If campus is in ONLY_CHECK_IN mode
  if (isOnlyCheckIn) {
    return (
      <div className="flex flex-col min-h-full flex-1 bg-gray-50/50">
        <PageHeader
          title={t('kidRegistration:attendance_tracking.title')}
          onBack={() => navigate(APP_ROUTES.kidRegistration.root)}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mb-4 shadow-xs">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-base font-bold text-gray-800 mb-2">
            {t('kidRegistration:attendance_tracking.mode_not_enabled_title')}
          </h2>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            {t('kidRegistration:attendance_tracking.mode_not_enabled_desc')}
          </p>
          <button
            type="button"
            onClick={() => navigate(APP_ROUTES.kidRegistration.root)}
            className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 transition-all cursor-pointer"
          >
            {t('kidRegistration:attendance_tracking.btn_back_to_dashboard')}
          </button>
        </div>
      </div>
    );
  }

  const loading = loadingTracking && filteredItems.length === 0;

  // Available tabs based on flow mode
  const showPendingTab = flowMode === KidAttendanceFlowModeEnum.CHECK_IN_AND_ENTRY || flowMode === KidAttendanceFlowModeEnum.FULL_FLOW;
  const showCheckoutTab = flowMode === KidAttendanceFlowModeEnum.DIRECT_ENTRY_AND_CHECK_OUT || flowMode === KidAttendanceFlowModeEnum.FULL_FLOW;

  return (
    <div className="flex flex-col min-h-full flex-1 bg-gray-50/40">
      <PageHeader
        title={t('kidRegistration:attendance_tracking.title')}
        onBack={() => navigate(APP_ROUTES.kidRegistration.root)}
        rightAction={
          <button
            type="button"
            onClick={() => refetch()}
            disabled={fetchingTracking}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all text-primary-foreground cursor-pointer"
            title="Actualizar"
          >
            <RefreshCw size={17} className={clsx(fetchingTracking && 'animate-spin')} />
          </button>
        }
      />

      <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto w-full flex flex-col gap-3 flex-1 pb-24">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {t('kidRegistration:attendance_tracking.summary.total')}
            </span>
            <p className="text-xl sm:text-2xl font-black text-gray-800 mt-0.5">
              {summary.totalRegistered}
            </p>
          </div>

          {showPendingTab && (
            <div
              onClick={() => setActiveTab(KidAttendanceStatusEnum.CHECKED_IN)}
              className={clsx(
                'p-3 bg-white rounded-2xl border transition-all cursor-pointer shadow-2xs',
                activeTab === KidAttendanceStatusEnum.CHECKED_IN
                  ? 'border-amber-400 ring-2 ring-amber-100'
                  : 'border-gray-100 hover:border-amber-200',
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                {t('kidRegistration:attendance_tracking.summary.pending')}
              </span>
              <p className="text-xl sm:text-2xl font-black text-amber-700 mt-0.5">
                {summary.pendingEntry}
              </p>
            </div>
          )}

          <div
            onClick={() => setActiveTab(KidAttendanceStatusEnum.IN_AREA)}
            className={clsx(
              'p-3 bg-white rounded-2xl border transition-all cursor-pointer shadow-2xs',
              activeTab === KidAttendanceStatusEnum.IN_AREA
                ? 'border-emerald-400 ring-2 ring-emerald-100'
                : 'border-gray-100 hover:border-emerald-200',
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              {t('kidRegistration:attendance_tracking.summary.in_area')}
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
              {summary.inArea}
            </p>
          </div>

          {showCheckoutTab && (
            <div
              onClick={() => setActiveTab(KidAttendanceStatusEnum.CHECKED_OUT)}
              className={clsx(
                'p-3 bg-white rounded-2xl border transition-all cursor-pointer shadow-2xs',
                activeTab === KidAttendanceStatusEnum.CHECKED_OUT
                  ? 'border-blue-400 ring-2 ring-blue-100'
                  : 'border-gray-100 hover:border-blue-200',
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                {t('kidRegistration:attendance_tracking.summary.checked_out')}
              </span>
              <p className="text-xl sm:text-2xl font-black text-blue-700 mt-0.5">
                {summary.checkedOut}
              </p>
            </div>
          )}
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/90 rounded-2xl overflow-x-auto no-scrollbar">
          {showPendingTab && (
            <button
              type="button"
              onClick={() => setActiveTab(KidAttendanceStatusEnum.CHECKED_IN)}
              className={clsx(
                'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5',
                activeTab === KidAttendanceStatusEnum.CHECKED_IN
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800',
              )}
            >
              <span>{t('kidRegistration:attendance_tracking.tabs.pending_entry')}</span>
              {summary.pendingEntry > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-amber-100 text-amber-800 rounded-full">
                  {summary.pendingEntry}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab(KidAttendanceStatusEnum.IN_AREA)}
            className={clsx(
              'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5',
              activeTab === KidAttendanceStatusEnum.IN_AREA
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800',
            )}
          >
            <span>{t('kidRegistration:attendance_tracking.tabs.in_area')}</span>
            {summary.inArea > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 rounded-full">
                {summary.inArea}
              </span>
            )}
          </button>

          {showCheckoutTab && (
            <button
              type="button"
              onClick={() => setActiveTab(KidAttendanceStatusEnum.CHECKED_OUT)}
              className={clsx(
                'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5',
                activeTab === KidAttendanceStatusEnum.CHECKED_OUT
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800',
              )}
            >
              <span>{t('kidRegistration:attendance_tracking.tabs.checked_out')}</span>
              {summary.checkedOut > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-blue-100 text-blue-800 rounded-full">
                  {summary.checkedOut}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={clsx(
              'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer',
              activeTab === 'ALL'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800',
            )}
          >
            {t('kidRegistration:attendance_tracking.tabs.all')}
          </button>
        </div>

        {/* Classroom Filter Pills */}
        {sortedKidGroups.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setSelectedGroupId('')}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer',
                selectedGroupId === ''
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
              )}
            >
              {t('kidRegistration:attendance_tracking.filter_all_groups')}
            </button>
            {sortedKidGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroupId(selectedGroupId === group.id ? '' : group.id)}
                className={clsx(
                  'px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer',
                  selectedGroupId === group.id
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
                )}
              >
                {group.name}
              </button>
            ))}
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={t('kidRegistration:attendance_tracking.search_placeholder')}
            className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 bg-white rounded-2xl border border-gray-200 shadow-2xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Kids List */}
        <PullToRefresh onRefresh={() => refetch()} disabled={loading}>
          <div className="flex flex-col gap-2.5">
            {loading && <CellListSkeleton count={6} />}

            {!loading && filteredItems.length === 0 && (
              <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400">
                <Users size={36} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm font-bold text-gray-700">
                  {activeTab === KidAttendanceStatusEnum.CHECKED_IN
                    ? t('kidRegistration:attendance_tracking.empty.pending_title')
                    : activeTab === KidAttendanceStatusEnum.IN_AREA
                    ? t('kidRegistration:attendance_tracking.empty.in_area_title')
                    : activeTab === KidAttendanceStatusEnum.CHECKED_OUT
                    ? t('kidRegistration:attendance_tracking.empty.checked_out_title')
                    : t('kidRegistration:attendance_tracking.empty.all_title')}
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  {activeTab === KidAttendanceStatusEnum.CHECKED_IN
                    ? t('kidRegistration:attendance_tracking.empty.pending_desc')
                    : activeTab === KidAttendanceStatusEnum.IN_AREA
                    ? t('kidRegistration:attendance_tracking.empty.in_area_desc')
                    : activeTab === KidAttendanceStatusEnum.CHECKED_OUT
                    ? t('kidRegistration:attendance_tracking.empty.checked_out_desc')
                    : t('kidRegistration:attendance_tracking.empty.all_desc')}
                </p>
              </div>
            )}

            {!loading &&
              filteredItems.map((item) => {
                const isPending = item.attendanceStatus === KidAttendanceStatusEnum.CHECKED_IN;
                const isInArea = item.attendanceStatus === KidAttendanceStatusEnum.IN_AREA;
                const isCheckedOut = item.attendanceStatus === KidAttendanceStatusEnum.CHECKED_OUT;
                const cleanPhone = (item.guardianPhone || '').replace(/\D/g, '');

                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white rounded-2xl border border-gray-100 shadow-xs flex flex-col gap-3 transition-all hover:border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                        {item.photoUrl ? (
                          <img
                            src={item.photoUrl}
                            alt={item.kidFullName}
                            className="w-full h-full object-cover"
                          />
                        ) : item.gender === 'F' ? (
                          <FaChildDress className="text-pink-500 text-lg" />
                        ) : (
                          <FaChild className="text-blue-500 text-lg" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                            {capitalizeWords(item.kidFullName)}
                          </h3>
                          {item.faithForgeId && (
                            <span className="text-[10px] font-bold text-gray-400 shrink-0">
                              #{item.faithForgeId}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                          {item.groupName} • {item.age ? `${Math.floor(item.age)} años` : ''}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={clsx(
                          'px-2.5 py-1 text-[10px] font-extrabold rounded-full shrink-0',
                          isPending && 'bg-amber-100 text-amber-800 border border-amber-200',
                          isInArea && 'bg-emerald-100 text-emerald-800 border border-emerald-200',
                          isCheckedOut && 'bg-blue-100 text-blue-800 border border-blue-200',
                        )}
                      >
                        {isPending && t('kidRegistration:attendance_tracking.status.checked_in')}
                        {isInArea && t('kidRegistration:attendance_tracking.status.in_area')}
                        {isCheckedOut && t('kidRegistration:attendance_tracking.status.checked_out')}
                      </span>
                    </div>

                    {/* Guardian & Timestamps Row */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100/80 text-[11px] text-gray-500">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold text-gray-700 truncate">
                          {capitalizeWords(item.guardianFullName)}
                        </span>
                        {cleanPhone && (
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={`tel:${cleanPhone}`}
                              className="p-1 rounded-full text-gray-400 hover:text-gray-700 transition-colors"
                              title="Llamar"
                            >
                              <Phone size={13} />
                            </a>
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-full text-emerald-600 hover:text-emerald-700 transition-colors"
                              title="WhatsApp"
                            >
                              <FaWhatsapp size={13} />
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0 text-gray-400">
                        <Clock size={12} />
                        <span>
                          {item.enteredAt
                            ? dayjs(item.enteredAt).format('h:mm A')
                            : dayjs(item.registeredAt).format('h:mm A')}
                        </span>
                      </div>
                    </div>

                    {/* Observations if any */}
                    {item.observation && (
                      <p className="text-[11px] text-amber-800 bg-amber-50/70 px-2.5 py-1 rounded-xl border border-amber-100">
                        {item.observation}
                      </p>
                    )}

                    {/* Checkout Details if checked out */}
                    {isCheckedOut && item.checkedOutGuardianName && (
                      <p className="text-[11px] text-blue-800 bg-blue-50/70 px-2.5 py-1 rounded-xl border border-blue-100">
                        Retirado por: <strong>{capitalizeWords(item.checkedOutGuardianName)}</strong>
                        {item.checkOutObservation ? ` (${item.checkOutObservation})` : ''}
                      </p>
                    )}

                    {/* Action Buttons */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleEntryConfirm(item)}
                        disabled={confirmingEntry && activeActionKidId === item.id}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-[0.99] transition-all cursor-pointer"
                      >
                        <DoorOpen size={15} />
                        <span>{t('kidRegistration:attendance_tracking.actions.confirm_entry')}</span>
                      </button>
                    )}

                    {isInArea && showCheckoutTab && (
                      <button
                        type="button"
                        onClick={() => handleOpenCheckout(item)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-[0.99] transition-all cursor-pointer"
                      >
                        <LogOut size={15} />
                        <span>{t('kidRegistration:attendance_tracking.actions.confirm_checkout')}</span>
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </PullToRefresh>
      </div>

      {/* Checkout Guardian Verification Modal */}
      <KidCheckoutModal
        open={openCheckoutModal}
        onOpenChange={setOpenCheckoutModal}
        item={checkoutItem}
        onConfirmCheckout={handleCheckoutSubmit}
        loading={confirmingCheckout}
      />
    </div>
  );
};

export default AttendanceTrackingView;
