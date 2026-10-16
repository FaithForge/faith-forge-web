import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, UserPlus, Users, Award, ChevronDown, Sparkles } from 'lucide-react';
import Input from '@/components/ui/Input';
import Cell from '@/components/ui/Cell';
import Button from '@/components/ui/Button';
import PullToRefresh from '@/components/ui/PullToRefresh';
import PageHeader from '@/components/ui/PageHeader';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetUsers, GetMoreUsers } from '@/libs/state/redux/thunks/user/user.thunk';
import { updateCurrentUser } from '@/libs/state/redux/slices/user/users.slice';
import { APP_ROUTES } from '@/config/routes';
import { capitalizeWords } from '@/libs/utils/text';
import { formatPhoneDisplay } from '@/libs/utils/phone';
import { UserState } from '@/libs/models';
import { UserRole } from '@/libs/utils/auth';
import { useSearchScroll } from '@/libs/context/SearchScrollContext';
import { useInfiniteScroll } from '@/libs/hooks/useInfiniteScroll';
import { useChurchTerm } from '@/libs/hooks/useTerm';
import EndOfListFunnyBadge from '@/components/ui/EndOfListFunnyBadge';

/**
 * Unified User Directory and Management View.
 * Provides real-time debounced search, infinite scroll pagination, and quick user creation.
 *
 * @returns {JSX.Element} Rendered user management dashboard.
 */
const UserManagementView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const volunteerTerm = useChurchTerm('volunteer');

  const [searchText, setSearchText] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const { setSearchAvailable, registerSearchFocusHandler } = useSearchScroll();

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

    // If we already have loaded users in Redux and don't need a refresh on mount, keep the list
    if (isFirstMount && users.length > 0 && !needsRefresh) {
      return;
    }

    // If search text did not change and no mutation occurred and we already have users, do nothing
    if (!isFirstMount && !isSearchChanged && !needsRefresh && users.length > 0) {
      return;
    }

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
   * Clears search input and immediately fetches full user list without debounce delay.
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

  const rightHeaderAction = (
    <button
      type="button"
      onClick={() => navigate(APP_ROUTES.admin.createUser)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs active:scale-95 transition-all shadow-xs"
    >
      <UserPlus size={15} />
      <span className="hidden sm:inline">Nuevo Usuario</span>
    </button>
  );

  return (
    <div className="min-h-full bg-slate-50 pb-20 flex flex-col flex-1">
      <PageHeader
        title="Gestión de Usuarios"
        onBack={() => navigate(APP_ROUTES.admin.root)}
        className="lg:hidden"
        rightAction={rightHeaderAction}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex flex-col gap-5 flex-1 w-full">
        {/* Header Summary Banner */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">
                <Sparkles size={12} />
                <span>Directorio Central</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight truncate">
                Gestión de Usuarios
              </h1>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                Administra feligreses, voluntarios y roles de acceso a la congregación
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 w-full sm:w-auto justify-between sm:justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(APP_ROUTES.admin.createUser)}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs shadow-xs"
            >
              <UserPlus size={15} />
              <span>Nuevo Usuario</span>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full">
          <Input
            ref={searchInputRef}
            icon="search"
            placeholder="Buscar usuario por nombre o documento..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onClear={handleClearSearch}
            wrapperClassName="mb-0"
            className="border-gray-200 shadow-2xs text-sm placeholder:text-gray-400 bg-white"
          />
        </div>

        {/* User List */}
        <PullToRefresh onRefresh={handleRefreshUsers} disabled={loading} className="w-full flex-1 flex flex-col">
          <div className="flex flex-col gap-2 mt-1 w-full flex-1">
            {loading && <CellListSkeleton count={6} />}

            {!loading && users.length === 0 && (
              <div className="text-center p-12 bg-white rounded-2xl border border-gray-200/80 shadow-xs flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
                  <Users size={24} />
                </div>
                <h3 className="font-bold text-gray-800 text-base">
                  {searchText ? 'No se encontraron usuarios' : 'Directorio de usuarios'}
                </h3>
                <p className="text-xs text-gray-500 max-w-xs mt-1">
                  {searchText
                    ? 'Intenta con otro número de cédula o nombre de usuario.'
                    : 'Busca un usuario por su nombre o número de documento.'}
                </p>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => navigate(APP_ROUTES.admin.createUser)}
                  className="mt-4 py-2 px-4 text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <UserPlus size={15} /> Crear Nuevo Usuario
                </Button>
              </div>
            )}

            {!loading && users.length > 0 && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 w-full">
                {users.map((user) => {
                  const rolesCount =
                    user.roles?.filter((r) => r !== UserRole.USER && (r as string) !== 'USER').length || 0;
                  const isVolunteer = user.roles?.some(
                    (r) => (r as string) === 'VOLUNTEER' || r.startsWith('KID_'),
                  );

                  const badgeElement = (
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      {user.state && (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            user.state === UserState.ACTIVE
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : user.state === UserState.DISABLE || user.state === UserState.INACTIVE
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : user.state === UserState.DELETED
                              ? 'bg-gray-100 text-gray-800 border-gray-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {user.state === UserState.ACTIVE
                            ? 'Activo'
                            : user.state === UserState.DISABLE || user.state === UserState.INACTIVE
                            ? 'Inactivo'
                            : user.state === UserState.DELETED
                            ? 'Eliminado'
                            : 'Pendiente'}
                        </span>
                      )}
                      {isVolunteer && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-violet-50 text-violet-700 rounded-full border border-violet-200 flex items-center gap-0.5">
                          <Award size={10} /> {volunteerTerm}
                        </span>
                      )}
                      {rolesCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                          {rolesCount} {rolesCount === 1 ? 'rol' : 'roles'}
                        </span>
                      )}
                    </div>
                  );

                  const subtitleText = `ID: #${user.faithForgeId || user.id.slice(0, 8)} • ${
                    user.nationalIdType || 'CC'
                  }: ${user.nationalId || 'Sin documento'}${
                    user.phone ? ` • Tel: ${formatPhoneDisplay(user.phone, user.dialCodePhone)}` : ''
                  }`;

                  return (
                    <div
                      key={user.id}
                      className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-xs transition-all overflow-hidden"
                    >
                      <Cell
                        title={capitalizeWords(`${user.firstName} ${user.lastName}`)}
                        subtitle={subtitleText}
                        gender={user.gender === 'F' ? 'F' : 'M'}
                        iconType="user"
                        photoUrl={user.photoUrl}
                        badge={badgeElement}
                        onClick={() => {
                          dispatch(updateCurrentUser(user));
                          navigate(APP_ROUTES.admin.userDetail(user.id));
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Infinite Scroll Sentinel & Load More Spinner */}
            {!loading && users.length > 0 && (
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
                    <span>Cargar más usuarios</span>
                  </button>
                )}
                {!loadingMore && !hasMore && (
                  <EndOfListFunnyBadge type="users" />
                )}
              </div>
            )}

            {/* Safe spacer so end indicator sits comfortably above bottom */}
            <div className="h-20 sm:h-24 shrink-0 pointer-events-none" aria-hidden="true" />
          </div>
        </PullToRefresh>
      </div>
    </div>
  );
};

export default UserManagementView;
