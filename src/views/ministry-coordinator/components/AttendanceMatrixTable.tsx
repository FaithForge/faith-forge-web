import {
  IMatrixEventColumn,
  IMatrixVolunteerRosterItem,
  MatrixCellStatus,
  MatrixRiskLevel,
} from '@/libs/models';
import clsx from 'clsx';
import dayjs from 'dayjs';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  MinusCircle,
  Phone,
  UserMinus,
  XCircle,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaWhatsapp } from 'react-icons/fa6';
import { formatPersonFullName } from '@/libs/utils/text';

interface AttendanceMatrixTableProps {
  events: IMatrixEventColumn[];
  roster: IMatrixVolunteerRosterItem[];
  ministryName: string;
  coordinatorName: string;
  onOpenUnlinkModal: (volunteer: IMatrixVolunteerRosterItem) => void;
}

/**
 * Main Attendance Matrix Heatmap Table.
 * Renders volunteer roster with dynamic user info, rate, risk badges, event date cells
 * with state iconography, and the 3 immediate action triggers (WhatsApp, Call, Unlink).
 *
 * @param {AttendanceMatrixTableProps} props - Component properties.
 * @returns {JSX.Element} Rendered table component.
 */
export const AttendanceMatrixTable: React.FC<AttendanceMatrixTableProps> = ({
  events,
  roster,
  ministryName,
  coordinatorName,
  onOpenUnlinkModal,
}) => {
  const { t } = useTranslation(['hub', 'common']);

  if (roster.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200/80 shadow-2xs text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h4 className="text-base font-bold text-slate-800">
            {t('hub:attendance_matrix.empty_no_records_title', {
              defaultValue: 'No hay colaboradores para este filtro',
            })}
          </h4>
          <p className="text-xs text-slate-500">
            {t('hub:attendance_matrix.empty_no_records_desc', {
              defaultValue:
                'Prueba cambiando los filtros de grupo, área, ciclo o el término de búsqueda.',
            })}
          </p>
        </div>
      </div>
    );
  }

  const renderCellIcon = (cell?: {
    status: MatrixCellStatus;
    observation?: string;
  }) => {
    if (!cell) {
      return (
        <span
          className="text-slate-300 font-extrabold select-none"
          title="Sin registro"
        >
          —
        </span>
      );
    }

    switch (cell.status) {
      case MatrixCellStatus.ATTENDED:
        return (
          <div
            className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs border border-emerald-100"
            title={t('hub:attendance_matrix.status_attended', {
              defaultValue: 'Asistió',
            })}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        );

      case MatrixCellStatus.EXCUSED:
        return (
          <div
            className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto shadow-2xs border border-amber-200/80"
            title={
              cell.observation
                ? `Con Excusa: ${cell.observation}`
                : t('hub:attendance_matrix.status_excused', {
                    defaultValue: 'Con Excusa',
                  })
            }
          >
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
        );

      case MatrixCellStatus.UNEXCUSED:
        return (
          <div
            className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-2xs border border-rose-200/80"
            title={t('hub:attendance_matrix.status_unexcused', {
              defaultValue: 'Sin Excusa',
            })}
          >
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
        );

      case MatrixCellStatus.EXEMPT:
        return (
          <div
            className="w-7 h-7 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200/60"
            title={t('hub:attendance_matrix.status_exempt', {
              defaultValue: 'Exento',
            })}
          >
            <MinusCircle className="w-3.5 h-3.5 text-slate-400" />
          </div>
        );

      case MatrixCellStatus.NOT_SCHEDULED:
      default:
        return (
          <span
            className="text-slate-300 font-bold select-none text-xs"
            title={t('hub:attendance_matrix.status_not_scheduled', {
              defaultValue: 'No Convocado',
            })}
          >
            —
          </span>
        );
    }
  };

  const renderRiskBadge = (risk: MatrixRiskLevel) => {
    switch (risk) {
      case MatrixRiskLevel.CRITICAL:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-600 text-white shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            CRÍTICO
          </span>
        );
      case MatrixRiskLevel.ALERT:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-amber-500 text-white shadow-2xs">
            ALERTA
          </span>
        );
      case MatrixRiskLevel.REGULAR:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-teal-50 text-teal-800 border border-teal-200/80">
            REGULAR
          </span>
        );
      case MatrixRiskLevel.OPTIMAL:
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-700 text-white shadow-2xs">
            ÓPTIMO
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              {/* Personal / Colaborador */}
              <th className="py-3.5 pl-5 pr-3 min-w-[220px]">
                {t('hub:attendance_matrix.th_person', {
                  defaultValue: 'Personal / Colaborador',
                })}
              </th>

              {/* Tasa */}
              <th className="py-3.5 px-3 text-center min-w-[65px]">
                {t('hub:attendance_matrix.th_rate', { defaultValue: 'Tasa' })}
              </th>

              {/* Estado */}
              <th className="py-3.5 px-3 text-center min-w-[95px]">
                {t('hub:attendance_matrix.th_state', {
                  defaultValue: 'Estado',
                })}
              </th>

              {/* Event Columns */}
              {events.map((ev) => {
                const formattedDate = dayjs(ev.date).format('D MMM');
                return (
                  <th
                    key={`${ev.date}_${ev.id}`}
                    className="py-3.5 px-2 text-center min-w-[80px]"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] font-extrabold text-slate-800">
                        {formattedDate}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 lowercase first-letter:uppercase truncate max-w-[70px]">
                        {ev.meetingName}
                      </span>
                    </div>
                  </th>
                );
              })}

              {/* Acciones */}
              <th className="py-3.5 pl-3 pr-5 text-right min-w-[125px]">
                {t('hub:attendance_matrix.th_actions', {
                  defaultValue: 'Acciones',
                })}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {roster.map((volunteer) => {
              const cleanPhone = volunteer.phone
                ? volunteer.phone.replace(/\D/g, '')
                : '';
              const fullPhone = cleanPhone
                ? `${volunteer.dialCodePhone || '+57'}${cleanPhone}`.replace(
                    '+',
                    '',
                  )
                : '';

              const personName =
                formatPersonFullName(volunteer.firstName, volunteer.lastName) ||
                formatPersonFullName(volunteer.fullName);
              const formattedCoordinator =
                formatPersonFullName(coordinatorName) || 'Coordinación';

              const defaultMessage = t(
                'hub:attendance_matrix.whatsapp_message_template',
                {
                  name: personName,
                  coordinator: formattedCoordinator,
                  ministry: ministryName || 'Ministerio',
                  defaultValue: `¡Hola ${personName}! Te saluda ${formattedCoordinator} del ministerio ${ministryName}. Notamos que no has podido acompañarnos en los últimos servicios y queríamos saber cómo estás y si podemos apoyarte en algo.`,
                },
              );

              const whatsappUrl = fullPhone
                ? `https://wa.me/${fullPhone}?text=${encodeURIComponent(defaultMessage)}`
                : undefined;

              const initials =
                `${volunteer.firstName?.[0] || ''}${volunteer.lastName?.[0] || ''}`.toUpperCase() ||
                'SV';

              return (
                <tr
                  key={volunteer.assignmentId}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Colaborador */}
                  <td className="py-3 pl-5 pr-3">
                    <div className="flex items-center gap-3">
                      {volunteer.photoUrl ? (
                        <img
                          src={volunteer.photoUrl}
                          alt={personName}
                          className="w-10 h-10 rounded-2xl object-cover shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-sky-100 text-[#0284c7] font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {initials}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-[#0284c7] transition-colors">
                          {personName}
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                          {volunteer.unexcusedCount > 0 &&
                          volunteer.excusedCount > 0 ? (
                            <span className="text-amber-700 font-bold inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {volunteer.unexcusedCount} sin excusa •{' '}
                              {volunteer.excusedCount}{' '}
                              {volunteer.excusedCount === 1
                                ? 'justificada'
                                : 'justificadas'}
                            </span>
                          ) : volunteer.unexcusedCount > 0 ? (
                            <span className="text-rose-600 font-bold inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              {volunteer.unexcusedCount}{' '}
                              {volunteer.unexcusedCount === 1
                                ? 'falta sin justificar'
                                : 'faltas sin justificar'}
                            </span>
                          ) : volunteer.excusedCount > 0 ? (
                            <span className="text-amber-700 font-semibold inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {volunteer.excusedCount}{' '}
                              {volunteer.excusedCount === 1
                                ? 'justificada'
                                : 'justificadas'}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Asistencia Perfecta
                            </span>
                          )}
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400 truncate max-w-[110px]">
                            {volunteer.areaName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Tasa */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={clsx(
                        'text-xs font-black',
                        volunteer.riskLevel === MatrixRiskLevel.CRITICAL
                          ? 'text-rose-600'
                          : volunteer.riskLevel === MatrixRiskLevel.ALERT
                            ? 'text-amber-600'
                            : volunteer.riskLevel === MatrixRiskLevel.REGULAR
                              ? 'text-slate-700'
                              : 'text-emerald-700',
                      )}
                    >
                      {volunteer.attendanceRate}%
                    </span>
                  </td>

                  {/* Estado Badge */}
                  <td className="py-3 px-3 text-center">
                    {renderRiskBadge(volunteer.riskLevel)}
                  </td>

                  {/* Event Columns */}
                  {events.map((ev) => {
                    const eventKey = `${ev.date}_${ev.id}`;
                    const cell = volunteer.matrix[eventKey];
                    return (
                      <td
                        key={eventKey}
                        className="py-3 px-2 text-center align-middle"
                      >
                        {renderCellIcon(cell)}
                      </td>
                    );
                  })}

                  {/* Acciones (WhatsApp, Call, Unlink) */}
                  <td className="py-3 pl-3 pr-5 text-right">
                    <div className="inline-flex items-center gap-1 justify-end">
                      {/* WhatsApp Trigger */}
                      {whatsappUrl ? (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t('hub:attendance_matrix.action_whatsapp', {
                            defaultValue: 'Contactar por WhatsApp',
                          })}
                          className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors active:scale-95 shadow-2xs cursor-pointer"
                        >
                          <FaWhatsapp size={15} />
                        </a>
                      ) : (
                        <div
                          className="w-8 h-8 rounded-xl bg-slate-100 text-slate-300 flex items-center justify-center cursor-not-allowed"
                          title="Sin número de WhatsApp registrado"
                        >
                          <FaWhatsapp size={15} />
                        </div>
                      )}

                      {/* Phone Call Trigger */}
                      {volunteer.phone ? (
                        <a
                          href={`tel:${volunteer.phone}`}
                          title={t('hub:attendance_matrix.action_call', {
                            defaultValue: 'Llamar por teléfono',
                          })}
                          className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center transition-colors active:scale-95 shadow-2xs cursor-pointer"
                        >
                          <Phone size={14} />
                        </a>
                      ) : (
                        <div
                          className="w-8 h-8 rounded-xl bg-slate-100 text-slate-300 flex items-center justify-center cursor-not-allowed"
                          title="Sin teléfono registrado"
                        >
                          <Phone size={14} />
                        </div>
                      )}

                      {/* Administrative Unlink / Dar de baja Trigger */}
                      <button
                        type="button"
                        onClick={() => onOpenUnlinkModal(volunteer)}
                        title={t('hub:attendance_matrix.action_unlink', {
                          defaultValue: 'Dar de baja',
                        })}
                        className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-colors active:scale-95 shadow-2xs cursor-pointer"
                      >
                        <UserMinus size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceMatrixTable;
