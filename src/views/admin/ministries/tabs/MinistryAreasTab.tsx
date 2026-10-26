import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Layers,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Inbox,
  ShieldCheck,
  Stethoscope,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetMinistryAreas } from '@/libs/state/redux/thunks/church/ministry.thunk';
import { useGetKidGroupsQuery } from '@/libs/state/redux/api/kidChurchApi';
import {
  IMinistryArea,
  IMinistryWorkspaceTeam,
  MinistryAreaScope,
  MinistryAreaStateEnum,
  ServiceAreaGroupStateEnum,
} from '@/libs/models';
import { useMinistryTerm } from '@/libs/hooks/useTerm';
import MinistryAreaModal from '../components/MinistryAreaModal';
import clsx from 'clsx';

interface MinistryAreasTabProps {
  ministryId: string;
  workspaceAreas?: IMinistryArea[];
  workspaceTeams?: IMinistryWorkspaceTeam[];
  onRefreshWorkspace?: () => void;
  onNavigateToNextStep?: () => void;
}

/**
 * Tab component managing Service Areas and Classrooms for a given ministry.
 *
 * @param {MinistryAreasTabProps} props - Component props with ministryId and workspace data.
 * @returns {JSX.Element} Rendered tab content.
 */
export const MinistryAreasTab: React.FC<MinistryAreasTabProps> = ({
  ministryId,
  workspaceAreas,
  workspaceTeams,
  onRefreshWorkspace,
  onNavigateToNextStep,
}) => {
  const { t } = useTranslation('admin');
  const dispatch = useAppDispatch();
  const { areasByMinistry, loadingAreas, serviceAreaGroups } = useAppSelector(
    (state) => state.ministrySlice,
  );
  const { data: kidGroups = [] } = useGetKidGroupsQuery();

  const regTerm = useMinistryTerm(ministryId, 'registration', 'Registro de Niños');
  const moduleAlias = useMinistryTerm(ministryId, 'module_alias', 'Ministerio de Niños');
  const classroomTerm = useMinistryTerm(ministryId, 'classroom', 'Salón');

  const [modalOpen, setModalOpen] = useState(false);
  const [areaToEdit, setAreaToEdit] = useState<IMinistryArea | null>(null);

  const areas: IMinistryArea[] = useMemo(() => {
    const list = areasByMinistry[ministryId]?.length
      ? areasByMinistry[ministryId]
      : workspaceAreas || [];
    return list
      .filter((a) => a.state !== MinistryAreaStateEnum.DELETED)
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }, [areasByMinistry, ministryId, workspaceAreas]);

  useEffect(() => {
    dispatch(GetMinistryAreas({ ministryId, force: false }));
  }, [dispatch, ministryId]);

  // Map counting active service area groups per areaId
  const teamsCountByAreaId = useMemo(() => {
    const counts = new Map<string, number>();

    if (workspaceTeams && workspaceTeams.length > 0) {
      workspaceTeams.forEach((team) => {
        const aId = team.ministryAreaId;
        if (aId) {
          counts.set(aId, (counts.get(aId) || 0) + 1);
        }
      });
    } else if (serviceAreaGroups && serviceAreaGroups.length > 0) {
      serviceAreaGroups.forEach((sag) => {
        if (sag.state !== ServiceAreaGroupStateEnum.DELETED && sag.ministryAreaId) {
          counts.set(sag.ministryAreaId, (counts.get(sag.ministryAreaId) || 0) + 1);
        }
      });
    }

    return counts;
  }, [workspaceTeams, serviceAreaGroups]);

  const handleOpenCreate = () => {
    setAreaToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (area: IMinistryArea) => {
    setAreaToEdit(area);
    setModalOpen(true);
  };

  const getAssignedClassroomNames = (area: IMinistryArea): string[] => {
    const ids: string[] = [];
    if (area.kidGroupId) ids.push(area.kidGroupId);
    if (Array.isArray(area.kidGroupIds)) {
      area.kidGroupIds.forEach((id) => {
        if (!ids.includes(id)) ids.push(id);
      });
    }
    if (Array.isArray(area.kidGroups)) {
      area.kidGroups.forEach((kg: any) => {
        const id = kg.kidGroupId || kg.id;
        if (id && !ids.includes(id)) ids.push(id);
      });
    }

    if (ids.length === 0) return [];

    return ids
      .map((id) => {
        const group = (kidGroups || []).find((g) => g.id === id);
        return group ? group.name : null;
      })
      .filter(Boolean) as string[];
  };

  /**
   * Formats the classroom badge text according to the number of assigned classrooms.
   *
   * @param {string[]} names - Array of assigned classroom names.
   * @returns {string} Formatted label summarizing the assigned classrooms.
   */
  const formatClassroomBadgeText = (names: string[]): string => {
    if (names.length === 0) return `${classroomTerm} asignado`;
    if (kidGroups && kidGroups.length > 0 && names.length >= kidGroups.length) {
      return `Todos los ${classroomTerm.toLowerCase()}es (${names.length})`;
    }
    if (names.length === 1) {
      return `${classroomTerm}: ${names[0]}`;
    }
    if (names.length === 2) {
      return `${classroomTerm}es: ${names[0]}, ${names[1]}`;
    }
    return `${classroomTerm}es: ${names.slice(0, 2).join(', ')} (+${names.length - 2})`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header action bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0">
              <Layers size={15} />
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              {t('admin:ministry_structure.areas.header_title', {
                defaultValue: '2. Áreas de Servicio',
              })}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {t('admin:ministry_structure.areas.header_desc', {
              defaultValue:
                'Configura las áreas de servicio donde sirven tus voluntarios (ej. Cunas, Párvulos, Registro, Alabanza).',
            })}
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          size="sm"
          className="text-xs gap-1.5 py-2 px-3 shrink-0 self-start sm:self-center"
        >
          <Plus size={14} />{' '}
          {t('admin:ministry_structure.areas.btn_new', { defaultValue: 'Nueva Área' })}
        </Button>
      </div>

      {/* Areas List */}
      {loadingAreas && areas.length === 0 ? (
        <CellListSkeleton count={3} />
      ) : areas.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200/90 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Inbox size={24} />
          </div>
          <div className="max-w-md">
            <h3 className="text-sm font-bold text-slate-800">
              {t('admin:ministry_structure.areas.empty_title', {
                defaultValue: 'No hay áreas de servicio configuradas',
              })}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {t('admin:ministry_structure.areas.empty_desc', {
                defaultValue:
                  'Crea las estaciones de trabajo o salones infantiles (ej: Cunas, Párvulos, Registro) para organizar los equipos de voluntarios.',
              })}
            </p>
          </div>
          <Button onClick={handleOpenCreate} size="sm" className="mt-2 text-xs gap-1.5">
            <Plus size={14} />{' '}
            {t('admin:ministry_structure.areas.btn_create_first', {
              defaultValue: 'Crear Primera Área',
            })}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {areas.map((area) => {
            const classroomNames = getAssignedClassroomNames(area);
            const hasClassroom =
              classroomNames.length > 0 ||
              Boolean(area.kidGroupId) ||
              (Array.isArray(area.kidGroups) && area.kidGroups.length > 0);
            const teamsCount = teamsCountByAreaId.get(area.id) || 0;
            const isAreaActive = area.state === MinistryAreaStateEnum.ACTIVE;

            return (
              <div
                key={area.id}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                      area.scope === MinistryAreaScope.KID_MEDICAL
                        ? 'bg-rose-50 text-rose-600 border-rose-200/80'
                        : area.scope === MinistryAreaScope.KID_REGISTRATION
                          ? 'bg-amber-50 text-amber-600 border-amber-200/80'
                          : area.scope === MinistryAreaScope.KID_SECURITY
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
                            : 'bg-teal-50 text-teal-600 border-teal-100',
                    )}
                  >
                    {area.scope === MinistryAreaScope.KID_MEDICAL ? (
                      <Stethoscope size={18} />
                    ) : (
                      <Layers size={18} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-extrabold text-slate-900 truncate">
                        {area.name}
                      </h3>

                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0',
                          isAreaActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : 'bg-slate-100 text-slate-600 border border-slate-200',
                        )}
                      >
                        {isAreaActive ? (
                          <>
                            <CheckCircle2 size={10} /> Activa
                          </>
                        ) : (
                          <>
                            <XCircle size={10} /> Inactiva
                          </>
                        )}
                      </span>

                      {/* Scope Badge */}
                      {area.scope === MinistryAreaScope.KID_REGISTRATION && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0">
                          <ShieldCheck size={10} /> {regTerm} (Check-in)
                        </span>
                      )}
                      {area.scope === MinistryAreaScope.KID_GROUP_MANAGEMENT && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shrink-0">
                          <ShieldCheck size={10} /> {moduleAlias}
                        </span>
                      )}
                      {area.scope === MinistryAreaScope.KID_SECURITY && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                          <ShieldCheck size={10} /> Seguridad
                        </span>
                      )}
                      {area.scope === MinistryAreaScope.KID_MEDICAL && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shrink-0">
                          <Stethoscope size={10} /> Doctores / Médicos
                        </span>
                      )}

                      {/* Classroom Assignment Badge */}
                      {hasClassroom && (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80 shrink-0 max-w-[260px] sm:max-w-[340px]"
                          title={classroomNames.length > 0 ? classroomNames.join(', ') : undefined}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                          <span className="truncate">{formatClassroomBadgeText(classroomNames)}</span>
                        </span>
                      )}

                      {/* Generated teams badge */}
                      {teamsCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <Layers size={10} className="text-slate-400" />
                          <span>
                            {t('admin:ministry_structure.areas.teams_badge_plural', {
                              count: teamsCount,
                              defaultValue: `${teamsCount} equipos en esta sede`,
                            })}
                          </span>
                        </span>
                      )}
                    </div>

                    {area.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{area.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(area)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    title={t('common:actions.edit', { defaultValue: 'Editar Área' })}
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
      {areas.length > 0 && onNavigateToNextStep && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs mt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                {t('admin:ministry_structure.areas.next_step_prompt', {
                  defaultValue:
                    '¿Tienes listas tus áreas? El siguiente paso es generar los Equipos concretos por Sede (Área × Grupo).',
                })}
              </p>
            </div>
          </div>
          <Button
            onClick={onNavigateToNextStep}
            variant="default"
            size="sm"
            className="text-xs gap-1.5 shrink-0 self-end sm:self-center bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            <span>
              {t('admin:ministry_structure.areas.btn_next_step', {
                defaultValue: 'Continuar al Paso 3: Equipos por Sede',
              })}
            </span>
            <ArrowRight size={13} />
          </Button>
        </div>
      )}

      <MinistryAreaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        ministryId={ministryId}
        areaToEdit={areaToEdit}
        onSuccess={() => {
          dispatch(GetMinistryAreas({ ministryId, force: true }));
          onRefreshWorkspace?.();
        }}
      />
    </div>
  );
};

export default MinistryAreasTab;
