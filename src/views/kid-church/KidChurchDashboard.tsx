import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Search, Users, AlertCircle, Sparkles, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import dayjs from 'dayjs';
import Cell from '@/components/ui/Cell';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import TagKidGroup from '@/components/ui/TagKidGroup';
import KidDetailsDrawer from '@/components/modal/KidDetailsDrawer';
import {
  useGetKidGroupsQuery,
  useGetKidGroupAttendanceQuery,
} from '@/libs/state/redux/api/kidChurchApi';
import { IKid, IKidGroup, UserGenderCode } from '@/libs/models';
import { capitalizeWords, parseEntitySearchParams } from '@/libs/utils/text';
import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';
import { useSearchScroll } from '@/libs/context/SearchScrollContext';
import { useKidsTerm } from '@/libs/hooks/useTerm';
import { useKidChurchLiveSync } from '@/libs/hooks/useKidChurchLiveSync';
import { sortKidGroupsByAge } from '@/libs/utils/kidGroup';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';

/**
 * Main dashboard for the kids ministry (Coordinators, Supervisors, Volunteers).
 * Displays live attendance statistics per classroom and registered kids for today's service
 * powered by RTK Query declarative caching and auto-revalidation.
 *
 * @returns {JSX.Element}
 */
const KidChurchDashboard: React.FC = () => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const { currentMeeting, currentCampus, isConfigured } = useChurchMeetingStatus();
  const kidsClassroomsName = useKidsTerm('classrooms');
  const kidsModuleName = useKidsTerm('module_alias');

  const [searchText, setSearchText] = useState('');
  const [selectedKidGroupId, setSelectedKidGroupId] = useState<string>('');
  const [selectedKid, setSelectedKid] = useState<IKid | undefined>(undefined);
  const [openKidDrawer, setOpenKidDrawer] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  // RTK Query: Classroom list with tag-based caching
  const {
    data: kidGroups = [],
    isLoading: loadingKidGroups,
    refetch: refetchKidGroups,
  } = useGetKidGroupsQuery();

  // Classrooms sorted from youngest to oldest age
  const sortedKidGroups = useMemo(() => {
    return sortKidGroupsByAge(kidGroups);
  }, [kidGroups]);

  // Always query all kids for the active meeting when multiple classrooms exist,
  // so all classroom counters remain populated even when filtering by a specific classroom.
  const activeKidGroupId = kidGroups.length === 1 ? kidGroups[0].id : undefined;

  const todayIso = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

  // RTK Query: Live registered kids query with automatic tag invalidation
  const {
    data: rawKids,
    isLoading: loadingKids,
    isFetching: fetchingKids,
    refetch: refetchAttendance,
  } = useGetKidGroupAttendanceQuery(
    {
      date: todayIso,
      kidGroupId: activeKidGroupId,
      churchMeetingId: currentMeeting?.id,
    },
    {
      skip: !currentMeeting?.id,
    },
  );

  const kids: IKid[] = useMemo(() => {
    if (Array.isArray(rawKids)) return rawKids;
    if (typeof rawKids === 'string') {
      try {
        const parsed = JSON.parse(rawKids);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [rawKids]);

  // Realtime Live Sync: Receives SSE notifications on check-in/check-out and updates lists instantly
  useKidChurchLiveSync({
    churchMeetingId: currentMeeting?.id,
    enabled: Boolean(currentMeeting?.id),
  });

  const loading = loadingKids || (fetchingKids && kids.length === 0);

  const { setSearchAvailable, registerSearchFocusHandler } = useSearchScroll();

  useEffect(() => {
    const isAvailable = !loadingKidGroups && kidGroups.length > 0;
    setSearchAvailable(isAvailable);
    if (isAvailable) {
      registerSearchFocusHandler(() => {
        searchInputRef.current?.focus();
      });
    }

    return () => {
      setSearchAvailable(false);
      registerSearchFocusHandler(null);
    };
  }, [loadingKidGroups, kidGroups.length, setSearchAvailable, registerSearchFocusHandler]);

  // Auto-preselect when user is Supervisor with a single assigned classroom (length === 1)
  useEffect(() => {
    if (kidGroups.length === 1 && selectedKidGroupId !== kidGroups[0].id) {
      setSelectedKidGroupId(kidGroups[0].id);
    }
  }, [kidGroups, selectedKidGroupId]);

  // Listen for BottomNav tab click to reset search and filters
  useEffect(() => {
    const handleReset = () => {
      setSearchText('');
      if (kidGroups.length > 1) {
        setSelectedKidGroupId('');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
      void refetchAttendance();
    };

    window.addEventListener('reset-kid-church-dashboard', handleReset);
    return () => {
      window.removeEventListener('reset-kid-church-dashboard', handleReset);
    };
  }, [kidGroups.length, refetchAttendance]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchKidGroups(), refetchAttendance()]);
      toast.success(t('dashboard.toast_refreshed'));
    } catch {
      toast.error(t('dashboard.toast_refresh_error'));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtered kid list based on classroom filter and search text
  const filteredKids = useMemo(() => {
    let result = kids || [];

    if (selectedKidGroupId) {
      result = result.filter((kid: IKid) => kid.kidGroup?.id === selectedKidGroupId);
    }

    if (searchText) {
      const { filterByFirstName, filterByLastName, numericId } = parseEntitySearchParams(searchText);
      if (numericId) {
        result = result.filter((kid: IKid) => {
          const code = String(kid.faithForgeId || kid.id || '').toLowerCase();
          return code.includes(numericId.toLowerCase());
        });
      } else if (filterByFirstName || filterByLastName) {
        result = result.filter((kid: IKid) => {
          const first = (kid.firstName || '').toLowerCase();
          const last = (kid.lastName || '').toLowerCase();
          const matchFirst = filterByFirstName ? first.includes(filterByFirstName.toLowerCase()) : true;
          const matchLast = filterByLastName ? last.includes(filterByLastName.toLowerCase()) : true;
          return matchFirst && matchLast;
        });
      }
    }

    return result;
  }, [kids, selectedKidGroupId, searchText]);

  const handleKidClick = (kid: IKid) => {
    setSelectedKid(kid);
    setOpenKidDrawer(true);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto w-full flex flex-col gap-3 min-h-full flex-1 pb-6 relative">
      {/* Service Info Banner */}
      {isConfigured && currentMeeting ? (
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary block truncate">
              {currentCampus?.name || t('dashboard.campus_fallback')}
              {kidGroups.length === 1 && ` • ${t('dashboard.classroom_prefix', { name: kidGroups[0].name })}`}
            </span>
            <h2 className="text-base font-black text-gray-800 truncate">
              {currentMeeting.name}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-xl shrink-0 font-black text-sm">
            <Users size={16} />
            <span>{kids.length === 1 ? t('dashboard.kids_count_one') : t('dashboard.kids_count_other', { count: kids.length })}</span>
          </div>
        </div>
      ) : (
        <Alert
          type="error"
          title={t('dashboard.missing_config_title')}
          message={t('dashboard.missing_config_desc')}
        />
      )}

      {/* Loading State for Classrooms */}
      {loadingKidGroups && kidGroups.length === 0 && (
        <div className="flex flex-col gap-2 mt-2">
          <CellListSkeleton count={4} />
        </div>
      )}

      {/* State: No authorized classrooms (User has 0 classrooms) */}
      {!loadingKidGroups && kidGroups.length === 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-6 text-center flex flex-col items-center gap-3 shadow-xs my-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <h3 className="text-sm font-bold text-amber-900">
              {t('dashboard.access_restricted_title')}
            </h3>
            <p className="text-xs text-amber-700 leading-relaxed">
              {t('dashboard.access_restricted_desc')}
            </p>
          </div>
        </div>
      )}

      {/* When user has authorized classrooms (length > 0) */}
      {!loadingKidGroups && kidGroups.length > 0 && (
        <>
          {/* Search Input (scrolls with content, revealed as lupa in TopBar on scroll) */}
          <div className="py-1">
            <Input
              ref={searchInputRef}
              icon="search"
              placeholder={
                kidGroups.length === 1
                  ? t('dashboard.search_placeholder_single', { classroom: kidGroups[0].name })
                  : t('dashboard.search_placeholder_multi')
              }
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onClear={() => setSearchText('')}
              wrapperClassName="mb-0"
              className="border-0 shadow-sm text-base bg-white focus:ring-0"
            />
          </div>

          {/* Multiple Classrooms Selector (Only shown if user has more than 1 classroom) */}
          {kidGroups.length > 1 && (
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  {kidsClassroomsName} de {kidsModuleName}
                </span>
                {selectedKidGroupId && (
                  <button
                    type="button"
                    onClick={() => setSelectedKidGroupId('')}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    {t('dashboard.view_all')}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-6 gap-2">
                {sortedKidGroups.map((group: IKidGroup, index: number) => {
                  const isSelected = selectedKidGroupId === group.id;
                  const count = kids.filter((k: IKid) => k.kidGroup?.id === group.id).length;
                  
                  // Cálculo de ancho en base a sistema de 6 columnas
                  let colSpanClass = 'col-span-2'; // 3 salones por fila (33.3% cada uno)
                  if (sortedKidGroups.length === 2) {
                    colSpanClass = 'col-span-3'; // 2 salones en 1 fila (50% cada uno)
                  } else {
                    const remainder = sortedKidGroups.length % 3;
                    if (remainder === 1 && index === sortedKidGroups.length - 1) {
                      colSpanClass = 'col-span-6'; // 1 salón solo en la última fila (100% ampliado)
                    } else if (remainder === 2 && index >= sortedKidGroups.length - 2) {
                      colSpanClass = 'col-span-3'; // 2 salones en la última fila (50% cada uno cubriendo todo el ancho)
                    }
                  }

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedKidGroupId(isSelected ? '' : group.id)}
                      className={clsx(
                        'py-2.5 px-2 rounded-xl text-center border-2 transition-all flex flex-col items-center justify-center active:scale-95 cursor-pointer min-w-0',
                        colSpanClass,
                        isSelected
                          ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30'
                          : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-700',
                      )}
                    >
                      <p
                        className={clsx(
                          'text-xs font-bold truncate w-full',
                          isSelected ? 'text-primary' : 'text-gray-800',
                        )}
                      >
                        {group.name}
                      </p>
                      <span
                        className={clsx(
                          'text-xs font-extrabold mt-0.5',
                          isSelected ? 'text-primary' : 'text-gray-500',
                        )}
                      >
                        {count} {count === 1 ? t('dashboard.kids_count_one') : t('dashboard.kids_count_other', { count })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Registered Kids List */}
          <PullToRefresh
            onRefresh={handleRefresh}
            disabled={loading || isRefreshing}
            className="w-full flex-1 flex flex-col"
          >
            <div className="flex flex-col gap-2 mt-1 w-full flex-1">
              {loading && <CellListSkeleton count={6} />}

              {!loading && filteredKids.length === 0 && (
                <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
                  <Users size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold text-gray-600">
                    {t('dashboard.empty_title')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {searchText
                      ? t('dashboard.empty_desc_search')
                      : t('dashboard.empty_desc_default')}
                  </p>
                </div>
              )}

              {!loading && filteredKids.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
                  {filteredKids.map((kid: IKid) => {
                    const ageYears = Math.floor(kid.age ?? 0);
                    const ageMonths = kid.ageInMonths ? kid.ageInMonths - ageYears * 12 : 0;
                    const ageText = `${ageYears} años ${ageMonths > 0 ? `y ${ageMonths}m` : ''}`.trim();
                    const subtitleText = t('dashboard.classroom_label', {
                      classroom: kid.kidGroup?.name || t('dashboard.classroom_no_group'),
                      age: ageText,
                    });

                    const badgeElement = (
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                          {t('dashboard.in_classroom')}
                        </span>
                      </div>
                    );

                    return (
                      <Cell
                        key={kid.id || kid.faithForgeId}
                        title={capitalizeWords(`${kid.firstName || ''} ${kid.lastName || ''}`.trim())}
                        subtitle={subtitleText}
                        gender={kid.gender === UserGenderCode.FEMALE ? 'F' : 'M'}
                        photoUrl={kid.photoUrl}
                        isRegistered={true}
                        badge={badgeElement}
                        onClick={() => handleKidClick(kid)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Safe spacer so last card never collides with floating BottomNav */}
              <div className="h-20 sm:h-24 shrink-0 pointer-events-none" aria-hidden="true" />
            </div>
          </PullToRefresh>

          {/* Floating Action Button (FAB) for Reload */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={clsx(
              'fixed right-5 bottom-24 w-13 h-13 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center z-40 transition-transform active:scale-90 hover:shadow-2xl cursor-pointer',
              isRefreshing && 'opacity-70 cursor-not-allowed',
            )}
            title={t('dashboard.refresh_button_title')}
          >
            <RefreshCw size={22} className={clsx(isRefreshing && 'animate-spin')} />
          </button>
        </>
      )}

      {/* Kid Details Bottom Sheet (Alerta de EPS deshabilitada para coordinadores, supervisores y maestros) */}
      <KidDetailsDrawer
        open={openKidDrawer}
        onOpenChange={setOpenKidDrawer}
        kid={selectedKid}
        showEpsAlert={false}
      />
    </div>
  );
};

export default KidChurchDashboard;
