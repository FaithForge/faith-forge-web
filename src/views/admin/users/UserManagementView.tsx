import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  UserPlus,
  Users,
  Award,
  Star,
  Download,
  Eye,
  Pencil,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Building2,
  Check,
} from 'lucide-react';
import clsx from 'clsx';
import dayjs from 'dayjs';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import PullToRefresh from '@/components/ui/PullToRefresh';
import PageHeader from '@/components/ui/PageHeader';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import EndOfListFunnyBadge from '@/components/ui/EndOfListFunnyBadge';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetUsers, GetMoreUsers } from '@/libs/state/redux/thunks/user/user.thunk';
import { updateCurrentUser } from '@/libs/state/redux/slices/user/users.slice';
import { useGetChurchCampusesQuery } from '@/libs/state/redux/api/churchApi';
import { APP_ROUTES } from '@/config/routes';
import { capitalizeWords } from '@/libs/utils/text';
import { formatPhoneDisplay } from '@/libs/utils/phone';
import { IUser, UserState } from '@/libs/models';
import { UserRole, ALL_SYSTEM_ROLES_METADATA, AppRole } from '@/libs/utils/auth';
import { useSearchScroll } from '@/libs/context/SearchScrollContext';
import { useInfiniteScroll } from '@/libs/hooks/useInfiniteScroll';
import { useChurchTerm } from '@/libs/hooks/useTerm';

type QuickFilterType = 'all' | 'volunteers' | 'leaders' | 'pending';

interface AvatarPalette {
  bg: string;
  text: string;
  border: string;
}

