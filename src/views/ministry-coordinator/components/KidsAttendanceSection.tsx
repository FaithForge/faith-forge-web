import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaChild } from 'react-icons/fa6';
import { School } from 'lucide-react';
import { IKidsMeetingStatHistory, IKidsMeetingStatClassroomBreakdown } from '@/libs/models/Ministry';
import { useKidsTerm } from '@/libs/hooks/useTerm';

interface KidsAttendanceSectionProps {
  kidsStats: IKidsMeetingStatHistory;
}

/**
 * Specialized statistical section for Children's Ministries (`KIDS`).
 * Displays child check-in volume, new kids, classroom distribution,
 * and gender demographics directly from the persisted history structure.
 *
 * @param {KidsAttendanceSectionProps} props - Section properties.
 * @returns {JSX.Element} Rendered child attendance section.
 */
export const KidsAttendanceSection: React.FC<KidsAttendanceSectionProps> = ({ kidsStats }) => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const kidsModuleName = useKidsTerm('module_alias');
  const kidsTerm = t('common:kids', { defaultValue: 'Niños' });
  const classroomsName = useKidsTerm('classrooms');

  const {
    totalKids = 0,
    newKids = 0,
    boys = 0,
    girls = 0,
    byClassroom = [],
  } = kidsStats;

  const totalGender = boys + girls;
  const boysPercent = totalGender > 0 ? Math.round((boys / totalGender) * 100) : 50;
  const girlsPercent = totalGender > 0 ? 100 - boysPercent : 50;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 text-white flex items-center justify-center">
              <FaChild className="w-3.5 h-3.5" />
            </div>
            <span>
              {t('kidChurch:attendance.kids_title', {
                defaultValue: `Asistencia de ${kidsTerm} (${kidsModuleName})`,
              })}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('kidChurch:attendance.kids_subtitle', {
              defaultValue: 'Ingresos por reunión, relación con servidores, salones y demografía',
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              {t('kidChurch:new_kids', { defaultValue: 'Niños Nuevos' })}
            </span>
            <span className="text-base font-black text-amber-600 leading-none">
              {kidsStats.newKids ?? 0}
            </span>
          </div>
          <div className="text-right border-l border-slate-200 pl-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              {t('common:total', { defaultValue: 'Total Niños' })}
            </span>
            <span className="text-base font-black text-slate-900 leading-none">
              {totalKids}
            </span>
          </div>
        </div>
      </div>

      {totalKids === 0 ? (
        <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          {t('common:empty.no_kid_attendance', {
            defaultValue: 'No se encontraron registros de ingreso de niños en el período o servicios seleccionados.',
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Gender Demographics Bar */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2.5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                <span>
                  {boys} {t('common:boys', { defaultValue: 'Niños' })} ({boysPercent}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>
                  {girls} {t('common:girls', { defaultValue: 'Niñas' })} ({girlsPercent}%)
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" />
              </div>
            </div>

            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${boysPercent}%` }}
                className="bg-sky-500 h-full transition-all"
                title={`Niños: ${boys}`}
              />
              <div
                style={{ width: `${girlsPercent}%` }}
                className="bg-pink-500 h-full transition-all"
                title={`Niñas: ${girls}`}
              />
            </div>
          </div>

          {/* Classrooms Breakdown */}
          {byClassroom.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <School className="w-4 h-4 text-indigo-500" />
                <span>
                  {t('kidChurch:classrooms.distribution', {
                    defaultValue: `Distribución por ${classroomsName}`,
                  })}
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {byClassroom.map((room: IKidsMeetingStatClassroomBreakdown) => {
                  const roomPercent = totalKids > 0
                    ? Math.round((room.totalKids / totalKids) * 100)
                    : 0;

                  return (
                    <div
                      key={room.classroomId}
                      className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-200 hover:shadow-2xs transition-all space-y-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {room.classroomName}
                          </h4>
                          {room.ageRange && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {room.ageRange}
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-black text-indigo-600 block leading-none">
                            {room.totalKids}
                          </span>
                          {room.newKids !== undefined && room.newKids > 0 && (
                            <span className="text-[10px] font-semibold text-amber-600">
                              +{room.newKids} nuevos
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          style={{ width: `${roomPercent}%` }}
                          className="bg-indigo-500 h-full rounded-full transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KidsAttendanceSection;
