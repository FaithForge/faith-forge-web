import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import { APP_ROUTES } from "@/config/routes";
import Cell from '@/components/ui/Cell';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetKids, GetMoreKids } from '@/libs/state/redux/thunks/kid-church/kid.thunk';
import { updateCurrentKid } from '@/libs/state/redux/slices/kid-church/kid.slice';
import { Loader2, SearchX, RotateCcw, Plus, Lightbulb, ChevronDown, DoorOpen, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import { capitalizeWords } from '@/libs/utils/text';
import { isDateToday } from '@/libs/utils/date';
import { KID_AGE_COPY, isKidOverage } from '@/libs/common-types/constants';
import { KidAttendanceFlowModeEnum } from '@/libs/models';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';

import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';
import { useSearchScroll } from '@/libs/context/SearchScrollContext';
import { useInfiniteScroll } from '@/libs/hooks/useInfiniteScroll';
import EndOfListFunnyBadge from '@/components/ui/EndOfListFunnyBadge';
import { useTranslation } from 'react-i18next';

const RegistrationDashboard = () => {
  const { t } = useTranslation(['kidRegistration', 'common']);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchText, setSearchText] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const { setSearchAvailable, registerSearchFocusHandler } = useSearchScroll();

  const { data: kids, loading, currentPage, totalPages, needsRefresh } = useAppSelector((state) => state.kidSlice);
  
  const {
    isConfigured,
    isMeetingValid,
    meetingErrorMsg,
    shouldBlockKids,
    isAdmin,
    currentMeeting,
    currentPrinter,
    currentCampus,
  } = useChurchMeetingStatus();

  const hasInitializedRef = useRef(false);
  const prevMeetingIdRef = useRef<string | undefined>(currentMeeting?.id);
  const prevSearchTextRef = useRef<string>('');

  // Search logic with debounce and automatic refresh on mutations
  useEffect(() => {
    if (!isConfigured || shouldBlockKids) return;

    const isMeetingChanged = prevMeetingIdRef.current !== undefined && prevMeetingIdRef.current !== currentMeeting?.id;
    const isSearchChanged = searchText !== prevSearchTextRef.current;

    // If we already have list in Redux and no data changes (needsRefresh === false),
    // on initial mount without search or meeting change:
    // KEEP the list intact without re-fetching from API
    if (!hasInitializedRef.current && kids.length > 0 && !needsRefresh && !isSearchChanged && !isMeetingChanged) {
      hasInitializedRef.current = true;
      prevMeetingIdRef.current = currentMeeting?.id;
      prevSearchTextRef.current = searchText;
      return;
    }

    // If already initialized and search, meeting, and data did not change:
    if (hasInitializedRef.current && !needsRefresh && !isSearchChanged && !isMeetingChanged) {
      return;
    }

    hasInitializedRef.current = true;
    prevMeetingIdRef.current = currentMeeting?.id;
    prevSearchTextRef.current = searchText;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const delay = isSearchChanged && searchText.trim().length > 0 ? 400 : 0;

    if (delay === 0) {
      dispatch(GetKids({ findText: searchText }));
    } else {
      timeoutRef.current = setTimeout(() => {
        dispatch(GetKids({ findText: searchText }));
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [searchText, isConfigured, shouldBlockKids, dispatch, currentMeeting?.id, needsRefresh]);

  // Listen for BottomNav "Inicio" tap to reset view, clear search and refresh list
  useEffect(() => {
    const handleReset = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      prevSearchTextRef.current = '';
      setSearchText('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });

      if (isConfigured && !shouldBlockKids) {
        dispatch(GetKids({ findText: '' }));
      }
    };

    window.addEventListener('reset-registration-dashboard', handleReset);
    return () => {
      window.removeEventListener('reset-registration-dashboard', handleReset);
    };
  }, [dispatch, isConfigured, shouldBlockKids]);

  /**
   * Clears the search text and immediately fetches the full kid list without debounce delay.
   */
  const handleClearSearch = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    prevSearchTextRef.current = '';
    setSearchText('');
    dispatch(GetKids({ findText: '' }));
  };

  const handleRefreshKids = async () => {
    if (!isConfigured || shouldBlockKids) return;
    try {
      await dispatch(GetKids({ findText: searchText })).unwrap();
    } catch {
      // ignore
    }
  };

  const hasMore = currentPage < totalPages;

  const handleLoadMore = React.useCallback(async () => {
    if (!isConfigured || shouldBlockKids) return;
    try {
      await dispatch(GetMoreKids({ findText: searchText })).unwrap();
    } catch (e) {
      console.error(e);
    }
  }, [isConfigured, shouldBlockKids, dispatch, searchText]);

  const { sentinelRef, loadingMore, triggerLoadMore } = useInfiniteScroll({
    onLoadMore: handleLoadMore,
    hasMore,
    isLoading: loading,
    threshold: 250,
    cooldownMs: 800,
  });

  // Register search availability and focus handler with SearchScrollContext
  useEffect(() => {
    setSearchAvailable(true);
    registerSearchFocusHandler(() => {
      searchInputRef.current?.focus();
    });

    return () => {
      setSearchAvailable(false);
      registerSearchFocusHandler(null);
    };
  }, [setSearchAvailable, registerSearchFocusHandler]);

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto w-full flex flex-col gap-3 min-h-full flex-1 pb-6">
      {/* Search Bar (scrolls with content, revealed as lupa in TopBar on scroll) */}
      <div className="py-1">
        <Input 
          ref={searchInputRef}
          icon="search" 
          placeholder={shouldBlockKids ? t('kidRegistration:dashboard.search_disabled') : t('kidRegistration:dashboard.search_placeholder')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onClear={handleClearSearch}
          wrapperClassName="mb-0"
          className={`border-0 shadow-sm text-base focus:ring-0 transition-colors ${
            shouldBlockKids || !isConfigured ? 'bg-gray-100 opacity-70 cursor-not-allowed text-gray-500' : 'bg-white'
          }`}
          disabled={!isConfigured || shouldBlockKids}
        />
      </div>

      {/* Configuration Warnings */}
      {!isConfigured && (
        <Alert 
          type="error"
          title={t('kidRegistration:dashboard.config_warning_title')}
          message={t('kidRegistration:dashboard.config_warning_message')}
        />
      )}

      {/* Servicio e Impresora Actual */}
      {isConfigured && currentPrinter && currentMeeting && (
        <Alert 
          type="info"
          title={t('kidRegistration:dashboard.printer_info', { printer: currentPrinter.name })}
          message={t('kidRegistration:dashboard.meeting_info', { meeting: currentMeeting.name, campus: currentCampus?.name || '' })}
          className="bg-cyan-100 text-cyan-800 border-cyan-200"
        />
      )}

      {/* Control de Asistencia Modular (Si la sede no es ONLY_CHECK_IN) */}
      {isConfigured &&
        currentCampus?.kidAttendanceFlowMode &&
        currentCampus.kidAttendanceFlowMode !== KidAttendanceFlowModeEnum.ONLY_CHECK_IN && (
          <div
            onClick={() => navigate(APP_ROUTES.kidRegistration.attendanceTracking)}
            className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <DoorOpen size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-emerald-950 truncate">
                  {t('kidRegistration:attendance_tracking.title')}
                </h4>
                <p className="text-[11px] text-emerald-700 truncate">
                  {t('kidRegistration:attendance_tracking.subtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold shrink-0 shadow-2xs hover:bg-emerald-700 transition-colors">
              <span>Abrir</span>
              <ChevronRight size={14} />
            </div>
          </div>
        )}

      {/* Error de horario de servicio */}
      {isConfigured && !isMeetingValid && (
        <Alert 
          type="error"
          message={meetingErrorMsg}
        />
      )}

      {/* Bloqueo Visual (Empty State) */}
      {shouldBlockKids && isConfigured && (
        <div className="flex flex-col items-center justify-center py-12 px-6 mt-2 text-center bg-gray-50/80 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" x2="16" y1="2" y2="6"/>
              <line x1="8" x2="8" y1="2" y2="6"/>
              <line x1="3" x2="21" y1="10" y2="10"/>
              <line x1="10" x2="14" y1="15" y2="19"/>
              <line x1="14" x2="10" y1="15" y2="19"/>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-1">{t('kidRegistration:dashboard.out_of_schedule_title')}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            {t('kidRegistration:dashboard.out_of_schedule_message')}
          </p>
        </div>
      )}

      {/* Lista de Niños */}
      {!shouldBlockKids && (
        <PullToRefresh onRefresh={handleRefreshKids} disabled={loading} className="w-full flex-1 flex flex-col">
          <div className="flex flex-col gap-2 mt-1 w-full flex-1">
            {loading && isConfigured && <CellListSkeleton count={7} />}
            
            {!loading && kids.length === 0 && isConfigured && (
              <div className="flex flex-col items-center justify-center py-8 px-5 mt-2 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-xs animate-in fade-in duration-200">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3 shadow-xs border border-amber-100">
                  <SearchX size={28} />
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-1">
                  {searchText ? t('kidRegistration:dashboard.no_kids_found_title') : t('kidRegistration:dashboard.directory_title')}
                </h3>
                <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                  {searchText ? (
                    <>
                      {t('kidRegistration:dashboard.no_results_search', { query: searchText })}
                    </>
                  ) : (
                    t('kidRegistration:dashboard.search_prompt')
                  )}
                </p>

                {/* Consejos de Búsqueda */}
                <div className="mt-3.5 p-3 bg-gray-50/90 rounded-xl border border-gray-200/80 text-left max-w-sm w-full">
                  <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5 mb-1.5">
                    <Lightbulb size={13} className="text-amber-500 shrink-0" />
                    {t('kidRegistration:dashboard.search_tips_title')}
                  </span>
                  <ul className="text-[11px] text-gray-600 space-y-1.5 list-disc list-inside">
                    <li>
                      {t('kidRegistration:dashboard.search_tip_abbreviate')}
                    </li>
                    <li>
                      {t('kidRegistration:dashboard.search_tip_firstname')}
                    </li>
                    <li>
                      {t('kidRegistration:dashboard.search_tip_lastname')}
                    </li>
                    <li>
                      {t('kidRegistration:dashboard.search_tip_code')}
                    </li>
                  </ul>
                </div>

                <p className="text-xs text-gray-500 max-w-sm mt-3 leading-relaxed">
                  {t('kidRegistration:dashboard.create_prompt')}
                </p>

                <div className="flex items-center gap-2 mt-3.5 flex-wrap justify-center">
                  {searchText && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-xl transition-all"
                    >
                      <RotateCcw size={14} />
                      <span>{t('kidRegistration:dashboard.btn_clear_search')}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(APP_ROUTES.kidRegistration.new)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 active:scale-95 rounded-xl transition-all shadow-xs"
                  >
                    <Plus size={14} />
                    <span>{t('kidRegistration:dashboard.btn_create_kid')}</span>
                  </button>
                </div>
              </div>
            )}

            {!loading && kids.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
                {kids.map((kid) => {
                  const isRegistered = !!kid.currentKidRegistration;
                  const overage = isKidOverage(kid);
                  const isBday = isDateToday(kid.birthday);

                  let subtitleText = t('kidRegistration:dashboard.code_label', { code: kid.faithForgeId || kid.id });
                  let showOverageStyle = false;

                  if (isRegistered) {
                    const timeStr = kid.currentKidRegistration?.date 
                      ? ` ${t('kidRegistration:dashboard.registered_at', { time: dayjs(kid.currentKidRegistration.date).format('h:mm:ss A') })}`
                      : '';
                    subtitleText = `${t('kidRegistration:dashboard.code_label', { code: kid.faithForgeId || kid.id })}${timeStr}`;
                  } else if (overage) {
                    subtitleText = KID_AGE_COPY.maxAgeDashboardSubtitle;
                    showOverageStyle = true;
                  }

                  const badgeElement = (
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      {isBday && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300 flex items-center gap-1 animate-pulse">
                          {t('kidRegistration:dashboard.badge_birthday')}
                        </span>
                      )}
                      {overage && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-800 rounded-full border border-red-200">
                          {KID_AGE_COPY.maxAgeBadge}
                        </span>
                      )}
                      {isRegistered && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                          {t('kidRegistration:dashboard.badge_registered')}
                        </span>
                      )}
                    </div>
                  );

                  return (
                    <Cell 
                      key={kid.id}
                      title={capitalizeWords(`${kid.firstName} ${kid.lastName}`)}
                      subtitle={subtitleText}
                      gender={kid.gender === 'F' ? 'F' : 'M'}
                      photoUrl={kid.photoUrl}
                      isRegistered={isRegistered}
                      isOverage={showOverageStyle}
                      badge={badgeElement}
                      onClick={() => {
                        if (isRegistered || !overage || isAdmin) {
                          dispatch(updateCurrentKid(kid));
                          navigate(APP_ROUTES.kidRegistration.checkIn(kid.id));
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Infinite Scroll Sentinel & Load More Spinner */}
            {!loading && kids.length > 0 && (
              <div ref={sentinelRef} className="py-4 flex flex-col items-center justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 py-2 px-4 bg-white rounded-full border border-gray-100 shadow-2xs text-xs font-semibold text-gray-500">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    <span>{t('kidRegistration:dashboard.loading_more')}</span>
                  </div>
                )}
                {!loadingMore && hasMore && (
                  <button
                    type="button"
                    onClick={() => triggerLoadMore()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-50 border border-gray-200/80 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <ChevronDown size={14} />
                    <span>{t('kidRegistration:dashboard.btn_load_more')}</span>
                  </button>
                )}
                {!loadingMore && !hasMore && (
                  <EndOfListFunnyBadge type="kids" />
                )}
              </div>
            )}

            {/* Safe spacer so end indicator sits comfortably above floating BottomNav */}
            <div className="h-20 sm:h-24 shrink-0 pointer-events-none" aria-hidden="true" />
          </div>
        </PullToRefresh>
      )}
      
    </div>
  );
};

export default RegistrationDashboard;
