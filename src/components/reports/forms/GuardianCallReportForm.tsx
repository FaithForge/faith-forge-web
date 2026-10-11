import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import clsx from 'clsx';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { IKid, IKidGuardian, KID_RELATION_CODE_MAPPER } from '@/libs/models';
import {
  ReportPriority,
  ReportStatus,
  ReportType,
} from '@/libs/models/ChurchReport';
import { useCreateChurchReportMutation } from '@/libs/state/redux/api/churchApi';
import { formatPersonShortName } from '@/libs/utils/text';
import { KidSelector } from '../KidSelector';

interface GuardianCallReportFormProps {
  churchCampusId: string;
  churchMeetingId?: string;
  serviceAreaGroupId?: string;
  ministryId?: string;
  date: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Global form for logging phone calls made to parents/guardians during church services.
 *
 * @param {GuardianCallReportFormProps} props - Operational IDs and success/cancel callbacks.
 * @returns {JSX.Element} Rendered guardian call form.
 */
export const GuardianCallReportForm: React.FC<GuardianCallReportFormProps> = ({
  churchCampusId,
  churchMeetingId,
  serviceAreaGroupId,
  ministryId,
  date,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const [createReport, { isLoading }] = useCreateChurchReportMutation();

  const [selectedKid, setSelectedKid] = useState<IKid | null>(null);

  // Selected guardian from kid's relations
  const [selectedGuardianId, setSelectedGuardianId] = useState<string | null>(null);
  const [guardianRelationship, setGuardianRelationship] = useState('');

  const [reason, setReason] = useState('');

  const guardians: IKidGuardian[] = selectedKid?.relations || [];
  const registeredGuardianId = selectedKid?.currentKidRegistration?.guardianId;

  const handleSelectGuardian = (g: IKidGuardian) => {
    setSelectedGuardianId(g.id);
    setGuardianRelationship(KID_RELATION_CODE_MAPPER[g.relation] || g.relation || '');
  };

  // Auto-select the guardian who checked the kid in today
  useEffect(() => {
    if (!selectedKid) {
      setSelectedGuardianId(null);
      setGuardianRelationship('');
      return;
    }

    if (guardians.length > 0 && !selectedGuardianId) {
      const primaryGuardian =
        guardians.find((g) => g.id === registeredGuardianId) || guardians[0];
      if (primaryGuardian) handleSelectGuardian(primaryGuardian);
    }
  }, [selectedKid, guardians, registeredGuardianId, selectedGuardianId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedKid || !selectedGuardianId) {
      toast.error(t('reports.actions.toast_error', { ns: 'kidChurch' }));
      return;
    }

    if (!reason.trim()) {
      toast.error(t('reports.actions.toast_error', { ns: 'kidChurch' }));
      return;
    }

    try {
      await createReport({
        churchCampusId,
        churchMeetingId: churchMeetingId || undefined,
        serviceAreaGroupId: serviceAreaGroupId || undefined,
        ministryId: ministryId || undefined,
        date,
        type: ReportType.GUARDIAN_CALL,
        priority: ReportPriority.LOW,
        status: ReportStatus.INFORMATIVE,
        details: {
          kidId: selectedKid.id,
          guardianId: selectedGuardianId,
          reason: reason.trim(),
          guardianRelationship: guardianRelationship.trim() || undefined,
        },
      }).unwrap();

      toast.success(t('reports.actions.toast_created', { ns: 'kidChurch' }));
      onSuccess?.();
    } catch {
      toast.error(t('reports.actions.toast_error', { ns: 'kidChurch' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Kid Selector without previewing duplicate guardians block */}
      <KidSelector
        selectedKid={selectedKid}
        onSelectKid={(k) => {
          setSelectedKid(k);
          setSelectedGuardianId(null);
          setGuardianRelationship('');
        }}
        churchMeetingId={churchMeetingId}
        date={date}
        showGuardiansPreview={false}
      />

      {/* Selectable Guardians list from selected kid */}
      <div className="space-y-2">
        <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide text-gray-700">
          {t('reports.guardian_call_fields.guardian_label', { ns: 'kidChurch' })} <span className="text-red-500">*</span>
        </label>

        {!selectedKid ? (
          <div className="p-3 bg-gray-50 border border-gray-200/60 rounded-xl text-center text-xs text-gray-500">
            {t('reports.guardian_call_fields.select_kid_first', { ns: 'kidChurch' })}
          </div>
        ) : guardians.length === 0 ? (
          <div className="p-3 bg-gray-50 border border-gray-200/60 rounded-xl flex items-center justify-center gap-2 text-xs text-gray-500">
            <Loader2 size={14} className="animate-spin text-amber-600" />
            <span>{t('reports.guardian_call_fields.loading_guardians', { ns: 'kidChurch' })}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {guardians.map((g) => {
              const isSelected = selectedGuardianId === g.id;
              const isCheckInGuardian =
                registeredGuardianId && g.id === registeredGuardianId;
              const relationLabel =
                KID_RELATION_CODE_MAPPER[g.relation] || g.relation || 'Acudiente';

              return (
                <label
                  key={g.id}
                  className={clsx(
                    'flex items-center gap-2.5 p-2.5 border-2 rounded-xl cursor-pointer transition-colors relative',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-gray-50 hover:bg-gray-100',
                  )}
                >
                  <input
                    type="radio"
                    name="selectedGuardianRadio"
                    checked={isSelected}
                    onChange={() => handleSelectGuardian(g)}
                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-xs text-gray-800 truncate">
                        {formatPersonShortName(`${g.firstName} ${g.lastName}`)}
                      </p>
                      <span className="font-semibold text-gray-500 text-[11px]">
                        ({relationLabel})
                      </span>
                      {isCheckInGuardian && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">
                          {t('reports.guardian_call_fields.registered_by_badge', {
                            ns: 'kidChurch',
                          })}
                        </span>
                      )}
                    </div>
                    {g.phone && (
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        Tel: {g.phone}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Reason for call */}
      <Textarea
        label={t('reports.guardian_call_fields.reason', { ns: 'kidChurch' })}
        required
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t('reports.guardian_call_fields.reason_placeholder', { ns: 'kidChurch' })}
      />

      {/* Action Buttons */}
      <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
        <Button
          type="submit"
          block
          variant="primary"
          size="md"
          loading={isLoading}
        >
          <CheckCircle2 size={18} className="mr-2 shrink-0" />
          {isLoading
            ? t('reports.actions.saving', { ns: 'kidChurch' })
            : t('reports.actions.save_and_notify', {
                ns: 'kidChurch',
                defaultValue: 'Guardar y Notificar Novedad',
              })}
        </Button>

        {onCancel && (
          <Button
            type="button"
            block
            variant="default"
            size="md"
            disabled={isLoading}
            onClick={onCancel}
          >
            {t('reports.actions.cancel', { ns: 'kidChurch' })}
          </Button>
        )}
      </div>
    </form>
  );
};
