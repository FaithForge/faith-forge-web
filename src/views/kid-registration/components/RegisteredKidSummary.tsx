import React from 'react';
import { AlertTriangle, Pencil, Trash2, Printer } from 'lucide-react';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';
import Can from '@/components/auth/Can';
import { usePermissions } from '@/libs/hooks/usePermissions';
import { getRegistrationLogInfo } from '@/libs/utils/registrationLog';
import { FormattedRelation } from '../hooks/useKidCheckInData';

interface RegisteredKidSummaryProps {
  kid: any;
  registrationGuardian: {
    fullName: string;
    relation: string;
    phone: string;
  } | null;
  relationsList: FormattedRelation[];
  guardianTerm: string;
  guardiansTerm: string;
  onReprint: () => void;
  onDelete: () => void;
  onUpdateGuardian: (rel: any) => void;
  onDeleteGuardianRelation: (rel: FormattedRelation) => void;
}

/**
 * Summary displayed when the child is already registered for today's service.
 * Displays check-in summary, who registered, audit log, guardians table, and reprint/delete buttons.
 *
 * @param {RegisteredKidSummaryProps} props - Component props.
 * @returns {JSX.Element}
 */
export const RegisteredKidSummary: React.FC<RegisteredKidSummaryProps> = ({
  kid,
  registrationGuardian,
  relationsList,
  guardianTerm,
  guardiansTerm,
  onReprint,
  onDelete,
  onUpdateGuardian,
  onDeleteGuardianRelation,
}) => {
  const { t } = useTranslation(['kidRegistration', 'common']);
  const { can } = usePermissions();

  const formatRegistrationDate = (date: string | Date | undefined) => {
    if (!date) return '';
    const formatted = dayjs(date).format('MMMM D, YYYY h:mm:ss A');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">
          Información del registro
        </h2>
        <div className="flex flex-col gap-y-3 text-sm">
          <div className="flex justify-between items-center py-1 border-b border-gray-50">
            <span className="font-semibold text-gray-500">Fecha de registro</span>
            <span className="font-bold text-gray-800 text-right">
              {formatRegistrationDate(kid?.currentKidRegistration?.date)}
            </span>
          </div>

          <div className="flex justify-between items-start py-1.5 border-b border-gray-50">
            <span className="font-semibold text-gray-500 shrink-0 pr-2 pt-0.5">
              {guardianTerm} que registró
            </span>
            <div className="text-right flex flex-col items-end">
              <span className="font-bold text-gray-800">
                {registrationGuardian
                  ? `${registrationGuardian.fullName} (${registrationGuardian.relation})`
                  : kid?.currentKidRegistration?.additionalInfo?.guardianFullName ||
                    `${guardianTerm} registrado(a)`}
              </span>
              {registrationGuardian?.phone && (
                <span className="text-xs font-semibold text-gray-500 mt-0.5">
                  Tel: {registrationGuardian.phone}
                </span>
              )}
            </div>
          </div>

          {kid?.currentKidRegistration?.observation && (
            <div className="flex justify-between items-start py-1.5 border-b border-gray-50">
              <span className="font-semibold text-gray-500 shrink-0 pr-2">Observaciones</span>
              <span className="font-bold text-gray-800 text-right">
                {kid.currentKidRegistration.observation}
              </span>
            </div>
          )}

          <Can capability="checkin:view-log">
            {(() => {
              const parsed = getRegistrationLogInfo(kid?.currentKidRegistration);
              if (!parsed) return null;
              return (
                <div className="flex justify-between items-start py-1.5 border-b border-gray-50 last:border-0">
                  <span className="font-semibold text-gray-500 shrink-0 pr-2">Log de registro</span>
                  <span className="font-bold text-gray-800 text-sm leading-snug text-right">
                    {`Registrado por ${parsed.author}`}
                    {parsed.badgeLabel && (
                      <span
                        className={clsx(
                          'inline-flex items-center ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide border align-middle',
                          parsed.badgeType === 'group' &&
                            'bg-emerald-50 text-emerald-700 border-emerald-200',
                          parsed.badgeType === 'support' &&
                            'bg-amber-50 text-amber-800 border-amber-200',
                          parsed.badgeType === 'admin' &&
                            'bg-purple-50 text-purple-700 border-purple-200',
                          parsed.badgeType === 'coordinator' &&
                            'bg-blue-50 text-blue-700 border-blue-200',
                          parsed.badgeType === 'legacy' &&
                            'bg-gray-100 text-gray-600 border-gray-200',
                          parsed.badgeType === 'general' &&
                            'bg-slate-50 text-slate-700 border-slate-200',
                        )}
                      >
                        {parsed.badgeLabel}
                      </span>
                    )}
                  </span>
                </div>
              );
            })()}
          </Can>
        </div>
      </div>

      {/* Tabla de Acudientes */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">
          {guardiansTerm}
        </h2>
        <div className="grid grid-cols-12 gap-x-2 gap-y-3 text-xs items-center">
          <div className="col-span-4 font-bold text-gray-500 uppercase">Nombre</div>
          <div className="col-span-3 font-bold text-gray-500 uppercase">Relación</div>
          <div
            className={clsx(
              can('checkin:delete-guardian-relation') ? 'col-span-3' : 'col-span-4',
              'font-bold text-gray-500 uppercase',
            )}
          >
            Teléfono
          </div>
          <div className={clsx(can('checkin:delete-guardian-relation') ? 'col-span-2' : 'col-span-1')}></div>

          {relationsList.map((rel) => (
            <React.Fragment key={rel.id}>
              <div className="col-span-12 border-t border-gray-50 my-0.5"></div>
              <div
                className="col-span-4 text-gray-800 font-medium leading-tight truncate"
                title={rel.fullName}
              >
                {rel.fullName}
              </div>
              <div className="col-span-3 text-gray-600">{rel.relation}</div>
              <div className="col-span-3 text-gray-600 flex items-center gap-1.5 flex-wrap">
                <span>{rel.displayPhone}</span>
                {rel.isPhoneErroneous && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 text-[10px] font-bold border border-amber-300"
                    title={`Formato de teléfono errado. Por favor pregúntele el número correcto a ${guardianTerm.toLowerCase()} y corríjalo con el lápiz.`}
                  >
                    <AlertTriangle size={11} className="text-amber-600 shrink-0" />
                    <span>Teléfono errado — Preguntar a {guardianTerm.toLowerCase()}</span>
                  </span>
                )}
              </div>
              <div className="col-span-2 flex justify-end items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateGuardian({
                      id: rel.id,
                      firstName: rel.firstName,
                      lastName: rel.lastName,
                      fullName: rel.fullName,
                      gender: rel.gender,
                      dialCodePhone: rel.dialCodePhone,
                      phone: rel.rawPhone,
                      relation: rel.rawRelation,
                      kidId: kid?.id,
                    })
                  }
                  className="text-primary p-2 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
                  title={`Editar ${guardianTerm.toLowerCase()}`}
                >
                  <Pencil size={14} />
                </button>
                <Can capability="checkin:delete-guardian-relation">
                  <button
                    type="button"
                    onClick={() => onDeleteGuardianRelation(rel)}
                    className="text-red-600 p-2 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                    title={`Eliminar relación con ${guardianTerm.toLowerCase()}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </Can>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-8">
        <Button onClick={onReprint} block variant="primary">
          <Printer size={18} className="mr-2 shrink-0" />{' '}
          {t('kidRegistration:check_in.btn_reprint_ticket')}
        </Button>

        <Can capability="checkin:delete-record">
          <Button onClick={onDelete} block variant="danger">
            <Trash2 size={18} className="mr-2 inline" />{' '}
            {t('kidRegistration:check_in.btn_delete_registration')}
          </Button>
        </Can>
      </div>
    </>
  );
};
