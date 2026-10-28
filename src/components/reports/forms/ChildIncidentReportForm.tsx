import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import Button from '@/components/ui/Button';
import { PhotoUploadZone } from '@/components/ui/PhotoUploadZone';
import Textarea from '@/components/ui/Textarea';
import { EntityState, IKid, MinistryAreaScope } from '@/libs/models';
import {
  GuardianExplanationOption,
  MedicalAttentionType,
  ReportPriority,
  ReportStatus,
  ReportType,
} from '@/libs/models/ChurchReport';
import {
  useCreateChurchReportMutation,
  useGetPresignedReportUploadUrlMutation,
  useGetVolunteerAssignmentsQuery,
  useGetVolunteerAttendanceQuery,
  useUploadReportPhotoMutation,
} from '@/libs/state/redux/api/churchApi';

import { useAppSelector } from '@/libs/state/redux/hooks';
import { formatPersonShortName } from '@/libs/utils/text';
import { KidSelector } from '../KidSelector';
import { DoctorSelector, DoctorOption } from '../DoctorSelector';

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
  const [getPresignedUrl] = useGetPresignedReportUploadUrlMutation();
  const [uploadReportPhotoFallback] = useUploadReportPhotoMutation();

  const [selectedKid, setSelectedKid] = useState<IKid | null>(null);
  const [description, setDescription] = useState('');
  const [medicalAttentionType, setMedicalAttentionType] =
    useState<MedicalAttentionType | null>(null);
  const [attendingDoctorVolunteerId, setAttendingDoctorVolunteerId] = useState('');
  const [guardianExplanation, setGuardianExplanation] =
    useState<GuardianExplanationOption | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  /**
   * Uploads an image using Cloudflare R2 presigned PUT URL directly from the client.
   * If direct upload fails (e.g. CORS restrictions), falls back to the backend multipart upload endpoint.
   *
   * @param {File} file - Compressed image file.
   * @returns {Promise<string>} Public URL of the uploaded photo.
   */
  const handleUploadPhoto = async (file: File): Promise<string> => {
    // 1. Request presigned URL from backend
    const presigned = await getPresignedUrl({
      fileName: file.name,
      contentType: file.type || 'image/jpeg',
    }).unwrap();

    // 2. Attempt direct PUT to Cloudflare R2
    try {
      const directResponse = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'image/jpeg',
        },
        body: file,
      });

      if (directResponse.ok) {
        return presigned.publicUrl;
      }
    } catch (directErr) {
      console.warn('Direct Cloudflare R2 upload failed, using backend fallback:', directErr);
    }

    // 3. Fallback to multipart endpoint
    const formData = new FormData();
    formData.append('file', file);
    const fallbackResult = await uploadReportPhotoFallback(formData).unwrap();
    return fallbackResult.publicUrl;
  };



  /**
   * Updates medical attention type and clears attending doctor selection when not required/available.
   *
   * @param {MedicalAttentionType} newType - Selected medical attention option.
   * @returns {void}
   */
  const handleMedicalAttentionChange = (newType: MedicalAttentionType) => {
    setMedicalAttentionType(newType);
    if (newType !== MedicalAttentionType.DOCTOR_ATTENDED) {
      setAttendingDoctorVolunteerId('');
    }
  };

  const { activeCampusId, activeGroupConfigId } = useAppSelector(
    (state) => state.volunteerContextSlice,
  );
  const effectiveCampus = churchCampusId || activeCampusId;
  const effectiveGroup = serviceAreaGroupId || activeGroupConfigId;

  const { data: assignments = [], isLoading: isLoadingAssignments } =
    useGetVolunteerAssignmentsQuery(
      {
        churchCampusId: effectiveCampus || undefined,
        state: EntityState.ACTIVE,
      },
      { skip: !effectiveCampus },
    );

  const partitionKey = `attendance-team-${effectiveCampus}-${effectiveGroup || 'all'}`;
  const partitionAssignments =
    useAppSelector((state) => state.volunteerSlice.assignmentsByPartition[partitionKey]) || [];
  const sliceAssignments = useAppSelector((state) => state.volunteerSlice.assignments) || [];

  const allAvailableAssignments = useMemo(() => {
    if (assignments.length > 0) return assignments;
    if (partitionAssignments.length > 0) return partitionAssignments;
    return sliceAssignments;
  }, [assignments, partitionAssignments, sliceAssignments]);

  const { data: volunteerAttendances = [] } = useGetVolunteerAttendanceQuery(
    { churchMeetingId: churchMeetingId || undefined, limit: 100 },
    { skip: !churchMeetingId },
  );

  const doctorList = useMemo<DoctorOption[]>(() => {
    // 1. Filter assignments belonging to doctor/medical areas strictly by scope
    const doctorAssignments = allAvailableAssignments.filter((asg) => {
      const area = asg.serviceAreaGroup?.ministryArea || asg.ministryArea;
      return area?.scope === MinistryAreaScope.KID_MEDICAL;
    });

    // 2. If current group is known, prioritize/filter doctors in this group
    const targetGroupId = effectiveGroup;
    const groupDoctors = targetGroupId
      ? doctorAssignments.filter((asg) => {
          const asgGroupId =
            asg.serviceAreaGroup?.ministryGroupConfigId ||
            asg.serviceAreaGroup?.ministryGroupConfig?.id ||
            asg.ministryGroupConfigId;
          return asgGroupId === targetGroupId;
        })
      : doctorAssignments;

    const selectedDoctorList = groupDoctors.length > 0 ? groupDoctors : doctorAssignments;

    // 3. Fallback to volunteerAttendances if no doctor assignments found
    if (selectedDoctorList.length === 0 && volunteerAttendances.length > 0) {
      const attendedDoctors = volunteerAttendances.filter((att) => {
        const area =
          att.volunteerAssignment?.serviceAreaGroup?.ministryArea ||
          att.volunteerAssignment?.ministryArea;
        return area?.scope === MinistryAreaScope.KID_MEDICAL;
      });

      const list = attendedDoctors.length > 0 ? attendedDoctors : volunteerAttendances;
      return list.map((att) => {
        const user =
          att.volunteerAssignment?.user ||
          att.volunteerAssignment?.volunteer?.user ||
          att.volunteerAssignment?.churchMember?.user;
        const photoUrl = user?.photoUrl || null;
        const rawName = user
          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
          : 'Voluntario';
        const area =
          att.volunteerAssignment?.serviceAreaGroup?.ministryArea ||
          att.volunteerAssignment?.ministryArea;
        return {
          id: att.volunteerAssignmentId || att.id,
          fullName: rawName,
          photoUrl,
          areaName: area?.name || 'Servicio Médico',
          code: user?.userCode,
        };
      });
    }

    const seen = new Set<string>();
    const options: DoctorOption[] = [];
    for (const asg of selectedDoctorList) {
      if (seen.has(asg.id)) continue;
      seen.add(asg.id);
      const user = asg.user || asg.volunteer?.user || asg.churchMember?.user;
      const photoUrl = user?.photoUrl || null;
      const rawName = user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
        : 'Doctor';
      const area = asg.serviceAreaGroup?.ministryArea || asg.ministryArea;
      options.push({
        id: asg.id,
        fullName: rawName,
        photoUrl,
        areaName: area?.name || 'Servicio Médico',
        code: user?.userCode,
      });
    }
    return options;
  }, [allAvailableAssignments, volunteerAttendances, effectiveGroup]);

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

    if (!medicalAttentionType) {
      toast.error(
        t('reports.child_fields.medical_attention_required_error', {
          ns: 'kidChurch',
          defaultValue: 'Por favor selecciona si se requirió atención médica.',
        }),
      );
      return;
    }

    if (
      medicalAttentionType === MedicalAttentionType.DOCTOR_ATTENDED &&
      !attendingDoctorVolunteerId
    ) {
      toast.error(
        t('reports.child_fields.doctor_required_error', {
          ns: 'kidChurch',
          defaultValue: 'Por favor selecciona el voluntario médico que atendió.',
        }),
      );
      return;
    }

    if (!guardianExplanation) {
      toast.error(
        t('reports.child_fields.guardian_explanation_required_error', {
          ns: 'kidChurch',
          defaultValue: 'Por favor selecciona si se explicó la situación al acudiente.',
        }),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload photos only upon report confirmation (avoids orphan garbage files if canceled)
      let uploadedPhotoUrls: string[] = [];
      if (photoFiles.length > 0) {
        setIsUploadingPhotos(true);
        uploadedPhotoUrls = await Promise.all(
          photoFiles.map((file) => handleUploadPhoto(file)),
        );
        setIsUploadingPhotos(false);
      }

      // 2. Submit report payload with public URLs only
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
          photos: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : undefined,
        },
      }).unwrap();

      toast.success(t('reports.actions.toast_created', { ns: 'kidChurch' }));
      onSuccess?.();
    } catch (err: any) {
      setIsUploadingPhotos(false);
      toast.error(err?.message || t('reports.actions.toast_error', { ns: 'kidChurch' }));
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Kid Selector without guardians preview */}
      <KidSelector
        selectedKid={selectedKid}
        onSelectKid={setSelectedKid}
        churchMeetingId={churchMeetingId}
        date={date}
        showGuardiansPreview={false}
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
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-700">
            {t('reports.child_fields.medical_attention_label', { ns: 'kidChurch' })}
            <span className="text-rose-500 font-black"> *</span>
          </label>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-primary/5 text-primary border-primary/15 shrink-0">
            {t('common.required', { ns: 'common', defaultValue: 'Obligatorio' })}
          </span>
        </div>
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
                  onChange={() => handleMedicalAttentionChange(mType)}
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
            <DoctorSelector
              selectedDoctorId={attendingDoctorVolunteerId}
              onSelectDoctor={setAttendingDoctorVolunteerId}
              doctors={doctorList}
              isLoading={isLoadingAssignments}
            />
          </div>
        )}
      </div>

      {/* Guardian Explanation Radio Options */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-700">
            {t('reports.child_fields.guardian_explanation_label', { ns: 'kidChurch' })}
            <span className="text-rose-500 font-black"> *</span>
          </label>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-primary/5 text-primary border-primary/15 shrink-0">
            {t('common.required', { ns: 'common', defaultValue: 'Obligatorio' })}
          </span>
        </div>
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

      {/* Photo Evidences with client-side compression; uploads to R2 only when confirming report */}
      <PhotoUploadZone
        value={photos}
        onChange={setPhotos}
        files={photoFiles}
        onFilesChange={setPhotoFiles}
        maxPhotos={3}
        multiple={true}
        title={t('reports.child_fields.photos_label', { ns: 'kidChurch' })}
        disabled={isSubmitting || isLoading}
      />

      {/* Action Buttons */}
      <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
        <Button
          type="submit"
          block
          variant="primary"
          size="md"
          loading={isSubmitting || isLoading}
          disabled={isSubmitting || isLoading}
        >
          <CheckCircle2 size={18} className="mr-2 shrink-0" />
          {isSubmitting || isLoading
            ? isUploadingPhotos
              ? 'Subiendo fotos de soporte...'
              : t('reports.actions.saving', { ns: 'kidChurch' })
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
            disabled={isSubmitting || isLoading}
            onClick={onCancel}
          >
            {t('reports.actions.cancel', { ns: 'kidChurch' })}
          </Button>
        )}
      </div>


    </form>
  );
};
