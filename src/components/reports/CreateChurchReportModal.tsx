import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  AlertCircle,
  Phone,
  ChevronRight,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { ReportType } from '@/libs/models/ChurchReport';
import { ChildIncidentReportForm } from './forms/ChildIncidentReportForm';
import { GuardianCallReportForm } from './forms/GuardianCallReportForm';

interface CreateChurchReportModalProps {
  open: boolean;
  onClose: () => void;
  churchCampusId: string;
  churchMeetingId?: string;
  serviceAreaGroupId?: string;
  ministryId?: string;
  date?: string;
  initialType?: ReportType | null;
  allowedTypes?: ReportType[];
  onSuccess?: () => void;
}

interface ReportTypeMeta {
  type: ReportType;
  icon: React.ReactNode;
  iconContainerClass: string;
  badgeClass: string;
}

const REPORT_TYPE_CONFIG: Record<ReportType, ReportTypeMeta> = {
  [ReportType.CHILD_INCIDENT]: {
    type: ReportType.CHILD_INCIDENT,
    icon: <AlertCircle size={20} />,
    iconContainerClass: 'bg-amber-100 text-amber-700',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  [ReportType.GUARDIAN_CALL]: {
    type: ReportType.GUARDIAN_CALL,
    icon: <Phone size={20} />,
    iconContainerClass: 'bg-blue-100 text-blue-700',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
  },
};

/**
 * Scalable modal dialog for creating church operational reports.
 * Features a catalog selection menu (Step 1) and dynamic forms (Step 2)
 * with back navigation, eliminating rigid horizontal tabs.
 *
 * @param {CreateChurchReportModalProps} props - Open state, contextual IDs, and callbacks.
 * @returns {JSX.Element | null} Rendered modal dialog.
 */
export const CreateChurchReportModal: React.FC<CreateChurchReportModalProps> = ({
  open,
  onClose,
  churchCampusId,
  churchMeetingId,
  serviceAreaGroupId,
  ministryId,
  date,
  initialType = null,
  allowedTypes,
  onSuccess,
}) => {
  useModalBackClose(open, onClose);
  const { t } = useTranslation(['kidChurch', 'common']);

  const [selectedType, setSelectedType] = useState<ReportType | null>(
    initialType || null,
  );
  const effectiveDate = date || dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    if (open) setSelectedType(initialType || null);
  }, [open, initialType]);

  if (!open) return null;

  const availableTypes: ReportType[] =
    allowedTypes && allowedTypes.length > 0
      ? allowedTypes
      : [ReportType.CHILD_INCIDENT, ReportType.GUARDIAN_CALL];

  const currentMeta = selectedType ? REPORT_TYPE_CONFIG[selectedType] : null;

  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl p-5 sm:p-6 w-[94vw] max-w-lg z-[1000] max-h-[92vh] flex flex-col animate-in zoom-in-95 fade-in duration-200 outline-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 shrink-0">
            {selectedType === null ? (
              // Step 1: Catalog Header
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <Dialog.Title className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                    {t('reports.select_type_title', {
                      ns: 'kidChurch',
                      defaultValue: 'Reportar novedad',
                    })}
                  </Dialog.Title>
                  <Dialog.Description className="text-xs text-gray-500">
                    {t('reports.select_type_subtitle', {
                      ns: 'kidChurch',
                      defaultValue: 'Selecciona la categoría a reportar',
                    })}
                  </Dialog.Description>
                </div>
              </div>
            ) : (
              // Step 2: Form Header with Back Navigation
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedType(null)}
                  className="p-1.5 -ml-1 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                  title="Cambiar tipo de novedad"
                >
                  <ArrowLeft size={18} />
                </button>
                <div
                  className={clsx(
                    'w-9 h-9 rounded-2xl flex items-center justify-center shrink-0',
                    currentMeta?.iconContainerClass || 'bg-gray-100 text-gray-700',
                  )}
                >
                  {currentMeta?.icon}
                </div>
                <div className="min-w-0">
                  <Dialog.Title className="text-sm sm:text-base font-black text-gray-900 tracking-tight truncate">
                    {t(`reports.types.${selectedType}` as any)}
                  </Dialog.Title>
                  <Dialog.Description className="text-[11px] text-gray-500">
                    {t('reports.new_report', {
                      ns: 'kidChurch',
                      defaultValue: 'Registrar novedad',
                    })}
                  </Dialog.Description>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="mt-3.5 flex-1 overflow-y-auto no-scrollbar">
            {selectedType === null ? (
              // Step 1: Catalog of Available Report Types
              <div className="space-y-2.5 py-1">
                {availableTypes.map((type) => {
                  const meta = REPORT_TYPE_CONFIG[type];
                  const title = t(`reports.types.${type}` as any);
                  const desc = t(`reports.type_descriptions.${type}` as any);
                  const badge = t(`reports.type_badges.${type}` as any);

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className="w-full text-left p-3.5 rounded-2xl border border-gray-200/90 hover:border-primary/40 hover:bg-primary/[0.02] active:scale-[0.99] transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs hover:shadow-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={clsx(
                            'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                            meta.iconContainerClass,
                          )}
                        >
                          {meta.icon}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-primary">
                              {title}
                            </span>
                            {badge && (
                              <span
                                className={clsx(
                                  'text-[10px] font-bold px-1.5 py-0.2 rounded-md border',
                                  meta.badgeClass,
                                )}
                              >
                                {badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                            {desc}
                          </p>
                        </div>
                      </div>

                      <ChevronRight
                        size={18}
                        className="text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              // Step 2: Specific Form
              <>
                {selectedType === ReportType.CHILD_INCIDENT && (
                  <ChildIncidentReportForm
                    churchCampusId={churchCampusId}
                    churchMeetingId={churchMeetingId}
                    serviceAreaGroupId={serviceAreaGroupId}
                    ministryId={ministryId}
                    date={effectiveDate}
                    onSuccess={() => {
                      onSuccess?.();
                      onClose();
                    }}
                    onCancel={onClose}
                  />
                )}

                {selectedType === ReportType.GUARDIAN_CALL && (
                  <GuardianCallReportForm
                    churchCampusId={churchCampusId}
                    churchMeetingId={churchMeetingId}
                    serviceAreaGroupId={serviceAreaGroupId}
                    ministryId={ministryId}
                    date={effectiveDate}
                    onSuccess={() => {
                      onSuccess?.();
                      onClose();
                    }}
                    onCancel={onClose}
                  />
                )}
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