const AVATAR_PALETTES: AvatarPalette[] = [
  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
  { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200' },
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
];

/**
 * Returns a stable pastel palette for initials avatar based on person's name hash.
 *
 * @param {string} name - Person's full name.
 * @returns {AvatarPalette} Background, text, and border classes.
 */
function getAvatarPalette(name: string): AvatarPalette {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

/**
 * Checks if a user has volunteer privileges or ministry assignments.
 *
 * @param {IUser} user - User record.
 * @returns {boolean} True if user is a volunteer.
 */
function isUserVolunteer(user: IUser): boolean {
  return (
    user.roles?.some((r) => {
      const roleStr = r as string;
      return (
        roleStr === 'VOLUNTEER' ||
        roleStr.startsWith('KID_') ||
        roleStr.includes('COORDINATOR') ||
        roleStr.includes('SUPERVISOR')
      );
    }) || false
  );
}

/**
 * Checks if a user holds leadership or administrative roles.
 *
 * @param {IUser} user - User record.
 * @returns {boolean} True if user is a leader or administrator.
 */
function isUserLeader(user: IUser): boolean {
  return (
    user.roles?.some((r) => {
      const roleStr = r as string;
      return (
        roleStr === UserRole.ADMIN ||
        roleStr === UserRole.SUPER_ADMIN ||
        roleStr.includes('ADMIN') ||
        roleStr.includes('COORDINATOR') ||
        roleStr.includes('PASTOR')
      );
    }) || false
  );
}

/**
 * Returns bullet dot color and styling for a role tag.
 *
 * @param {string} role - Role enum string.
 * @returns {Object} Style classes for the pill badge and bullet dot.
 */
function getRoleBadgeStyle(role: string) {
  const upper = role.toUpperCase();
  if (upper.includes('ADMIN')) {
    return {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      dot: 'bg-indigo-500',
      border: 'border-indigo-200/80',
    };
  }
  if (upper.includes('COORDINATOR')) {
    return {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      dot: 'bg-sky-500',
      border: 'border-sky-200/80',
    };
  }
  if (upper.includes('SUPERVISOR')) {
    return {
      bg: 'bg-cyan-50',
      text: 'text-cyan-700',
      dot: 'bg-cyan-500',
      border: 'border-cyan-200/80',
    };
  }
  if (upper.includes('VOLUNTEER') || upper.startsWith('KID_CHURCH')) {
    return {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      dot: 'bg-purple-500',
      border: 'border-purple-200/80',
    };
  }
  if (upper.includes('REGISTER')) {
    return {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      dot: 'bg-teal-500',
      border: 'border-teal-200/80',
    };
  }
  if (upper.includes('SECURITY')) {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
      border: 'border-amber-200/80',
    };
  }
  return {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
    border: 'border-slate-200/80',
  };
}

/**
 * Unified User Directory and Management View replicating modern concept design.
 * Provides live debounced search, quick filter views, responsive desktop table and mobile cards,
 * KPI metrics, and direct client-side CSV export.
 *
 * @returns {JSX.Element} Rendered user management directory.
 */
const UserManagementView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation('admin');
  const volunteerTerm = useChurchTerm('volunteer');
  const campusTerm = useChurchTerm('campus');

  const [searchText, setSearchText] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('all');
  const [selectedCampusId, setSelectedCampusId] = useState<string>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const { setSearchAvailable, registerSearchFocusHandler } = useSearchScroll();

  // Load campuses catalog via RTK Query
  const { data: campuses = [] } = useGetChurchCampusesQuery();

  // Keyboard shortcut ⌘K / Ctrl+K focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const { data: users, loading, currentPage, totalPages, needsRefresh } = useAppSelector(
    (state) => state.userSlice
  );

  const prevSearchTextRef = useRef<string | null>(null);

  // Search logic with debounce and automatic refresh on mutations
  useEffect(() => {
    const isFirstMount = prevSearchTextRef.current === null;
    const isSearchChanged = !isFirstMount && searchText !== prevSearchTextRef.current;
    prevSearchTextRef.current = searchText;

    if (isFirstMount && users.length > 0 && !needsRefresh) return;
    if (!isFirstMount && !isSearchChanged && !needsRefresh && users.length > 0) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const delay = isSearchChanged && searchText.trim().length > 0 ? 400 : 0;

    if (delay === 0) {
      dispatch(GetUsers({ findText: searchText }));
    } else {
      timeoutRef.current = setTimeout(() => {
        dispatch(GetUsers({ findText: searchText }));
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [searchText, dispatch, needsRefresh, users.length]);

  /**
   * Clears search input and immediately fetches full user list.
   */
  const handleClearSearch = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    prevSearchTextRef.current = '';
    setSearchText('');
    dispatch(GetUsers({ findText: '' }));
  };

  /**
   * Refreshes the user list manually via pull-to-refresh.
   */
  const handleRefreshUsers = async () => {
    try {
      await dispatch(GetUsers({ findText: searchText })).unwrap();
    } catch {
      // ignore
    }
  };

  const hasMore = currentPage < totalPages;

  /**
   * Loads the next page of users for infinite scroll.
   */
  const handleLoadMore = useCallback(async () => {
    try {
      await dispatch(GetMoreUsers({ findText: searchText })).unwrap();
    } catch (e) {
      console.error(e);
    }
  }, [dispatch, searchText]);

  const { sentinelRef, loadingMore, triggerLoadMore } = useInfiniteScroll({
    onLoadMore: handleLoadMore,
    hasMore,
    isLoading: loading,
    threshold: 250,
    cooldownMs: 800,
  });

  // Calculate filtered users based on selected quick view
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (quickFilter === 'volunteers') return isUserVolunteer(user);
      if (quickFilter === 'leaders') return isUserLeader(user);
      if (quickFilter === 'pending') return user.state !== UserState.ACTIVE;
      return true;
    });
  }, [users, quickFilter]);

  // Metric KPI stats derived from available data
  const stats = useMemo(() => {
    const totalLoaded = users.length;
    const volunteers = users.filter(isUserVolunteer).length;
    const leaders = users.filter(isUserLeader).length;
    const pending = users.filter((u) => u.state !== UserState.ACTIVE).length;

    const totalEstimated = totalPages > 1 ? Math.max(totalLoaded, totalPages * 25) : totalLoaded;
    const volunteerPct = totalLoaded > 0 ? ((volunteers / totalLoaded) * 100).toFixed(1) : '0.0';
    const leaderPct = totalLoaded > 0 ? ((leaders / totalLoaded) * 100).toFixed(1) : '0.0';

    return {
      totalEstimated,
      totalLoaded,
      volunteers,
      volunteerPct,
      leaders,
      leaderPct,
      pending,
    };
  }, [users, totalPages]);

  // Bulk selection handlers
  const allFilteredSelected =
    filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.has(u.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  /**
   * Generates and downloads a clean UTF-8 CSV containing currently listed users.
   */
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Nombres',
      'Apellidos',
      'Tipo Documento',
      'Documento',
      'Telefono',
      'Correo',
      'Estado',
      'Roles',
    ];

    const rows = filteredUsers.map((u) => [
      u.faithForgeId || u.id,
      `"${(u.firstName || '').replace(/"/g, '""')}"`,
      `"${(u.lastName || '').replace(/"/g, '""')}"`,
      u.nationalIdType || 'CC',
      `"${u.nationalId || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.email || ''}"`,
      u.state || 'ACTIVE',
      `"${(u.roles || []).join(', ')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `directorio_usuarios_${dayjs().format('YYYYMMDD_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const rightHeaderAction = (
    <button
      type="button"
      onClick={() => navigate(APP_ROUTES.admin.createUser)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs active:scale-95 transition-all shadow-xs"
    >
      <UserPlus size={15} />
      <span>{t('directory.new_user')}</span>
    </button>
  );

  return (
    <div className="min-h-full bg-slate-50 pb-20 flex flex-col flex-1">
      <PageHeader
        title={t('directory.title')}
        onBack={() => navigate(APP_ROUTES.admin.root)}
        className="lg:hidden"
        rightAction={rightHeaderAction}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex flex-col gap-5 flex-1 w-full">
        {/* Top Header & Actions Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                {t('directory.badge')}
              </span>
              <span className="text-xs text-gray-400 font-medium hidden sm:inline">•</span>
              <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                {t('directory.synchronized')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight mt-1.5 truncate">
              {t('directory.title')}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2 max-w-2xl">
              {t('directory.description')}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredUsers.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              <Download size={15} />
              <span>{t('directory.export_csv')}</span>
            </button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(APP_ROUTES.admin.createUser)}
              className="inline-flex items-center gap-1.5 text-xs shadow-xs"
            >
              <UserPlus size={15} />
              <span>{t('directory.new_user')}</span>
            </Button>
          </div>
        </div>

        {/* 3 Metric Summary KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: Total Users */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {t('directory.kpi_total_registered')}
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {stats.totalEstimated.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('directory.kpi_total_sub')}</p>
            </div>
          </div>

          {/* Card 2: Volunteers in Service */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {t('directory.kpi_volunteers_in_service')}
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                <Award size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {stats.volunteers.toLocaleString()}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                  {stats.volunteerPct}% {t('directory.of_total')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('directory.kpi_volunteers_sub')}</p>
            </div>
          </div>

          {/* Card 3: Leaders & Pastors */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {t('directory.kpi_leaders_pastors')}
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                <Star size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {stats.leaders.toLocaleString()}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                  {stats.leaderPct}% {t('directory.of_total')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('directory.kpi_leaders_sub')}</p>
            </div>
          </div>
        </div>

        {/* Search, Campus Filter and Quick Views Card */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 shadow-2xs flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="w-full sm:flex-1 relative">
              <Input
                ref={searchInputRef}
                icon="search"
                placeholder={t('directory.search_placeholder')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onClear={handleClearSearch}
                wrapperClassName="mb-0"
                className="border-gray-200 shadow-2xs text-sm placeholder:text-gray-400 bg-white pr-12"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center">
                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-gray-100 border border-gray-200 rounded-md">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Campus Selector (if campuses exist) */}
            {campuses && campuses.length > 0 && (
              <div className="w-full sm:w-64 shrink-0">
                <div className="relative">
                  <select
                    value={selectedCampusId}
                    onChange={(e) => setSelectedCampusId(e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-200 text-gray-800 text-xs font-semibold rounded-2xl pl-9 pr-8 py-2.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="all">
                      {t('directory.all_campuses', { campuses: campusTerm })}
                    </option>
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <Building2
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Views / Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
            <span className="text-xs font-semibold text-gray-400 shrink-0 hidden md:inline">
              {t('directory.quick_views')}
            </span>

            <button
              type="button"
              onClick={() => setQuickFilter('all')}
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all shrink-0 cursor-pointer',
                quickFilter === 'all'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 font-medium border border-gray-200/60'
              )}
            >
              <span>{t('directory.tab_all')}</span>
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                  quickFilter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                )}
              >
                {stats.totalLoaded}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQuickFilter('volunteers')}
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all shrink-0 cursor-pointer',
                quickFilter === 'volunteers'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 font-medium border border-gray-200/60'
              )}
            >
              <span>{t('directory.tab_volunteers')}</span>
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                  quickFilter === 'volunteers'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-700'
                )}
              >
                {stats.volunteers}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQuickFilter('leaders')}
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all shrink-0 cursor-pointer',
                quickFilter === 'leaders'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 font-medium border border-gray-200/60'
              )}
            >
              <span>{t('directory.tab_leaders')}</span>
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                  quickFilter === 'leaders' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                )}
              >
                {stats.leaders}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQuickFilter('pending')}
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all shrink-0 cursor-pointer',
                quickFilter === 'pending'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 font-medium border border-gray-200/60'
              )}
            >
              <span>{t('directory.tab_pending')}</span>
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                  quickFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                )}
              >
                {stats.pending}
              </span>
            </button>
          </div>
        </div>

        {/* User List Content */}
        <PullToRefresh onRefresh={handleRefreshUsers} disabled={loading} className="w-full flex-1 flex flex-col">
          <div className="flex flex-col gap-3 w-full flex-1">
            {loading && <CellListSkeleton count={6} />}

            {!loading && filteredUsers.length === 0 && (
              <div className="text-center p-12 bg-white rounded-2xl border border-gray-200/80 shadow-xs flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
                  <Users size={24} />
                </div>
                <h3 className="font-bold text-gray-800 text-base">
                  {searchText
                    ? t('directory.empty_no_results')
                    : t('directory.empty_title')}
                </h3>
                <p className="text-xs text-gray-500 max-w-xs mt-1">
                  {searchText
                    ? t('directory.empty_desc_search')
                    : t('directory.empty_desc')}
                </p>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => navigate(APP_ROUTES.admin.createUser)}
                  className="mt-4 py-2 px-4 text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <UserPlus size={15} /> {t('directory.new_user')}
                </Button>
              </div>
            )}

            {/* Desktop Table View (lg:block) */}
            {!loading && filteredUsers.length > 0 && (
              <div className="hidden lg:block bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3.5 pl-4 pr-2 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleSelectAll}
                          aria-label="Seleccionar todos los usuarios"
                          className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary/20 cursor-pointer"
                        />
                      </th>
                      <th className="py-3.5 px-3">{t('directory.th_user')}</th>
                      <th className="py-3.5 px-3">{t('directory.th_contact')}</th>
                      <th className="py-3.5 px-3">{t('directory.th_roles')}</th>
                      <th className="py-3.5 px-3">{t('directory.th_status')}</th>
                      <th className="py-3.5 pr-4 pl-3 text-right">
                        {t('directory.th_actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((user) => {
                      const fullName = capitalizeWords(`${user.firstName} ${user.lastName}`);
                      const palette = getAvatarPalette(fullName);
                      const isSelected = selectedUserIds.has(user.id);

                      const initials =
                        fullName
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((p) => p.charAt(0).toUpperCase())
                          .join('') || '?';

                      const userRoles = (user.roles || []).filter(
                        (r) => r !== UserRole.USER && (r as string) !== 'USER'
                      );

                      return (
                        <tr
                          key={user.id}
                          className={clsx(
                            'hover:bg-slate-50/70 transition-colors group',
                            isSelected && 'bg-indigo-50/30'
                          )}
                        >
                          {/* Checkbox */}
                          <td className="py-3 pl-4 pr-2 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectUser(user.id)}
                              aria-label={`Seleccionar a ${fullName}`}
                              className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary/20 cursor-pointer"
                            />
                          </td>

                          {/* User: Avatar + Name + ID */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                {user.photoUrl ? (
                                  <img
                                    src={user.photoUrl}
                                    alt={fullName}
                                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                  />
                                ) : (
                                  <div
                                    className={clsx(
                                      'w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs select-none border',
                                      palette.bg,
                                      palette.text,
                                      palette.border
                                    )}
                                  >
                                    {initials}
                                  </div>
                                )}
                                <span
                                  className={clsx(
                                    'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white',
                                    user.state === UserState.ACTIVE
                                      ? 'bg-emerald-500'
                                      : user.state === UserState.DISABLE ||
                                        user.state === UserState.INACTIVE
                                      ? 'bg-rose-500'
                                      : 'bg-amber-500'
                                  )}
                                />
                              </div>

                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    dispatch(updateCurrentUser(user));
                                    navigate(APP_ROUTES.admin.userDetail(user.id));
                                  }}
                                  className="text-sm font-bold text-gray-900 hover:text-primary transition-colors text-left truncate block cursor-pointer"
                                >
                                  {fullName}
                                </button>
                                <span className="text-[11px] text-gray-400 font-medium">
                                  ID: #{user.faithForgeId || user.id.slice(0, 8)}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Document / Contact */}
                          <td className="py-3 px-3">
                            <div className="text-xs text-gray-700">
                              <div className="font-semibold text-gray-900">
                                {user.nationalIdType || 'CC'}: {user.nationalId || 'Sin documento'}
                              </div>
                              <div className="text-gray-500 text-[11px] mt-0.5">
                                {user.phone
                                  ? formatPhoneDisplay(user.phone, user.dialCodePhone)
                                  : user.email || 'Sin contacto'}
                              </div>
                            </div>
                          </td>

                          {/* Roles / Asignaciones */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                              {userRoles.length === 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200/80">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                  <span>{t('directory.general_member')}</span>
                                </span>
                              )}

                              {userRoles.slice(0, 2).map((role) => {
                                const meta = ALL_SYSTEM_ROLES_METADATA[role as AppRole];
                                const label = meta?.name || role;
                                const style = getRoleBadgeStyle(role);
                                return (
                                  <span
                                    key={role}
                                    className={clsx(
                                      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                                      style.bg,
                                      style.text,
                                      style.border
                                    )}
                                  >
                                    <span className={clsx('w-1.5 h-1.5 rounded-full', style.dot)} />
                                    <span>{label}</span>
                                  </span>
                                );
                              })}

                              {userRoles.length > 2 && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                  +{userRoles.length - 2} más
                                </span>
                              )}
                            </div>
                          </td>

                          {/* State & Registration Date */}
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-0.5">
                              <div>
                                <span
                                  className={clsx(
                                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                                    user.state === UserState.ACTIVE
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : user.state === UserState.DISABLE ||
                                        user.state === UserState.INACTIVE
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  )}
                                >
                                  <span
                                    className={clsx(
                                      'w-1.5 h-1.5 rounded-full',
                                      user.state === UserState.ACTIVE
                                        ? 'bg-emerald-500'
                                        : user.state === UserState.DISABLE ||
                                          user.state === UserState.INACTIVE
                                        ? 'bg-rose-500'
                                        : 'bg-amber-500'
                                    )}
                                  />
                                  <span>
                                    {user.state === UserState.ACTIVE
                                      ? t('directory.state_active')
                                      : user.state === UserState.DISABLE ||
                                        user.state === UserState.INACTIVE
                                      ? t('directory.state_inactive')
                                      : t('directory.state_pending')}
                                  </span>
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-400 mt-0.5">
                                {user.createdAt
                                  ? t('directory.member_since', {
                                      year: dayjs(user.createdAt).format('YYYY'),
                                    })
                                  : t('directory.active_account')}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 pr-4 pl-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                title={t('directory.view_details')}
                                onClick={() => {
                                  dispatch(updateCurrentUser(user));
                                  navigate(APP_ROUTES.admin.userDetail(user.id));
                                }}
                                className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-indigo-100"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                type="button"
                                title={t('directory.edit_user')}
                                onClick={() => navigate(APP_ROUTES.admin.updateUser(user.id))}
                                className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Pencil size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile Card List View (lg:hidden) */}
            {!loading && filteredUsers.length > 0 && (
              <div className="grid grid-cols-1 gap-3 lg:hidden">
                {filteredUsers.map((user) => {
                  const fullName = capitalizeWords(`${user.firstName} ${user.lastName}`);
                  const palette = getAvatarPalette(fullName);

                  const initials =
                    fullName
                      .trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p.charAt(0).toUpperCase())
                      .join('') || '?';

                  const userRoles = (user.roles || []).filter(
                    (r) => r !== UserRole.USER && (r as string) !== 'USER'
                  );

                  return (
                    <div
                      key={user.id}
                      className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col gap-3"
                    >
                      {/* Top Row: Avatar + Name + State badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            {user.photoUrl ? (
                              <img
                                src={user.photoUrl}
                                alt={fullName}
                                className="w-11 h-11 rounded-full object-cover border border-gray-200"
                              />
                            ) : (
                              <div
                                className={clsx(
                                  'w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs select-none border',
                                  palette.bg,
                                  palette.text,
                                  palette.border
                                )}
                              >
                                {initials}
                              </div>
                            )}
                            <span
                              className={clsx(
                                'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white',
                                user.state === UserState.ACTIVE
                                  ? 'bg-emerald-500'
                                  : user.state === UserState.DISABLE ||
                                    user.state === UserState.INACTIVE
                                  ? 'bg-rose-500'
                                  : 'bg-amber-500'
                              )}
                            />
                          </div>

                          <div className="min-w-0">
                            <h3
                              onClick={() => {
                                dispatch(updateCurrentUser(user));
                                navigate(APP_ROUTES.admin.userDetail(user.id));
                              }}
                              className="text-sm font-bold text-gray-900 truncate cursor-pointer hover:text-primary transition-colors"
                            >
                              {fullName}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              Doc: {user.nationalId || 'Sin documento'}
                            </p>
                          </div>
                        </div>

                        {/* Top-right State Badge */}
                        <span
                          className={clsx(
                            'shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold border',
                            user.state === UserState.ACTIVE
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : user.state === UserState.DISABLE ||
                                user.state === UserState.INACTIVE
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          )}
                        >
                          {user.state === UserState.ACTIVE
                            ? t('directory.state_active')
                            : user.state === UserState.DISABLE || user.state === UserState.INACTIVE
                            ? t('directory.state_inactive')
                            : t('directory.state_pending')}
                        </span>
                      </div>

                      {/* Middle: Role Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {userRoles.length === 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>{t('directory.general_member')}</span>
                          </span>
                        )}

                        {userRoles.map((role) => {
                          const meta = ALL_SYSTEM_ROLES_METADATA[role as AppRole];
                          const label = meta?.name || role;
                          const style = getRoleBadgeStyle(role);
                          return (
                            <span
                              key={role}
                              className={clsx(
                                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                                style.bg,
                                style.text,
                                style.border
                              )}
                            >
                              <span className={clsx('w-1.5 h-1.5 rounded-full', style.dot)} />
                              <span>{label}</span>
                            </span>
                          );
                        })}
                      </div>

                      {/* Card Footer: Left Info & Right "Ver Ficha" action */}
                      <div className="border-t border-gray-100 pt-2.5 flex items-center justify-between text-xs">
                        <span className="text-gray-400 font-medium">
                          ID: #{user.faithForgeId || user.id.slice(0, 8)}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            dispatch(updateCurrentUser(user));
                            navigate(APP_ROUTES.admin.userDetail(user.id));
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 font-bold text-xs border border-gray-200/70 transition-all cursor-pointer active:scale-95"
                        >
                          <span>{t('directory.view_file')}</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination & Infinite Scroll Sentinel */}
            {!loading && filteredUsers.length > 0 && (
              <div ref={sentinelRef} className="py-4 flex flex-col items-center justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 py-2 px-4 bg-white rounded-full border border-gray-100 shadow-2xs text-xs font-semibold text-gray-500">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    <span>Cargando más usuarios...</span>
                  </div>
                )}
                {!loadingMore && hasMore && (
                  <button
                    type="button"
                    onClick={() => triggerLoadMore()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-50 border border-gray-200/80 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <ChevronDown size={14} />
                    <span>{t('directory.load_more')}</span>
                  </button>
                )}
                {!loadingMore && !hasMore && <EndOfListFunnyBadge type="users" />}
              </div>
            )}

            {/* Safe spacer */}
            <div className="h-16 sm:h-20 shrink-0 pointer-events-none" aria-hidden="true" />
          </div>
        </PullToRefresh>
      </div>
    </div>
  );
};

export default UserManagementView;
