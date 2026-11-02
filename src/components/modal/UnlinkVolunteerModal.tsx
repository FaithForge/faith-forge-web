import AppModal from '@/components/ui/AppModal';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { IMatrixVolunteerRosterItem, MatrixRiskLevel } from '@/libs/models';
import { useDeleteVolunteerAssignmentMutation } from '@/libs/state/redux/api/churchApi';
import clsx from 'clsx';
import { AlertTriangle, UserMinus } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { formatPersonFullName } from '@/libs/utils/text';

interface UnlinkVolunteerModalProps {
  open: boolean;
  onClose: () => void;
  volunteer: IMatrixVolunteerRosterItem | null;
  onSuccess?: () => void;
}

/**
 * Confirmation modal for unlinking or ending a volunteer assignment.
 * Displays volunteer performance stats, shows an emphatic warning if the volunteer
 * has REGULAR or OPTIMAL attendance, and requires a mandatory justification reason.
 *
 * @param {UnlinkVolunteerModalProps} props - Component properties.
 * @returns {JSX.Element | null} Rendered modal dialog.
 */
export const UnlinkVolunteerModal: React.FC<UnlinkVolunteerModalProps> = ({
  open,
  onClose,
  volunteer,
  onSuccess,
}) => {
  useModalBackClose(open, onClose);
  const { t } = useTranslation(['hub', 'common']);
  const [deleteVolunteerAssignment, { isLoading }] =
    useDeleteVolunteerAssignmentMutation();

  const [endedReason, setEndedReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEndedReason('');
      setValidationError(null);
    }
  }, [open]);

  if (!open || !volunteer) return null;

  const isGoodStanding =
    volunteer.riskLevel === MatrixRiskLevel.REGULAR ||
    volunteer.riskLevel === MatrixRiskLevel.OPTIMAL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = endedReason.trim();
    if (trimmed.length < 10) {
      setValidationError(
        t('hub:attendance_matrix.unlink_modal.reason_validation_min', {
          defaultValue: 'El motivo debe tener al menos 10 caracteres.',
        }),
      );
      return;
    }

    try {
      await deleteVolunteerAssignment({
        assignmentId: volunteer.assignmentId,
        endedReason: trimmed,
      }).unwrap();

      toast.success(
        t('hub:attendance_matrix.unlink_modal.toast_success', {
          defaultValue: 'Asignación finalizada correctamente.',
        }),
      );
      onSuccess?.();
      onClose();
    } catch {
      toast.error(
        t('hub:attendance_matrix.unlink_modal.toast_error', {
          defaultValue: 'No se pudo finalizar la asignación. Intenta de nuevo.',
        }),
      );
    }
  };

  return (
    <AppModal
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      onClose={onClose}
      title={t('hub:attendance_matrix.unlink_modal.title', {
        defaultValue: 'Dar de Baja del Ministerio',
      })}
      maxHeight="max-h-[92dvh]"
    >
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
        {/* Header Icon + Description */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <UserMinus className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              {formatPersonFullName(volunteer.fullName)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {volunteer.areaName} • {volunteer.groupName}
            </p>
          </div>
        </div>

        {/* Emphatic Warning Banner for Regular or Optimal Volunteers */}
        {isGoodStanding && (
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-900 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {t(
                  'hub:attendance_matrix.unlink_modal.warning_regular_optimal_title',
                  {
                    defaultValue: 'Atención: Colaborador con buen cumplimiento',
                  },
                )}
              </span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              {t(
                'hub:attendance_matrix.unlink_modal.warning_regular_optimal_desc',
                {
                  status:
                    volunteer.riskLevel === MatrixRiskLevel.OPTIMAL
                      ? 'Óptimo'
                      : 'Regular',
                  rate: volunteer.attendanceRate,
                  defaultValue: `Esta persona se encuentra en estado ${volunteer.riskLevel === MatrixRiskLevel.OPTIMAL ? 'Óptimo' : 'Regular'} con una tasa del ${volunteer.attendanceRate}%. Desvincular a un servidor con buen historial no es recomendable salvo por causa mayor o solicitud expresa.`,
                },
              )}
            </p>
          </div>
        )}

        {/* Volunteer Stats Summary Card */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">
              {t('hub:attendance_matrix.unlink_modal.field_rate', {
                defaultValue: 'Tasa de asistencia:',
              })}
            </span>
            <span
              className={clsx(
                'font-extrabold text-sm',
                volunteer.attendanceRate <= 30
                  ? 'text-rose-600'
                  : volunteer.attendanceRate <= 59
                    ? 'text-amber-600'
                    : 'text-emerald-700',
              )}
            >
              {volunteer.attendanceRate}%
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-medium block">
              {t('hub:attendance_matrix.unlink_modal.field_unexcused', {
                defaultValue: 'Faltas sin justificar:',
              })}
            </span>
            <span className="font-extrabold text-sm text-slate-800">
              {volunteer.unexcusedCount}{' '}
              {volunteer.unexcusedCount === 1 ? 'falta' : 'faltas'}
            </span>
          </div>
        </div>

        {/* Mandatory Justification Textarea */}
        <div className="space-y-1.5">
          <Textarea
            label={t('hub:attendance_matrix.unlink_modal.reason_label', {
              defaultValue: 'Motivo de la finalización de la asignación *',
            })}
            placeholder={t(
              'hub:attendance_matrix.unlink_modal.reason_placeholder',
              {
                defaultValue:
                  'Describe detalladamente la justificación de la baja (mínimo 10 caracteres)...',
              },
            )}
            value={endedReason}
            onChange={(e) => {
              setEndedReason(e.target.value);
              if (validationError && e.target.value.trim().length >= 10) {
                setValidationError(null);
              }
            }}
            rows={3}
            error={validationError || undefined}
            required
            className="placeholder:text-gray-400 text-xs font-normal"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('hub:attendance_matrix.unlink_modal.btn_cancel', {
              defaultValue: 'Cancelar',
            })}
          </Button>

          <Button
            type="submit"
            variant="danger"
            loading={isLoading}
            disabled={isLoading || endedReason.trim().length < 10}
            className="bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
          >
            {t('hub:attendance_matrix.unlink_modal.btn_confirm', {
              defaultValue: 'Confirmar Baja',
            })}
          </Button>
        </div>
      </form>
    </AppModal>
  );
};

export default UnlinkVolunteerModal;
