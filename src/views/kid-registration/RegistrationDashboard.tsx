import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import { APP_ROUTES } from "@/config/routes";
import Cell from '@/components/ui/Cell';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetKids } from '@/libs/state/redux/thunks/kid-church/kid.thunk';
import { updateCurrentKid } from '@/libs/state/redux/slices/kid-church/kid.slice';
import { Loader2 } from 'lucide-react';
import dayjs from 'dayjs';
import { IsAdmin, IsAdminKidChurch, IsAdminKidRegisterChurch, UserRole } from '@/libs/utils/auth';
import { capitalizeWords } from '@/libs/utils/text';
import { KID_AGE_COPY, isKidOverage } from '@/libs/common-types/constants';

import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';

const RegistrationDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchText, setSearchText] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: kids, loading } = useAppSelector((state) => state.kidSlice);
  
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

  // Search logic with debounce
  useEffect(() => {
    if (!isConfigured || shouldBlockKids) return; // Don't search if not configured or blocked
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      dispatch(GetKids({ findText: searchText }));
    }, 500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [searchText, isConfigured, shouldBlockKids, dispatch, currentMeeting?.id]);

  return (
    <div className="p-3 flex flex-col gap-3">
      {/* Search Bar */}
      <div className="sticky top-0 z-20 bg-background py-2 -mx-3 px-3">
        <Input 
          icon="search" 
          placeholder={shouldBlockKids ? "Búsqueda no disponible" : "Buscar niño por nombre o código"}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
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
        <div className="flex flex-col gap-2 mt-1">
          {loading && isConfigured && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" size={24} /></div>}
          
          {!loading && kids.length === 0 && isConfigured && (
            <div className="text-center p-8 text-gray-500">
              {searchText ? "No se encontraron niños." : "Busca un niño por nombre o documento."}
            </div>
          )}

          {!loading && kids.map((kid) => {
            const isRegistered = !!kid.currentKidRegistration;
            const overage = isKidOverage(kid);
            const isBday = (() => {
              if (!kid.birthday) return false;
              const str = typeof kid.birthday === 'string' ? kid.birthday : new Date(kid.birthday).toISOString();
              if (str.length >= 10 && str.includes('-')) {
                const parts = str.substring(0, 10).split('-');
                if (parts.length === 3) {
                  return `${parts[1]}-${parts[2]}` === dayjs().format('MM-DD');
                }
              }
              return dayjs(kid.birthday).format('MM-DD') === dayjs().format('MM-DD');
            })();

            let subtitleText = `Codigo: ${kid.faithForgeId || kid.id}`;
            let showOverageStyle = false;

            if (isRegistered) {
              subtitleText = `Codigo: ${kid.faithForgeId || kid.id}${
                kid.currentKidRegistration?.date ? ` • a las ${dayjs(kid.currentKidRegistration.date).format('h:mm:ss A')}` : ''
              }`;
            } else if (overage) {
              subtitleText = KID_AGE_COPY.maxAgeDashboardSubtitle;
              showOverageStyle = true;
            }

            const badgeElement = (
              <div className="flex items-center gap-1.5 shrink-0">
                {isBday && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300 flex items-center gap-1 animate-pulse">
                    🎂 Hoy
                  </span>
                )}
                {isRegistered ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                    Registrado
                  </span>
                ) : overage ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-800 rounded-full border border-red-200">
                    {KID_AGE_COPY.maxAgeBadge}
                  </span>
                ) : null}
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
      
    </div>
  );
};

export default RegistrationDashboard;
