import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  HeartHandshake,
  Info,
  MessageSquarePlus,
  Phone,
  PhoneCall,
  ShieldAlert,
  Stethoscope,
  User,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { AppDrawer } from '@/components/ui/AppDrawer';
import ModalOverlay from '@/components/ui/ModalOverlay';
import Button from '@/components/ui/Button';
import { IKidGuardian } from '@/libs/models';
import {
  IChildIncidentReportDetails,
  IChurchReport,
  IGuardianCallReportDetails,
  ReportHistoryAction,
  ReportPriority,
  ReportStatus,
  ReportType,
} from '@/libs/models/ChurchReport';
import { useGetKidQuery } from '@/libs/state/redux/api/kidChurchApi';
import { formatPersonShortName } from '@/libs/utils/text';

interface ChurchReportDetailDrawerProps {
  report: IChurchReport | null;
  open: boolean;
  onClose: () => void;
  kidNameMap: Record<string, string>;
  volunteerNameMap: Record<string, string>;
  guardiansMap?: Record<string, IKidGuardian>;
  onAddNote: (reportId: string) => void;
  onCloseReport: (reportId: string) => void;
}

/**
 * Slide-over drawer presenting the complete details and timeline of a church operational report.
 * Dynamically resolves kid names and guardian names without persisting denormalized person data.
 *
 * @param {ChurchReportDetailDrawerProps} props - Drawer control, report data, and action handlers.
 * @returns {JSX.Element | null} Rendered report detail drawer.
 */
