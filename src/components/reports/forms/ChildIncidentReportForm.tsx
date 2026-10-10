import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import Button from '@/components/ui/Button';
import { PhotoUploadZone } from '@/components/ui/PhotoUploadZone';
import SelectSearch from '@/components/ui/SelectSearch';
import Textarea from '@/components/ui/Textarea';
import { IKid } from '@/libs/models';
import {
  GuardianExplanationOption,
  MedicalAttentionType,
  ReportPriority,
  ReportStatus,
  ReportType,
} from '@/libs/models/ChurchReport';
import {
  useCreateChurchReportMutation,
  useGetVolunteerAttendanceQuery,
} from '@/libs/state/redux/api/churchApi';
import { KidSelector } from '../KidSelector';

interface ChildIncidentReportFormProps {
  churchCampusId: string;
  churchMeetingId?: string;
  serviceAreaGroupId?: string;
  ministryId?: string;
  date: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Global form for reporting child incidents during church services.
 *
 * @param {ChildIncidentReportFormProps} props - Operational IDs and success/cancel callbacks.
 * @returns {JSX.Element} Rendered form component.
 */
export const ChildIncidentReportForm: React.FC<ChildIncidentReportFormProps> = ({
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
  const [description, setDescription] = useState('');
  const [medicalAttentionType, setMedicalAttentionType] = useState<MedicalAttentionType>(
    MedicalAttentionType.NOT_REQUIRED,
  );
  const [attendingDoctorVolunteerId, setAttendingDoctorVolunteerId] = useState('');
  const [guardianExplanation, setGuardianExplanation] = useState<GuardianExplanationOption>(
    GuardianExplanationOption.YES_WELL,
  );
  const [photos, setPhotos] = useState<string[]>([]);

  const { data: volunteerAttendances = [] } = useGetVolunteerAttendanceQuery(
    { churchMeetingId: churchMeetingId || undefined, limit: 100 },
    { skip: !churchMeetingId },
  );

  const doctorOptions = useMemo(() => {
    return volunteerAttendances.map((att) => {
      const user = att.volunteerAssignment?.user;
      const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Voluntario';
      return {
        id: att.volunteerAssignmentId || att.id,
        name,
      };
    });
  }, [volunteerAttendances]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedKid) {
      toast.error(t('reports.actions.toast_error', { ns: 'kidChurch' }));
      return;
    }

    if (!description.trim()) {
      toast.error(t('reports.actions.toast_error', { ns: 'kidChurch' }));
      return;
    }

    if (
      medicalAttentionType === MedicalAttentionType.DOCTOR_ATTENDED &&
      !attendingDoctorVolunteerId
    ) {
      toast.error('Por favor selecciona el voluntario médico que atendió.');
      return;
    }

    try {
      await createReport({
        churchCampusId,
        churchMeetingId: churchMeetingId || undefined,
        serviceAreaGroupId: serviceAreaGroupId || undefined,
        ministryId: ministryId || undefined,
        date,
        type: ReportType.CHILD_INCIDENT,
        priority: ReportPriority.MEDIUM,
        status: ReportStatus.INFORMATIVE,
        details: {
          kidId: selectedKid.id,
          description: description.trim(),
          medicalAttentionType,
          attendingDoctorVolunteerId:
            medicalAttentionType === MedicalAttentionType.DOCTOR_ATTENDED
              ? attendingDoctorVolunteerId.trim() || undefined
              : undefined,
          guardianExplanationResponse: guardianExplanation,
          photos: photos.length > 0 ? photos : undefined,
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
      {/* Kid Selector & Guardians Display */}
      <KidSelector
        selectedKid={selectedKid}
        onSelectKid={setSelectedKid}
        churchMeetingId={churchMeetingId}
        showGuardiansPreview
      />

      {/* Description */}
      <Textarea
        label={t('reports.child_fields.description', { ns: 'kidChurch' })}
        required
        rows={3}
        showCount
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t('reports.child_fields.description_placeholder', { ns: 'kidChurch' })}
      />

      {/* Medical Attention Selector */}
      <div>
        <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide text-gray-700">
          {t('reports.child_fields.medical_attention_label', { ns: 'kidChurch' })}
        </label>
        <div className="flex flex-col gap-2">
          {(
            [
              MedicalAttentionType.NOT_REQUIRED,
              MedicalAttentionType.NO_DOCTOR_AVAILABLE,
              MedicalAttentionType.DOCTOR_ATTENDED,
            ] as MedicalAttentionType[]
          ).map((mType) => {
            const isSelected = medicalAttentionType === mType;
            return (
              <label
                key={mType}
                className={clsx(
                  'flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-colors relative',
                  isSelected
                    ? 'border-primary bg-primary/5 text-gray-900 font-bold'
                    : 'border-transparent bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium',
                )}
              >
                <input
                  type="radio"
                  name="medicalAttention"
                  checked={isSelected}
                  onChange={() => setMedicalAttentionType(mType)}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300 shrink-0"
                />
                <span className="text-xs sm:text-sm flex-1 leading-snug">
                  {t(`reports.child_fields.medical_options.${mType}` as any)}
                </span>
              </label>
            );
          })}
        </div>

        {/* Doctor volunteer selector only if DOCTOR_ATTENDED */}
        {medicalAttentionType === MedicalAttentionType.DOCTOR_ATTENDED && (
          <div className="mt-2.5 animate-in fade-in">
            <SelectSearch
              label={t('reports.child_fields.doctor_label', {
                ns: 'kidChurch',
                defaultValue: 'Voluntario Médico / Atención',
              })}
              required
              options={doctorOptions}
              value={attendingDoctorVolunteerId}
              onChange={setAttendingDoctorVolunteerId}
              placeholder={t('reports.child_fields.doctor_placeholder', {
                ns: 'kidChurch',
                defaultValue: 'Selecciona el voluntario médico...',
              })}
            />
          </div>
        )}
      </div>

      {/* Guardian Explanation Radio Options */}
      <div>
        <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide text-gray-700">
          {t('reports.child_fields.guardian_explanation_label', { ns: 'kidChurch' })}
        </label>
        <div className="flex flex-col gap-2">
          {(
            [
              GuardianExplanationOption.YES_WELL,
              GuardianExplanationOption.YES_BAD,
              GuardianExplanationOption.NO,
            ] as GuardianExplanationOption[]
          ).map((opt) => {
            const isSelected = guardianExplanation === opt;
            return (
              <label
                key={opt}
                className={clsx(
                  'flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-colors relative',
                  isSelected
                    ? 'border-primary bg-primary/5 text-gray-900 font-bold'
                    : 'border-transparent bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium',
                )}
              >
                <input
                  type="radio"
                  name="guardianExplanation"
                  checked={isSelected}
                  onChange={() => setGuardianExplanation(opt)}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300 shrink-0"
                />
                <span className="text-xs sm:text-sm flex-1 leading-snug">
                  {t(`reports.child_fields.guardian_options.${opt}`, { ns: 'kidChurch' })}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Photo Evidences with client-side compression */}
      <PhotoUploadZone
        value={photos}
        onChange={setPhotos}
        maxPhotos={3}
        multiple={true}
        title={t('reports.child_fields.photos_label', { ns: 'kidChurch' })}
        disabled={isLoading}
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
