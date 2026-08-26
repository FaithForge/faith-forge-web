import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, UserPlus, Users, Sparkles } from 'lucide-react';
import Input from '@/components/ui/Input';
import Cell from '@/components/ui/Cell';
import Button from '@/components/ui/Button';
import PullToRefresh from '@/components/ui/PullToRefresh';
import PageHeader from '@/components/ui/PageHeader';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetUsers, GetMoreUsers } from '@/libs/state/redux/thunks/user/user.thunk';
import { updateCurrentUser } from '@/libs/state/redux/slices/user/users.slice';
import { APP_ROUTES } from '@/config/routes';
import { capitalizeWords } from '@/libs/utils/text';
import { UserState } from '@/libs/models';

/**
 * Unified User Directory and Management View.
 * Provides real-time debounced search, infinite scroll pagination, and quick user creation.
 *
 * @returns {JSX.Element} Rendered user management dashboard.
 */
const UserManagementView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [searchText, setSearchText] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const { data: users, loading, currentPage, totalPages, needsRefresh } = useAppSelector(
    (state) => state.userSlice
  );

  const hasInitializedRef = useRef(false);
  const prevSearchTextRef = useRef<string>('');

  // Search logic with debounce and automatic refresh on mutations
  useEffect(() => {
    const isSearchChanged = searchText !== prevSearchTextRef.current;

    // If we already have users in Redux and no data changes (needsRefresh === false),
    // on mount without search change: KEEP the list intact without re-fetching from API
    if (!hasInitializedRef.current && users.length > 0 && !needsRefresh && !isSearchChanged) {
      hasInitializedRef.current = true;
      prevSearchTextRef.current = searchText;
      return;
    }

    // If already initialized and search and data did not change:
    if (hasInitializedRef.current && !needsRefresh && !isSearchChanged) {
      return;
    }

    hasInitializedRef.current = true;
    prevSearchTextRef.current = searchText;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const delay = isSearchChanged ? 400 : 0;

    timeoutRef.current = setTimeout(() => {
      dispatch(GetUsers({ findText: searchText.trim() }));
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [searchText, dispatch, needsRefresh, users.length]);

  /**
   * Refreshes the user list manually via pull-to-refresh.
   */
  const handleRefreshUsers = async () => {
    try {
      await dispatch(GetUsers({ findText: searchText.trim() })).unwrap();
    } catch {
      // ignore
    }
  };

  /**
   * Loads the next page of users for infinite scroll.
   */
  const handleLoadMore = useCallback(async () => {
    if (loading || loadingMore || currentPage >= totalPages) return;
    setLoadingMore(true);
    try {
      await dispatch(GetMoreUsers({ findText: searchText.trim() })).unwrap();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, currentPage, totalPages, dispatch, searchText]);

  // IntersectionObserver for infinite scrolling
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && currentPage < totalPages && !loading && !loadingMore) {
          handleLoadMore();
        }
      },
      { rootMargin: '250px' }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [handleLoadMore, currentPage, totalPages, loading, loadingMore]);

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
    <div className="min-h-full bg-slate-50/60 pb-20">
      <PageHeader
        title="Gestión de Usuarios"
        onBack={() => navigate(APP_ROUTES.admin.root)}
        rightAction={rightHeaderAction}
      />

      <div className="p-3 sm:p-4 max-w-4xl mx-auto flex flex-col gap-3">
        {/* Search Bar - Sticky */}
        <div className="sticky top-0 z-20 bg-background py-2 -mx-3 px-3 sm:-mx-4 sm:px-4">
          <Input
            icon="search"
            placeholder="Buscar usuario por nombre o documento"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onClear={() => setSearchText('')}
            wrapperClassName="mb-0"
            className="border-0 shadow-sm text-base focus:ring-0 transition-colors bg-white"
          />
        </div>

        {/* User List */}
        <PullToRefresh onRefresh={handleRefreshUsers} disabled={loading}>
          <div className="flex flex-col gap-2 mt-1">
            {loading && (
              <div className="flex justify-center p-6">
                <Loader2 className="animate-spin text-primary" size={26} />
              </div>
            )}

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

            {!loading &&
              users.map((user) => {
                const rolesCount = user.roles?.length || 0;
                const isInactive = user.state === UserState.DISABLE;

                const badgeElement = (
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    {user.state && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          user.state === UserState.ACTIVE
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : user.state === UserState.DISABLE
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        {user.state === UserState.ACTIVE
                          ? 'Activo'
                          : user.state === UserState.DISABLE
                          ? 'Inactivo'
                          : 'Pendiente'}
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                      {rolesCount} {rolesCount === 1 ? 'rol' : 'roles'}
                    </span>
                  </div>
                );

                const subtitleText = `ID: #${user.faithForgeId || user.id.slice(0, 8)} • ${
                  user.nationalIdType || 'CC'
                }: ${user.nationalId || 'Sin documento'}${
                  user.phone ? ` • Tel: ${user.dialCodePhone || '+57'} ${user.phone}` : ''
                }`;

                return (
                  <Cell
                    key={user.id}
                    title={capitalizeWords(`${user.firstName} ${user.lastName}`)}
                    subtitle={subtitleText}
                    gender={user.gender === 'F' ? 'F' : 'M'}
                    iconType="user"
                    photoUrl={user.photoUrl}
                    className="bg-white border-gray-200/80 hover:bg-slate-50/80"
                    badge={badgeElement}
                    onClick={() => {
                      dispatch(updateCurrentUser(user));
                      navigate(APP_ROUTES.admin.userDetail(user.id));
                    }}
                  />
                );
              })}

            {/* Infinite Scroll Sentinel & Load More Spinner */}
            {!loading && users.length > 0 && (
              <div ref={loadMoreRef} className="py-2 flex flex-col items-center justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 py-3 text-xs font-semibold text-gray-500">
                    <Loader2 size={18} className="animate-spin text-primary" />
                    <span>Cargando más usuarios...</span>
                  </div>
                )}
                {!loadingMore && currentPage >= totalPages && totalPages > 1 && (
                  <p className="text-xs font-medium text-gray-400 py-3">
                    Hemos llegado al final de la lista
                  </p>
                )}
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>
    </div>
  );
};

export default UserManagementView;
