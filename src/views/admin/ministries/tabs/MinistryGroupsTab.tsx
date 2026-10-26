import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users2,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Inbox,
  ArrowRight,
  Layers,
  Sparkles,
  RotateCw,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetMinistryGroupConfigs } from '@/libs/state/redux/thunks/church/ministry.thunk';
import {
  IMinistryGroupConfig,
  IMinistryWorkspaceTeam,
  MinistryGroupConfigStateEnum,
  ServiceAreaGroupStateEnum,
} from '@/libs/models';
import MinistryGroupModal from '../components/MinistryGroupModal';
import clsx from 'clsx';

interface MinistryGroupsTabProps {
  ministryId: string;
  workspaceGroups?: IMinistryGroupConfig[];
  workspaceTeams?: IMinistryWorkspaceTeam[];
  onNavigateToNextStep?: () => void;
}

/**
 * Tab component managing Custom Groups Configuration (Shift Cycles) for a given ministry.
 *
 * @param {MinistryGroupsTabProps} props - Component props with ministryId and workspace data.
 * @returns {JSX.Element} Rendered tab content.
 */
export const MinistryGroupsTab: React.FC<MinistryGroupsTabProps> = ({
  ministryId,
  workspaceGroups,
  workspaceTeams,
  onNavigateToNextStep,
}) => {
  const { t } = useTranslation('admin');
  const dispatch = useAppDispatch();
  const { groupsByMinistry, loadingGroups, serviceAreaGroups } = useAppSelector(
    (state) => state.ministrySlice,
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<IMinistryGroupConfig | null>(null);

  const rawGroups = (
    groupsByMinistry[ministryId]?.length
      ? groupsByMinistry[ministryId]
      : workspaceGroups || []
  ).filter((g) => g.state !== MinistryGroupConfigStateEnum.DELETED);

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

  // Map counting active service area groups per groupConfigId
  const teamsCountByGroupId = useMemo(() => {
    const counts = new Map<string, number>();

    // Priority to workspaceTeams if provided, else serviceAreaGroups
    if (workspaceTeams && workspaceTeams.length > 0) {
      workspaceTeams.forEach((team) => {
        const gId = team.ministryGroupConfigId;
        if (gId) {
          counts.set(gId, (counts.get(gId) || 0) + 1);
        }
      });
    } else if (serviceAreaGroups && serviceAreaGroups.length > 0) {
      serviceAreaGroups.forEach((sag) => {
        if (sag.state !== ServiceAreaGroupStateEnum.DELETED && sag.ministryGroupConfigId) {
          counts.set(sag.ministryGroupConfigId, (counts.get(sag.ministryGroupConfigId) || 0) + 1);
        }
      });
    }

    return counts;
  }, [workspaceTeams, serviceAreaGroups]);

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
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
              <Users2 size={15} />
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              {t('admin:ministry_structure.groups.header_title', {
                defaultValue: '1. Grupos de Rotación y Turnos',
              })}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {t('admin:ministry_structure.groups.header_desc', {
              defaultValue:
                'Configura los turnos que se alternan periódicamente en el calendario. Cada grupo reúne voluntarios de todas las áreas para servir en su fecha asignada.',
            })}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50/70 border border-purple-100 text-[11px] text-purple-800 font-medium">
            <RotateCw size={11} className="text-purple-600 shrink-0" />
            <span>
              {t('admin:ministry_structure.groups.tip_order', {
                defaultValue:
                  'La posición define el turno en la rotación: Posición 1 ➔ Posición 2 ➔ Posición 3...',
              })}
            </span>
          </div>
        </div>

        <Button
          onClick={handleOpenCreate}
          size="sm"
          className="text-xs gap-1.5 py-2 px-3 shrink-0 self-start sm:self-center"
        >
          <Plus size={14} />{' '}
          {t('admin:ministry_structure.groups.btn_new', { defaultValue: 'Nuevo Grupo' })}
        </Button>
      </div>

      {/* Groups List */}
      {loadingGroups && sortedGroups.length === 0 ? (
        <CellListSkeleton count={3} />
      ) : sortedGroups.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200/90 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Inbox size={24} />
          </div>
          <div className="max-w-md">
            <h3 className="text-sm font-bold text-slate-800">
              {t('admin:ministry_structure.groups.empty_title', {
                defaultValue: 'No hay grupos de rotación configurados',
              })}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {t('admin:ministry_structure.groups.empty_desc', {
                defaultValue:
                  '¿En cuántos turnos se alternan los servidores en tu iglesia? Generalmente se usan 2 grupos (quincenal) o 4 grupos (mensual).',
              })}
            </p>
          </div>
          <Button onClick={handleOpenCreate} size="sm" className="mt-2 text-xs gap-1.5">
            <Plus size={14} />{' '}
            {t('admin:ministry_structure.groups.btn_create_first', {
              defaultValue: 'Crear Primer Grupo',
            })}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sortedGroups.map((group) => {
            const teamsCount = teamsCountByGroupId.get(group.id) || 0;
            const isGroupActive = group.state === MinistryGroupConfigStateEnum.ACTIVE;

            return (
              <div
                key={group.id}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                    <Users2 size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-extrabold text-slate-900 truncate">
                        {group.name}
                      </h3>

                      {/* Turn order in rotation */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
                        <RotateCw size={10} className="text-purple-600" />
                        <span>
                          {t('admin:ministry_structure.groups.turn_order_badge', {
                            position: group.position,
                            defaultValue: `Turno ${group.position} en la rotación`,
                          })}
                        </span>
                      </span>

                      {/* Linked teams badge */}
                      {teamsCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <Layers size={10} className="text-slate-400" />
                          <span>
                            {t('admin:ministry_structure.groups.teams_badge_plural', {
                              count: teamsCount,
                              defaultValue: `${teamsCount} equipos en esta sede`,
                            })}
                          </span>
                        </span>
                      )}

                      {/* State badge */}
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0',
                          isGroupActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : 'bg-slate-100 text-slate-600 border border-slate-200',
                        )}
                      >
                        {isGroupActive ? (
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
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    title={t('common:actions.edit', { defaultValue: 'Editar Grupo' })}
                  >
                    <Edit2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Next Step Guideway Banner */}
      {sortedGroups.length > 0 && onNavigateToNextStep && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs mt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                {t('admin:ministry_structure.groups.next_step_prompt', {
                  defaultValue:
                    '¿Tienes listos tus grupos de rotación? El siguiente paso es configurar las Áreas de Servicio.',
                })}
              </p>
            </div>
          </div>
          <Button
            onClick={onNavigateToNextStep}
            variant="default"
            size="sm"
            className="text-xs gap-1.5 shrink-0 self-end sm:self-center bg-teal-700 hover:bg-teal-800 text-white"
          >
            <span>
              {t('admin:ministry_structure.groups.btn_next_step', {
                defaultValue: 'Continuar al Paso 2: Áreas de Servicio',
              })}
            </span>
            <ArrowRight size={13} />
          </Button>
        </div>
      )}

      <MinistryGroupModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        ministryId={ministryId}
        groupToEdit={groupToEdit}
        defaultPosition={nextDefaultPosition}
        onSuccess={() => {
          dispatch(GetMinistryGroupConfigs({ ministryId, force: true }));
        }}
      />
    </div>
  );
};

export default MinistryGroupsTab;
