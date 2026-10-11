import React from 'react';
import { Users, Building2 } from 'lucide-react';

export interface ServerDistributionStats {
  classroomAreasCount: number;
  classroomAttendedTotal: number;
  classroomAssignedTotal: number;
  classroomAttendedTeachers: number;
  classroomAttendedSupervisors: number;
  otherAreasCount: number;
  otherAreasAttendedTotal: number;
  otherAreasAssignedTotal: number;
  otherAreasAttendedTeachers: number;
  otherAreasAttendedSupervisors: number;
}

export interface ServerDistributionCardsProps {
  stats: ServerDistributionStats;
  classroomsTerm: string;
  volunteersTerm: string;
  teachersTerm: string;
  supervisorsTerm: string;
  otherAreasTerm?: string;
}

/**
 * Visual distribution cards breaking down active servers across classrooms vs other ministry areas.
 * Displays attendance completion ratios and teacher/supervisor percentages.
 *
 * @param {ServerDistributionCardsProps} props - Component properties.
 * @returns {JSX.Element} Rendered cards.
 */
export const ServerDistributionCards: React.FC<ServerDistributionCardsProps> = ({
  stats,
  classroomsTerm,
  volunteersTerm,
  teachersTerm,
  supervisorsTerm,
  otherAreasTerm = 'Otras Áreas',
}) => {
  return (
    <div className="space-y-3.5">
      {/* Card 1: Personal en Salones */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight truncate">
                Personal en {classroomsTerm}
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-tight">
                {stats.classroomAreasCount} {classroomsTerm.toLowerCase()} asignados(as)
              </p>
            </div>
          </div>

          <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 shrink-0">
            {stats.classroomAttendedTotal} / {stats.classroomAssignedTotal} {volunteersTerm}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <div className="bg-slate-50 rounded-2xl p-3 sm:p-3.5 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                {stats.classroomAttendedTeachers}
              </span>
              <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded-full shadow-2xs border border-slate-200/80">
                {stats.classroomAttendedTotal > 0
                  ? Math.round((stats.classroomAttendedTeachers / stats.classroomAttendedTotal) * 100)
                  : 0}%
              </span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-700 mt-2">{teachersTerm}</div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3 sm:p-3.5 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                {stats.classroomAttendedSupervisors}
              </span>
              <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded-full shadow-2xs border border-slate-200/80">
                {stats.classroomAttendedTotal > 0
                  ? Math.round((stats.classroomAttendedSupervisors / stats.classroomAttendedTotal) * 100)
                  : 0}%
              </span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-700 mt-2">{supervisorsTerm}</div>
          </div>
        </div>
      </div>

      {/* Card 2: Personal en Otras Áreas */}
      {stats.otherAreasCount > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight truncate">
                  Personal en {otherAreasTerm}
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-tight">
                  {stats.otherAreasCount} áreas activas
                </p>
              </div>
            </div>

            <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 shrink-0">
              {stats.otherAreasAttendedTotal} / {stats.otherAreasAssignedTotal} {volunteersTerm}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="bg-slate-50 rounded-2xl p-3 sm:p-3.5 border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                  {stats.otherAreasAttendedTeachers}
                </span>
                <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded-full shadow-2xs border border-slate-200/80">
                  {stats.otherAreasAttendedTotal > 0
                    ? Math.round((stats.otherAreasAttendedTeachers / stats.otherAreasAttendedTotal) * 100)
                    : 0}%
                </span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 mt-2">{teachersTerm}</div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 sm:p-3.5 border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                  {stats.otherAreasAttendedSupervisors}
                </span>
                <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded-full shadow-2xs border border-slate-200/80">
                  {stats.otherAreasAttendedTotal > 0
                    ? Math.round((stats.otherAreasAttendedSupervisors / stats.otherAreasAttendedTotal) * 100)
                    : 0}%
                </span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 mt-2">{supervisorsTerm}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerDistributionCards;
