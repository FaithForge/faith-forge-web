import React, { useEffect, useState, useMemo } from 'react';
import { RefreshCw, Search, Users, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import dayjs from 'dayjs';
import Cell from '@/components/ui/Cell';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import TagKidGroup from '@/components/ui/TagKidGroup';
import KidDetailsDrawer from '@/components/modal/KidDetailsDrawer';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetKidGroups, GetKidGroupRegistered } from '@/libs/state/redux/thunks/kid-church/kid-group.thunk';
import { IKid, IKidGroup, UserGenderCode } from '@/libs/models';
import { capitalizeWords } from '@/libs/utils/text';
import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';
import PullToRefresh from '@/components/ui/PullToRefresh';

/**
 * Main dashboard for Iglekids (Coordinators, Supervisors, Teachers).
 * Displays live attendance statistics per classroom and registered kids for today's service.
 *
 * @returns {JSX.Element}
 */
const KidChurchDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentMeeting, currentCampus, isConfigured } = useChurchMeetingStatus();

  const { data: kids, loading } = useAppSelector((state) => state.kidGroupRegisteredSlice);
  const kidGroups = useAppSelector((state) => state.kidGroupSlice.data);

  const [searchText, setSearchText] = useState('');
  const [selectedKidGroupId, setSelectedKidGroupId] = useState<string>('');
  const [selectedKid, setSelectedKid] = useState<IKid | undefined>(undefined);
  const [openKidDrawer, setOpenKidDrawer] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial load of groups and registered kids
  useEffect(() => {
    dispatch(GetKidGroups({}));
    if (currentMeeting?.id) {
      dispatch(GetKidGroupRegistered({ date: new Date() }));
    }
  }, [dispatch, currentMeeting?.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(GetKidGroupRegistered({ date: new Date() })).unwrap();
      toast.success('Registros de salones actualizados');
    } catch {
      toast.error('Error al actualizar los registros');
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

    if (searchText.trim()) {
      const search = searchText.toLowerCase().trim();
      result = result.filter((kid: IKid) => {
        const fullName = `${kid.firstName || ''} ${kid.lastName || ''}`.toLowerCase();
        const code = String(kid.faithForgeId || kid.id || '').toLowerCase();
        return fullName.includes(search) || code.includes(search);
      });
    }

    return result;
  }, [kids, selectedKidGroupId, searchText]);

  const handleKidClick = (kid: IKid) => {
    setSelectedKid(kid);
    setOpenKidDrawer(true);
  };

  return (
    <div className="p-3 flex flex-col gap-3 min-h-screen pb-28 relative">
      {/* Service Info Banner */}
      {isConfigured && currentMeeting ? (
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
              {currentCampus?.name || 'Sede'}
            </span>
            <h2 className="text-base font-black text-gray-800 truncate">
              {currentMeeting.name}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-xl shrink-0 font-black text-sm">
            <Users size={16} />
            <span>{kids.length} {kids.length === 1 ? 'niño' : 'niños'}</span>
          </div>
        </div>
      ) : (
        <Alert
          type="error"
          title="Falta configuración"
          message="Por favor, selecciona una sede y servicio en la opción de Configuración de la barra inferior."
        />
      )}

      {/* Search Input */}
      <div className="sticky top-0 z-20 bg-background pt-1 pb-1 flex flex-col gap-2 -mx-3 px-3">
        <Input
          icon="search"
          placeholder="Buscar niño en salones..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onClear={() => setSearchText('')}
          wrapperClassName="mb-0"
          className="border-0 shadow-sm text-base bg-white focus:ring-0"
        />
      </div>

      {/* Iglekids Classrooms (Exactly 3 rows) */}
      {kidGroups && kidGroups.length > 0 && (
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
              Salones de Iglekids
            </span>
            {selectedKidGroupId && (
              <button
                type="button"
                onClick={() => setSelectedKidGroupId('')}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                Ver todos
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Rows 1 and 2: First 6 classrooms (2 rows of 3 columns) */}
            {kidGroups.slice(0, 6).map((group: IKidGroup) => {
              const isSelected = selectedKidGroupId === group.id;
              const count = kids.filter((k: IKid) => k.kidGroup?.id === group.id).length;

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedKidGroupId(isSelected ? '' : group.id)}
                  className={clsx(
                    'p-2 rounded-xl text-center border-2 transition-all flex flex-col items-center justify-center active:scale-95',
                    isSelected
                      ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30'
                      : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-700'
                  )}
                >
                  <p className={clsx('text-[11px] font-bold truncate w-full', isSelected ? 'text-primary' : 'text-gray-800')}>
                    {group.name}
                  </p>
                  <span className={clsx('text-xs font-extrabold mt-0.5', isSelected ? 'text-primary' : 'text-gray-500')}>
                    {count} {count === 1 ? 'niño' : 'niños'}
                  </span>
                </button>
              );
            })}

            {/* Row 3: "Yo Soy Iglekids" (full width col-span-3) */}
            {kidGroups.length > 6 &&
              kidGroups.slice(6, 7).map((group: IKidGroup) => {
                const isSelected = selectedKidGroupId === group.id;
                const count = kids.filter((k: IKid) => k.kidGroup?.id === group.id).length;

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setSelectedKidGroupId(isSelected ? '' : group.id)}
                    className={clsx(
                      'col-span-3 py-2 px-4 rounded-xl text-center border-2 transition-all flex items-center justify-between active:scale-98',
                      isSelected
                        ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30'
                        : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    <span className={clsx('text-xs font-bold', isSelected ? 'text-primary' : 'text-gray-800')}>
                      {group.name}
                    </span>
                    <span className={clsx('text-xs font-extrabold', isSelected ? 'text-primary' : 'text-gray-500')}>
                      {count} {count === 1 ? 'niño' : 'niños'}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Registered Kids List */}
      <PullToRefresh onRefresh={handleRefresh} disabled={loading || isRefreshing}>
        <div className="flex flex-col gap-2 mt-1">
          {loading && (
            <div className="flex flex-col items-center justify-center p-8 text-gray-400 gap-2">
              <RefreshCw size={24} className="animate-spin text-primary" />
              <span className="text-xs font-medium">Cargando salones...</span>
            </div>
          )}

          {!loading && filteredKids.length === 0 && (
            <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
              <Users size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-gray-600">No hay niños registrados en esta vista</p>
              <p className="text-xs text-gray-400 mt-1">
                {searchText ? 'Intenta con otro término de búsqueda.' : 'Los niños aparecerán aquí una vez registrados en la entrada.'}
              </p>
            </div>
          )}

          {!loading &&
            filteredKids.map((kid: IKid) => {
              const ageYears = Math.floor(kid.age ?? 0);
              const ageMonths = kid.ageInMonths ? kid.ageInMonths - ageYears * 12 : 0;
              const subtitleText = `Salón: ${kid.kidGroup?.name || 'Sin salón'} • ${ageYears} años ${ageMonths > 0 ? `y ${ageMonths}m` : ''}`;

              const badgeElement = (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                    En Salón
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
      </PullToRefresh>

      {/* Floating Action Button (FAB) for Reload */}
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={clsx(
          'fixed right-5 bottom-24 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center z-40 transition-transform active:scale-90 hover:shadow-2xl',
          isRefreshing && 'opacity-70 cursor-not-allowed'
        )}
        title="Actualizar salones"
      >
        <RefreshCw size={24} className={clsx(isRefreshing && 'animate-spin')} />
      </button>

      {/* Kid Details Bottom Sheet */}
      <KidDetailsDrawer
        open={openKidDrawer}
        onOpenChange={setOpenKidDrawer}
        kid={selectedKid}
      />
    </div>
  );
};

export default KidChurchDashboard;