export const ChurchReportDetailDrawer: React.FC<ChurchReportDetailDrawerProps> = ({
  report,
  open,
  onClose,
  kidNameMap,
  volunteerNameMap,
  guardiansMap = {},
  onAddNote,
  onCloseReport,
}) => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const isIncident = report?.type === ReportType.CHILD_INCIDENT;
  const isGuardianCall = report?.type === ReportType.GUARDIAN_CALL;

  const incidentDetails = isIncident
    ? (report?.details as IChildIncidentReportDetails)
    : null;
  const callDetails = isGuardianCall
    ? (report?.details as IGuardianCallReportDetails)
    : null;

  const targetKidId = incidentDetails?.kidId || callDetails?.kidId;
  const resolvedKidName = targetKidId
    ? kidNameMap[targetKidId]
    : '';

  // If guardian is not already in the attendance guardian map, query the specific kid
  const guardianId = callDetails?.guardianId;
  const cachedGuardian = guardianId ? guardiansMap[guardianId] : null;

  const { data: fullKid } = useGetKidQuery(
    { id: targetKidId || '' },
    { skip: !targetKidId || Boolean(cachedGuardian) || !open },
  );

  const matchedGuardian =
    cachedGuardian ||
    (guardianId && fullKid?.relations
      ? fullKid.relations.find((g) => g.id === guardianId)
      : null);

  const guardianFullName = matchedGuardian
    ? formatPersonShortName(`${matchedGuardian.firstName} ${matchedGuardian.lastName}`.trim())
    : t('reports.guardian_call_fields.registered_guardian', {
        ns: 'kidChurch',
        defaultValue: 'Acudiente registrado',
      });

  const guardianPhone = matchedGuardian?.phone || '';
  const guardianRel =
    callDetails?.guardianRelationship ||
    (matchedGuardian ? matchedGuardian.relation : '');

  const getPriorityBadge = (priority: ReportPriority) => {
    if (priority === ReportPriority.HIGH) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
          <ShieldAlert size={12} />
          {t(`reports.priorities.${priority}` as any)}
        </span>
      );
    }
    if (priority === ReportPriority.MEDIUM) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
          {t(`reports.priorities.${priority}` as any)}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
        {t(`reports.priorities.${priority}` as any)}
      </span>
    );
  };

  const getStatusBadge = (status: ReportStatus) => {
    if (status === ReportStatus.OPEN) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
          <AlertTriangle size={12} />
          {t(`reports.statuses.${status}` as any)}
        </span>
      );
    }
    if (status === ReportStatus.CLOSED) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
          <CheckCircle2 size={12} />
          {t(`reports.statuses.${status}` as any)}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
        <Info size={12} />
        {t(`reports.statuses.${status}` as any)}
      </span>
    );
  };

  if (!report) return null;

  const history = report.history || [];

  return (
    <>
      <AppDrawer
        open={open}
        onOpenChange={(isOpen) => !isOpen && onClose()}
        title={
          <div className="flex items-center gap-2">
            {isIncident ? (
              <AlertTriangle size={18} className="text-amber-500 shrink-0" />
            ) : (
              <PhoneCall size={18} className="text-blue-500 shrink-0" />
            )}
            <span className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              {t(`reports.types.${report.type}` as any, { defaultValue: 'Detalle de Novedad' })}
            </span>
          </div>
        }
      >
        <div className="p-4 sm:p-6 space-y-4 pb-8">
          {/* Main Card: Badges, Child and Incident Hero Statement */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs space-y-3.5">
            {/* Top row: Badges + Service Date & Time */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(report.status)}
                {getPriorityBadge(report.priority)}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <Calendar size={13} className="text-gray-400 shrink-0" />
                <span>{dayjs(report.date).format('DD MMM YYYY')}</span>
                <span className="text-gray-300">•</span>
                <Clock size={13} className="text-gray-400 shrink-0" />
                <span>{dayjs(report.createdAt).format('hh:mm A')}</span>
              </div>
            </div>

            {/* Child Profile Banner */}
            <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 border border-primary/20">
                <User size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  {t('reports.child_involved', { ns: 'kidChurch', defaultValue: 'Niño involucrado' })}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                  {resolvedKidName || (fullKid ? `${fullKid.firstName} ${fullKid.lastName}` : 'Niño')}
                </h4>
              </div>
            </div>

            {/* Hero Statement: What happened */}
            {isIncident && incidentDetails?.description && (
              <div className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200/50 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800/80 block">
                  Descripción del suceso
                </span>
                <p className="text-sm font-semibold text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {incidentDetails.description}
                </p>
              </div>
            )}

            {isGuardianCall && callDetails?.reason && (
              <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-200/50 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800/80 block">
                  Motivo de la llamada
                </span>
                <p className="text-sm font-semibold text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {callDetails.reason}
                </p>
              </div>
            )}
          </div>

          {/* Incident Structured Highlights (Medical & Guardian Communication) */}
          {isIncident && incidentDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Medical Attention Card */}
              {incidentDetails.medicalAttentionType && (
                <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-2xs flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <Stethoscope size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                      Atención médica
                    </span>
                    <p className="text-xs font-bold text-gray-800 mt-0.5">
                      {t(`reports.child_fields.medical_options.${incidentDetails.medicalAttentionType}` as any)}
                    </p>
                    {incidentDetails.attendingDoctorVolunteerId && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md inline-block mt-1 border border-emerald-200/50">
                        {volunteerNameMap[incidentDetails.attendingDoctorVolunteerId] || 'Voluntario Médico'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Guardian Explanation Card */}
              {incidentDetails.guardianExplanationResponse && (
                <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-2xs flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <HeartHandshake size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                      Comunicación con acudiente
                    </span>
                    <p className="text-xs font-bold text-gray-800 mt-0.5">
                      {t(`reports.child_fields.guardian_options.${incidentDetails.guardianExplanationResponse}` as any)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Details Section for GUARDIAN_CALL */}
          {isGuardianCall && callDetails && (
            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                Acudiente contactado
              </span>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <PhoneCall size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 text-sm">
                      {guardianFullName}
                    </h5>
                    {guardianRel && (
                      <span className="text-[11px] font-medium text-gray-500">
                        Parentesco: {guardianRel}
                      </span>
                    )}
                  </div>
                </div>

                {guardianPhone && (
                  <a
                    href={`tel:${guardianPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors shrink-0"
                  >
                    <Phone size={13} />
                    <span>Llamar ({guardianPhone})</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Photo Evidences Gallery */}
          {isIncident && incidentDetails?.photos && incidentDetails.photos.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">
                  {t('reports.photos_support_count', {
                    ns: 'kidChurch',
                    count: incidentDetails.photos.length,
                    defaultValue: `Fotos de soporte (${incidentDetails.photos.length})`,
                  })}
                </span>
                <span className="text-[11px] text-gray-400 font-medium">Toca para ampliar</span>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                {incidentDetails.photos.map((photoUrl, idx) => (
                  <div
                    key={`evidence-${idx}`}
                    onClick={() => setLightboxPhoto(photoUrl)}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-gray-200/90 shadow-2xs group shrink-0 aspect-square cursor-pointer bg-gray-50 hover:shadow-xs transition-all"
                  >
                    <img
                      src={photoUrl}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-xs">
                        <Eye size={16} />
                      </div>
                    </div>
                    <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connected Timeline */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-2xs space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
              {t('reports.notes_history', {
                ns: 'kidChurch',
                count: history.length,
                defaultValue: `Historial de seguimiento (${history.length})`,
              })}
            </h4>

            {history.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                {t('reports.no_notes', {
                  ns: 'kidChurch',
                  defaultValue: 'Sin eventos registrados aún',
                })}
              </p>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {history.map((entry) => {
                  const isCreated = entry.action === ReportHistoryAction.CREATED;
                  const isClosed = entry.action === ReportHistoryAction.CLOSED;

                  return (
                    <div key={entry.id} className="relative text-xs sm:text-sm">
                      {/* Timeline icon node */}
                      <div
                        className={clsx(
                          'absolute -left-[23px] top-0.5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-xs',
                          isCreated && 'bg-primary/10 text-primary',
                          isClosed && 'bg-emerald-100 text-emerald-700',
                          !isCreated && !isClosed && 'bg-blue-100 text-blue-700',
                        )}
                      >
                        {isCreated && <FileText size={11} strokeWidth={2.5} />}
                        {isClosed && <CheckCircle2 size={11} strokeWidth={2.5} />}
                        {!isCreated && !isClosed && <MessageSquarePlus size={11} strokeWidth={2.5} />}
                      </div>

                      <div className="bg-gray-50/70 rounded-xl p-3 border border-gray-100 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span
                            className={clsx(
                              'font-bold uppercase tracking-wide',
                              isCreated && 'text-primary',
                              isClosed && 'text-emerald-700',
                              !isCreated && !isClosed && 'text-blue-700',
                            )}
                          >
                            {t(`reports.history_actions.${entry.action}` as any, {
                              ns: 'kidChurch',
                              defaultValue: entry.action,
                            })}
                          </span>
                          <span className="text-gray-400 font-medium">
                            {dayjs(entry.createdAt).format('DD/MM/YYYY hh:mm A')}
                          </span>
                        </div>
                        <p className="text-gray-800 leading-relaxed font-medium">
                          {entry.note || 'Actualización registrada'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2.5">
            <Button
              type="button"
              block
              variant="default"
              size="md"
              onClick={() => onAddNote(report.id)}
              className="shadow-2xs"
            >
              <MessageSquarePlus size={17} className="mr-2 shrink-0 text-primary" />
              <span>{t('reports.actions.add_note', { ns: 'kidChurch', defaultValue: 'Agregar actualización' })}</span>
            </Button>

            {report.status === ReportStatus.OPEN && (
              <Button
                type="button"
                block
                variant="primary"
                size="md"
                onClick={() => onCloseReport(report.id)}
                className="shadow-2xs"
              >
                <CheckCircle2 size={17} className="mr-2 shrink-0" />
                <span>{t('reports.actions.close', { ns: 'kidChurch', defaultValue: 'Cerrar reporte' })}</span>
              </Button>
            )}
          </div>
        </div>
      </AppDrawer>

      {/* Lightbox Modal with portal and backdrop click-to-close */}
      <ModalOverlay
        open={Boolean(lightboxPhoto)}
        onClose={() => setLightboxPhoto(null)}
        closeOnBackdropClick
        wrapperClassName="items-center justify-center p-4"
        backdropClassName="bg-black/90 backdrop-blur-md"
        panelClassName="max-w-xl w-full flex flex-col items-center justify-center bg-transparent border-none shadow-none"
      >
        {lightboxPhoto && (
          <div className="relative max-w-full flex flex-col items-center">
            {/* Prominent floating close button always visible in top-right corner of screen */}
            <button
              type="button"
              onClick={() => setLightboxPhoto(null)}
              className="fixed top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 rounded-full bg-white/20 hover:bg-white/35 active:scale-90 text-white flex items-center justify-center cursor-pointer transition-all shadow-2xl z-50 backdrop-blur-xs"
              aria-label="Cerrar vista previa"
            >
              <X size={22} strokeWidth={2.5} />
            </button>

            <img
              src={lightboxPhoto}
              alt="Evidencia ampliada"
              className="max-w-full max-h-[82vh] rounded-2xl object-contain shadow-2xl select-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </ModalOverlay>
    </>
  );
};
