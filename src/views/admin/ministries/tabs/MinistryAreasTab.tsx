import React, { useEffect, useState } from 'react';
import { Layers, Plus, Edit2, CheckCircle2, XCircle, Inbox } from 'lucide-react';
import Button from '@/components/ui/Button';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetMinistryAreas } from '@/libs/state/redux/thunks/church/ministry.thunk';
import { IMinistryArea } from '@/libs/models';
import MinistryAreaModal from '../components/MinistryAreaModal';
import clsx from 'clsx';

interface MinistryAreasTabProps {
  ministryId: string;
}

/**
 * Tab component managing Service Areas for a given ministry.
 *
 * @param {MinistryAreasTabProps} props - Component props with ministryId.
 * @returns {JSX.Element} Rendered tab content.
 */
export const MinistryAreasTab: React.FC<MinistryAreasTabProps> = ({ ministryId }) => {
  const dispatch = useAppDispatch();
  const { areasByMinistry, loadingAreas } = useAppSelector((state) => state.ministrySlice);

  const [modalOpen, setModalOpen] = useState(false);
  const [areaToEdit, setAreaToEdit] = useState<IMinistryArea | null>(null);

  const areas = areasByMinistry[ministryId] || [];

  useEffect(() => {
    dispatch(GetMinistryAreas({ ministryId, force: false }));
  }, [dispatch, ministryId]);

  const handleOpenCreate = () => {
    setAreaToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (area: IMinistryArea) => {
    setAreaToEdit(area);
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header action bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Áreas de Servicio</h2>
          <p className="text-xs text-gray-500">
            {areas.length} {areas.length === 1 ? 'área configurada' : 'áreas configuradas'}
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="text-xs gap-1.5 py-1.5">
          <Plus size={14} /> Nueva Área
        </Button>
      </div>

      {/* Areas List */}
      {loadingAreas && areas.length === 0 ? (
        <CellListSkeleton count={3} />
      ) : areas.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-200/80 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-gray-400">
            <Inbox size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">No hay áreas de servicio</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Crea áreas como Regikids, SaludKids o Alabanza para organizar los equipos.
            </p>
          </div>
          <Button onClick={handleOpenCreate} size="sm" className="mt-2 text-xs">
            <Plus size={14} /> Crear Primera Área
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {areas.map((area) => (
            <div
              key={area.id}
              className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex items-center justify-between gap-3 hover:border-gray-300 transition-all"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Layers size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{area.name}</h3>
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0',
                        area.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : 'bg-gray-100 text-gray-600 border border-gray-200',
                      )}
                    >
                      {area.active ? (
                        <>
                          <CheckCircle2 size={10} /> Activa
                        </>
                      ) : (
                        <>
                          <XCircle size={10} /> Inactiva
                        </>
                      )}
                    </span>
                  </div>
                  {area.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{area.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(area)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-slate-100 transition-colors"
                  title="Editar Área"
                >
                  <Edit2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <MinistryAreaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        ministryId={ministryId}
        areaToEdit={areaToEdit}
      />
    </div>
  );
};

export default MinistryAreasTab;
