import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import { APP_ROUTES } from "@/config/routes";
import Cell from '@/components/ui/Cell';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetKids, GetMoreKids } from '@/libs/state/redux/thunks/kid-church/kid.thunk';
import { updateCurrentKid } from '@/libs/state/redux/slices/kid-church/kid.slice';
import { Loader2, Search, SearchX, RotateCcw, Plus, Lightbulb } from 'lucide-react';
import dayjs from 'dayjs';
import { IsAdmin, IsAdminKidChurch, IsAdminKidRegisterChurch, UserRole } from '@/libs/utils/auth';
import { capitalizeWords } from '@/libs/utils/text';
import { isDateToday } from '@/libs/utils/date';
import { KID_AGE_COPY, isKidOverage } from '@/libs/common-types/constants';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';

import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';

const RegistrationDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchText, setSearchText] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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

  // Infinite Scroll logic via IntersectionObserver
  const handleLoadMore = React.useCallback(async () => {
    if (loading || loadingMore || currentPage >= totalPages) return;
    setLoadingMore(true);
    try {
      await dispatch(GetMoreKids({ findText: searchText })).unwrap();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, currentPage, totalPages, dispatch, searchText]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !isConfigured || shouldBlockKids) return;

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
  }, [handleLoadMore, currentPage, totalPages, loading, loadingMore, isConfigured, shouldBlockKids]);

  return (
    <div className="p-3 flex flex-col gap-3 min-h-full flex-1 pb-28 sm:pb-32">
      {/* Search Bar */}
      <div className="sticky top-0 z-20 bg-background py-2 -mx-3 px-3">
        <Input 
          icon="search" 
          placeholder={shouldBlockKids ? "Búsqueda no disponible" : "Buscar niño por nombre o código"}
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
          title="Falta configuración"
          message="Por favor, selecciona una sede, servicio e impresora en la opción de Configuración de la barra inferior."
        />
      )}

      {/* Servicio e Impresora Actual */}
      {isConfigured && currentPrinter && currentMeeting && (
        <Alert 
          type="info"
          title={`Impresora: ${currentPrinter.name}`}
          message={`Reunión: ${currentMeeting.name} (${currentCampus?.name || ''})`}
          className="bg-cyan-100 text-cyan-800 border-cyan-200"
        />
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
          <h3 className="text-lg font-bold text-gray-700 mb-1">Fuera de horario</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            La búsqueda y el registro de niños se encuentran bloqueados temporalmente para proteger la información.
          </p>
        </div>
      )}

      {/* Lista de Niños */}
      {!shouldBlockKids && (
        <PullToRefresh onRefresh={handleRefreshKids} disabled={loading} className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-col gap-2 mt-1 flex-1 min-h-0">
            {loading && isConfigured && <CellListSkeleton count={7} />}
            
            {!loading && kids.length === 0 && isConfigured && (
              <div className="flex flex-col items-center justify-center py-8 px-5 mt-2 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-xs animate-in fade-in duration-200">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3 shadow-xs border border-amber-100">
                  <SearchX size={28} />
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-1">
                  {searchText ? 'No se encontraron niños' : 'Directorio de niños'}
                </h3>
                <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                  {searchText ? (
                    <>
                      No encontramos resultados para <span className="font-semibold text-gray-800">"{searchText}"</span>.
                    </>
                  ) : (
                    'Busca un niño para registrar su asistencia en el servicio actual.'
                  )}
                </p>

                {/* Consejos de Búsqueda */}
                <div className="mt-3.5 p-3 bg-gray-50/90 rounded-xl border border-gray-200/80 text-left max-w-sm w-full">
                  <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5 mb-1.5">
                    <Lightbulb size={13} className="text-amber-500 shrink-0" />
                    Consejos para encontrar al niño:
                  </span>
                  <ul className="text-[11px] text-gray-600 space-y-1.5 list-disc list-inside">
                    <li>
                      Puedes <strong>abreviar</strong> nombre y apellido (ej:{' '}
                      <span className="font-semibold text-gray-800">Ju Marti</span> o{' '}
                      <span className="font-semibold text-gray-800">Mat Gom</span>).
                    </li>
                    <li>
                      Busca <strong>solo por su primer nombre</strong> (ej:{' '}
                      <span className="font-medium text-gray-800">Mateo</span>).
                    </li>
                    <li>
                      Busca <strong>solo por apellido</strong> anteponiendo un espacio (ej:{' '}
                      <span className="font-semibold text-gray-800">" Pérez"</span>).
                    </li>
                    <li>
                      O escribe directamente su <strong>código numérico</strong>.
                    </li>
                  </ul>
                </div>

                <p className="text-xs text-gray-500 max-w-sm mt-3 leading-relaxed">
                  Si tras probar estas opciones el niño aún no aparece, procede a crearlo en el sistema:
                </p>

                <div className="flex items-center gap-2 mt-3.5 flex-wrap justify-center">
                  {searchText && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-xl transition-all"
                    >
                      <RotateCcw size={14} />
                      <span>Limpiar búsqueda</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(APP_ROUTES.kidRegistration.new)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 active:scale-95 rounded-xl transition-all shadow-xs"
                  >
                    <Plus size={14} />
                    <span>Crear niño</span>
                  </button>
                </div>
              </div>
            )}

            {!loading && kids.map((kid) => {
              const isRegistered = !!kid.currentKidRegistration;
              const overage = isKidOverage(kid);
              const isBday = isDateToday(kid.birthday);

              let subtitleText = `Código: ${kid.faithForgeId || kid.id}`;
              let showOverageStyle = false;

              if (isRegistered) {
                subtitleText = `Código: ${kid.faithForgeId || kid.id}${
                  kid.currentKidRegistration?.date ? ` • a las ${dayjs(kid.currentKidRegistration.date).format('h:mm:ss A')}` : ''
                }`;
              } else if (overage) {
                subtitleText = KID_AGE_COPY.maxAgeDashboardSubtitle;
                showOverageStyle = true;
              }

              const badgeElement = (
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  {isBday && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300 flex items-center gap-1 animate-pulse">
                      🎂 Hoy
                    </span>
                  )}
                  {overage && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-800 rounded-full border border-red-200">
                      {KID_AGE_COPY.maxAgeBadge}
                    </span>
                  )}
                  {isRegistered && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                      Registrado
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

            {/* Infinite Scroll Sentinel & Load More Spinner */}
            {!loading && kids.length > 0 && (
              <div ref={loadMoreRef} className="py-2 flex flex-col items-center justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 py-3 text-xs font-semibold text-gray-500">
                    <Loader2 size={18} className="animate-spin text-primary" />
                    <span>Cargando más niños...</span>
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
      )}
      
    </div>
  );
};

export default RegistrationDashboard;
