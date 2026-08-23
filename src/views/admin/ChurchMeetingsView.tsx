import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CalendarClock, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  EyeOff, 
  XCircle, 
  Loader2, 
  Save, 
  RotateCcw,
  Sparkles,
  CalendarDays
} from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { 
  GetChurchCampuses, 
  GetAllChurchMeetingsAdmin, 
  BulkUpdateChurchMeetingStates 
} from '@/libs/state/redux/thunks/church/church.thunk';
import { resetAdminChurchMeetingStatus } from '@/libs/state/redux/slices/church/adminChurchMeeting.slice';
import { ChurchMeetingStateEnum, IChurchMeeting } from '@/libs/models';
import { Days } from '@/libs/common-types/constants';
import { APP_ROUTES } from '@/config/routes';
import SelectSearch from '@/components/ui/SelectSearch';
import Button from '@/components/ui/Button';

// ---------------------------------------------------------------------------
// Constantes y Diccionarios de Apoyo
// ---------------------------------------------------------------------------

const DAY_LABEL: Record<Days, string> = {
  [Days.MONDAY]: 'Lunes',
  [Days.TUESDAY]: 'Martes',
  [Days.WEDNESDAY]: 'Miércoles',
  [Days.THURSDAY]: 'Jueves',
  [Days.FRIDAY]: 'Viernes',
  [Days.SATURDAY]: 'Sábado',
  [Days.SUNDAY]: 'Domingo',
};

const DAY_ORDER: Record<Days, number> = {
  [Days.SUNDAY]: 0,
  [Days.MONDAY]: 1,
  [Days.TUESDAY]: 2,
  [Days.WEDNESDAY]: 3,
  [Days.THURSDAY]: 4,
  [Days.FRIDAY]: 5,
  [Days.SATURDAY]: 6,
};

const STATE_CONFIG: Record<
  ChurchMeetingStateEnum,
  {
    label: string;
    shortLabel: string;
    icon: React.ElementType;
    activeClass: string;
    badgeClass: string;
    textClass: string;
  }
> = {
  [ChurchMeetingStateEnum.ACTIVE]: {
    label: 'Activo',
    shortLabel: 'Activo',
    icon: CheckCircle2,
    activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    textClass: 'text-emerald-600',
  },
  [ChurchMeetingStateEnum.ACTIVE_WITHOUT_DISPLAY]: {
    label: 'Activo sin pantalla',
    shortLabel: 'Sin pantalla',
    icon: EyeOff,
    activeClass: 'bg-amber-500 text-white border-amber-500 shadow-xs',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    textClass: 'text-amber-600',
  },
  [ChurchMeetingStateEnum.DISABLE]: {
    label: 'Inactivo',
    shortLabel: 'Inactivo',
    icon: XCircle,
    activeClass: 'bg-rose-600 text-white border-rose-600 shadow-xs',
    badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    textClass: 'text-rose-600',
  },
};

/**
 * Normaliza y formatea cualquier formato de hora (string ISO, HH:mm:ss o HH:mm) a "HH:mm".
 *
 * @param {unknown} val - Valor original proveniente del servicio backend.
 * @returns {string} Hora formateada en "HH:mm" o string vacío.
 */
const formatTime = (val: unknown): string => {
  if (!val) return '';
  const str = String(val);
  if (str.includes('T')) {
    const part = str.split('T')[1]?.split('.')[0]?.split('Z')[0] ?? '';
    const [h, m] = part.split(':');
    return h && m ? `${h}:${m}` : '';
  }
  if (str.includes(':')) {
    const [h, m] = str.split(':');
    return h && m ? `${h}:${m}` : '';
  }
  return '';
};

// ---------------------------------------------------------------------------
// Componente de Tarjeta de Servicio (Meeting Card)
// ---------------------------------------------------------------------------

interface MeetingCardProps {
  meeting: IChurchMeeting;
  currentState: ChurchMeetingStateEnum;
  isModified: boolean;
  onStateChange: (state: ChurchMeetingStateEnum) => void;
}

/**
 * Tarjeta individual para visualizar y cambiar el estado de un servicio.
 *
 * @param {MeetingCardProps} props - Propiedades del componente.
 * @returns {JSX.Element} Tarjeta interactiva del servicio.
 */
