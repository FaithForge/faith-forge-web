import React, { useEffect, useMemo, useState } from 'react';
import { Users2, Plus, Edit2, CheckCircle2, XCircle, Inbox, ArrowDownUp } from 'lucide-react';
import Button from '@/components/ui/Button';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetMinistryGroupConfigs } from '@/libs/state/redux/thunks/church/ministry.thunk';
import { IMinistryGroupConfig } from '@/libs/models';
import MinistryGroupModal from '../components/MinistryGroupModal';
import clsx from 'clsx';

interface MinistryGroupsTabProps {
  ministryId: string;
}

/**
 * Tab component managing Custom Groups Configuration for a given ministry.
 *
 * @param {MinistryGroupsTabProps} props - Component props with ministryId.
 * @returns {JSX.Element} Rendered tab content.
 */
export const MinistryGroupsTab: React.FC<MinistryGroupsTabProps> = ({ ministryId }) => {
  const dispatch = useAppDispatch();
  const { groupsByMinistry, loadingGroups } = useAppSelector((state) => state.ministrySlice);

  const [modalOpen, setModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<IMinistryGroupConfig | null>(null);

  const rawGroups = groupsByMinistry[ministryId] || [];

  useEffect(() => {
    dispatch(GetMinistryGroupConfigs({ ministryId, force: false }));
  }, [dispatch, ministryId]);

  const sortedGroups = useMemo(() => {
    return [...rawGroups].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [rawGroups]);

  const nextDefaultPosition = useMemo(() => {
    if (rawGroups.length === 0) return 1;
    const maxPos = Math.max(...rawGroups.map((g) => g.position ?? 0));
    return maxPos + 1;
  }, [rawGroups]);

  const handleOpenCreate = () => {
    setGroupToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (group: IMinistryGroupConfig) => {
    setGroupToEdit(group);
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header action bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Grupos de Servicio</h2>
          <p className="text-xs text-gray-500">
            {sortedGroups.length}{' '}
            {sortedGroups.length === 1 ? 'grupo configurado' : 'grupos configurados'}
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="text-xs gap-1.5 py-1.5">
          <Plus size={14} /> Nuevo Grupo
        </Button>
      </div>

      {/* Groups List */}
      {loadingGroups && sortedGroups.length === 0 ? (
        <CellListSkeleton count={3} />
      ) : sortedGroups.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-200/80 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-gray-400">
            <Inbox size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">No hay grupos configurados</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Configura grupos como Grupo 1, Grupo 2, o Turno Mañana/Tarde para este ministerio.
            </p>
          </div>
          <Button onClick={handleOpenCreate} size="sm" className="mt-2 text-xs">
            <Plus size={14} /> Crear Primer Grupo
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sortedGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex items-center justify-between gap-3 hover:border-gray-300 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                  <Users2 size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{group.name}</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <ArrowDownUp size={10} /> Posición {group.position}
                    </span>
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0',
                        group.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : 'bg-gray-100 text-gray-600 border border-gray-200',
                      )}
                    >
                      {group.active ? (
                        <>
                          <CheckCircle2 size={10} /> Activo
                        </>
                      ) : (
                        <>
                          <XCircle size={10} /> Inactivo
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(group)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-slate-100 transition-colors"
                  title="Editar Grupo"
                >
                  <Edit2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <MinistryGroupModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        ministryId={ministryId}
        groupToEdit={groupToEdit}
        defaultPosition={nextDefaultPosition}
      />
    </div>
  );
};

export default MinistryGroupsTab;