const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  currentState,
  isModified,
  onStateChange,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = meeting as any;
  const initTime = formatTime(m.initialRegistrationHour ?? m.initialHour);
  const finalTime = formatTime(m.finalRegistrationHour ?? m.finalHour);
  const config = STATE_CONFIG[currentState] || STATE_CONFIG[ChurchMeetingStateEnum.ACTIVE];
  const CurrentIcon = config.icon;

  return (
    <div
      className={clsx(
        'bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-xs flex flex-col gap-3.5',
        isModified
          ? 'border-primary/60 bg-primary/2 shadow-primary/5 ring-1 ring-primary/20'
          : 'border-gray-200/80 hover:border-gray-300'
      )}
    >
      {/* Encabezado del Servicio */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-sm sm:text-base text-gray-900 leading-tight">
              {meeting.name}
            </h3>
            {isModified && (
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 animate-in fade-in">
                Modificado
              </span>
            )}
          </div>
          {meeting.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
              {meeting.description}
            </p>
          )}
        </div>

        {/* Badge del Estado Actual */}
        <div
          className={clsx(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shrink-0',
            config.badgeClass
          )}
        >
          <CurrentIcon size={13} className="shrink-0" />
          <span>{config.label}</span>
        </div>
      </div>

      {/* Horario y Detalles */}
      {(initTime || finalTime) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <Clock size={13} className="text-gray-400" />
          <span>
            Horario de Registro: <strong className="text-gray-700">{initTime} – {finalTime}</strong>
          </span>
        </div>
      )}

      {/* Selector de Estado en Segmentos (Pills) */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-gray-200/70">
        {Object.values(ChurchMeetingStateEnum).map((stateKey) => {
          const itemConfig = STATE_CONFIG[stateKey];
          const ItemIcon = itemConfig.icon;
          const isSelected = currentState === stateKey;

          return (
            <button
              key={stateKey}
              type="button"
              onClick={() => onStateChange(stateKey)}
              className={clsx(
                'flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all duration-150',
                isSelected
                  ? itemConfig.activeClass
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60 bg-transparent'
              )}
            >
              <ItemIcon size={14} className={isSelected ? 'text-white' : itemConfig.textClass} />
              <span className="truncate">{itemConfig.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Vista Principal
// ---------------------------------------------------------------------------

/**
 * Vista de Administración para gestionar los estados de los servicios por sede.
 * Permite cambiar estados de forma individual o masiva y guardarlos vía PATCH /church-meeting/bulk-state.
 *
 * @returns {JSX.Element} Componente renderizado de la vista.
 */
const ChurchMeetingsView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const campuses = useAppSelector((state) => state.churchCampusSlice);
  const { meetings, loadingMeetings, loadingUpdate, error, success } =
    useAppSelector((state) => state.adminChurchMeetingSlice);

  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  /** Registro local de cambios pendientes: meetingId -> nuevo estado */
  const [pendingChanges, setPendingChanges] = useState<Record<string, ChurchMeetingStateEnum>>({});

  // Cargar sedes al montar la vista
  useEffect(() => {
    if (campuses.data.length === 0) {
      dispatch(GetChurchCampuses());
    }
  }, [dispatch, campuses.data.length]);

  // Autoseleccionar la primera sede disponible si no hay una seleccionada
  useEffect(() => {
    if (!selectedCampusId && campuses.data.length > 0) {
      setSelectedCampusId(campuses.data[0].id);
    }
  }, [campuses.data, selectedCampusId]);

  // Cargar los servicios de la sede seleccionada
  useEffect(() => {
    if (selectedCampusId) {
      dispatch(resetAdminChurchMeetingStatus());
      dispatch(GetAllChurchMeetingsAdmin(selectedCampusId));
      setPendingChanges({});
    }
  }, [selectedCampusId, dispatch]);

  // Notificaciones de éxito y error
  useEffect(() => {
    if (success) {
      toast.success('Estados de servicios actualizados correctamente');
      dispatch(resetAdminChurchMeetingStatus());
      setPendingChanges({});
      if (selectedCampusId) {
        dispatch(GetAllChurchMeetingsAdmin(selectedCampusId));
      }
    }
    if (error) {
      toast.error(error);
      dispatch(resetAdminChurchMeetingStatus());
    }
  }, [success, error, selectedCampusId, dispatch]);

  /**
   * Maneja el cambio de estado de un servicio, revirtiéndolo si coincide con el original.
   *
   * @param {string} meetingId - ID del servicio.
   * @param {ChurchMeetingStateEnum | undefined} originalState - Estado original proveniente del servidor.
   * @param {ChurchMeetingStateEnum} newState - Nuevo estado seleccionado.
   */
  const handleStateChange = useCallback(
    (
      meetingId: string,
      originalState: ChurchMeetingStateEnum | undefined,
      newState: ChurchMeetingStateEnum
    ) => {
      setPendingChanges((prev) => {
        const updated = { ...prev };
        if (newState === originalState) {
          delete updated[meetingId];
        } else {
          updated[meetingId] = newState;
        }
        return updated;
      });
    },
    []
  );

  /**
   * Descarta todos los cambios locales pendientes.
   */
  const handleDiscardChanges = () => {
    setPendingChanges({});
    toast.info('Cambios pendientes descartados');
  };

  /**
   * Guarda todos los cambios pendientes en bloque mediante la API.
   */
  const handleSave = () => {
    const items = Object.entries(pendingChanges).map(([id, state]) => ({ id, state }));
    if (items.length === 0) return;
    dispatch(BulkUpdateChurchMeetingStates(items));
  };

  const dirtyCount = Object.keys(pendingChanges).length;

  // Agrupación de servicios por día de la semana, ordenados de Domingo a Sábado
  const meetingsByDay = useMemo(() => {
    const grouped: Record<string, IChurchMeeting[]> = {};
    [...meetings]
      .sort((a, b) => {
        const dA = DAY_ORDER[a.day as Days] ?? 99;
        const dB = DAY_ORDER[b.day as Days] ?? 99;
        return dA - dB;
      })
      .forEach((m) => {
        const key = m.day || Days.SUNDAY;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(m);
      });
    return grouped;
  }, [meetings]);

  const campusOptions = useMemo(() => {
    return campuses.data.map((campus) => ({
      id: campus.id,
      name: campus.name,
    }));
  }, [campuses.data]);

  const selectedCampusName = campuses.data.find((c) => c.id === selectedCampusId)?.name ?? '';

  return (
    <div className="min-h-full bg-slate-50/60 pb-28">
      {/* TopBar Header con botón de regresar */}
      <div 
        className="bg-primary text-primary-foreground p-4 sticky -top-1 z-30 shadow-md flex items-center justify-between"
        style={{
          boxShadow: '0 -6px 0 0 var(--color-primary), 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
      >
        <button
          type="button"
          onClick={() => navigate(APP_ROUTES.admin.root)}
          className="p-1 hover:bg-white/10 rounded-full transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft size={22} />
          <span className="font-bold text-base">Estado de Servicios</span>
        </button>
        <div className="w-6" /> {/* Spacer */}
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Card de Encabezado Informativo */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
            <Sparkles size={14} />
            <span>Módulo de Servicios</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Disponibilidad por Sede
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Controla qué servicios están activos para registro, activos sin pantalla o inhabilitados.
          </p>
        </div>

        {/* Selector de Sede */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <MapPin size={14} />
            </div>
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Sede (Campus)
            </h2>
          </div>

          <SelectSearch
            label=""
            placeholder="Seleccionar sede..."
            options={campusOptions}
            value={selectedCampusId}
            onChange={(val) => setSelectedCampusId(val)}
            searchable={campusOptions.length > 4}
            disabled={campuses.loading}
          />
        </div>

        {/* Listado de Servicios */}
        {selectedCampusId && (
          <div className="flex flex-col gap-5">
            {loadingMeetings ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-200/80 shadow-xs text-center flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="animate-spin text-primary" />
                <p className="text-sm font-medium text-gray-500">Cargando servicios de la sede...</p>
              </div>
            ) : meetings.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-200/80 shadow-xs text-center flex flex-col items-center justify-center gap-2">
                <CalendarClock size={40} className="text-gray-300" />
                <h3 className="font-bold text-gray-800 text-base mt-2">No hay servicios registrados</h3>
                <p className="text-xs text-gray-500 max-w-sm">
                  Esta sede no cuenta con servicios configurados actualmente en el sistema.
                </p>
              </div>
            ) : (
              <>
                {/* Resumen de Servicios */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                      {selectedCampusName}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs font-semibold text-gray-600">
                      {meetings.length} servicio{meetings.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {dirtyCount > 0 && (
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 animate-in fade-in">
                      {dirtyCount} cambio{dirtyCount !== 1 ? 's' : ''} pendiente{dirtyCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Agrupación por Días */}
                {Object.entries(meetingsByDay).map(([day, dayMeetings]) => (
                  <div key={day} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <CalendarDays size={13} />
                      </div>
                      <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        {DAY_LABEL[day as Days] ?? day} ({dayMeetings.length})
                      </h3>
                    </div>

                    <div className="flex flex-col gap-3">
                      {dayMeetings.map((meeting) => {
                        const effectiveState =
                          pendingChanges[meeting.id] ?? meeting.state ?? ChurchMeetingStateEnum.ACTIVE;
                        const isModified = pendingChanges[meeting.id] !== undefined;

                        return (
                          <MeetingCard
                            key={meeting.id}
                            meeting={meeting}
                            currentState={effectiveState}
                            isModified={isModified}
                            onStateChange={(newState) =>
                              handleStateChange(meeting.id, meeting.state, newState)
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Barra de Acciones Flotante Fija */}
      {dirtyCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-2xl p-4 animate-in slide-in-from-bottom duration-300">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              type="button"
              onClick={handleDiscardChanges}
              disabled={loadingUpdate}
              className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold text-xs hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RotateCcw size={16} />
              <span>Descartar</span>
            </button>

            <Button
              type="button"
              variant="primary"
              block
              disabled={loadingUpdate}
              onClick={handleSave}
              className="py-3 font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              {loadingUpdate ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save size={18} /> Guardar {dirtyCount} Cambio{dirtyCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChurchMeetingsView;
