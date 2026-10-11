import React from 'react';
import { AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { capitalizeWords } from '@/libs/utils/text';
import { formatDateOnly } from '@/libs/utils/date';

interface KidInfoCardProps {
  kid: any;
  formattedAge: string;
  isEpsUnknown: boolean;
  canViewCreatorInfo: boolean;
  guardianTerm: string;
}

/**
 * Child medical and general information card for KidCheckInView.
 * Displays birthday, gender, EPS, medical conditions, notes, and creator info.
 *
 * @param {KidInfoCardProps} props - Component props.
 * @returns {JSX.Element}
 */
export const KidInfoCard: React.FC<KidInfoCardProps> = ({
  kid,
  formattedAge,
  isEpsUnknown,
  canViewCreatorInfo,
  guardianTerm,
}) => {
  const { t } = useTranslation(['kidRegistration', 'common']);

  return (
    <>
      {/* Banner de aviso si la EPS es NO SABE */}
      {isEpsUnknown && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl mb-4 flex items-start gap-3 text-xs leading-relaxed shadow-xs">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-amber-900 text-sm mb-0.5">⚠️ EPS no registrada ("NO SABE")</h4>
            <p className="text-amber-800">
              La EPS del niño se encuentra registrada como <span className="font-bold">"NO SABE"</span>. Por favor,{' '}
              <strong>pregunta a {guardianTerm.toLowerCase()} si ya conoce la EPS actual del niño</strong> y
              actualízala desde las opciones (<strong>⋮</strong>).
            </p>
          </div>
        </div>
      )}

      {/* Tarjeta con Información Detallada del Niño (Datos del Niño) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">
          {t('kidRegistration:form.step_kid_info')}
        </h2>
        <div className="flex flex-col gap-y-3 text-sm">
          {formattedAge && (
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="font-semibold text-gray-500">{t('kidRegistration:check_in.age_label')}</span>
              <span className="font-bold text-gray-800">{formattedAge}</span>
            </div>
          )}

          {kid?.birthday && (
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="font-semibold text-gray-500">{t('kidRegistration:form.birthday_label')}</span>
              <span className="font-bold text-gray-800">{formatDateOnly(kid.birthday)}</span>
            </div>
          )}

          {kid?.gender && (
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="font-semibold text-gray-500">{t('kidRegistration:form.gender_label')}</span>
              <span className="font-bold text-gray-800">
                {kid.gender === 'M'
                  ? t('kidRegistration:form.gender_male')
                  : kid.gender === 'F'
                    ? t('kidRegistration:form.gender_female')
                    : kid.gender}
              </span>
            </div>
          )}

          {kid?.healthSecurityEntity && (
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="font-semibold text-gray-500">
                {t('kidRegistration:check_in.health_entity_label')}
              </span>
              <span
                className={clsx(
                  'font-bold',
                  isEpsUnknown ? 'text-amber-700 flex items-center gap-1.5' : 'text-gray-800',
                )}
              >
                {isEpsUnknown && <AlertTriangle size={15} className="text-amber-600" />}
                {capitalizeWords(kid.healthSecurityEntity)}
              </span>
            </div>
          )}

          {kid?.medicalCondition && (
            <div className="flex justify-between items-start py-1 border-b border-gray-50">
              <span className="font-semibold text-gray-500">
                {t('kidRegistration:check_in.medical_condition_label')}
              </span>
              <span className="font-bold text-amber-600 text-right">
                {typeof kid.medicalCondition === 'object'
                  ? `${kid.medicalCondition.code || ''} - ${kid.medicalCondition.name || ''}`
                  : kid.medicalCondition}
              </span>
            </div>
          )}

          {kid?.observations && (
            <div className="flex flex-col py-1">
              <span className="font-semibold text-gray-500 mb-1">
                {t('kidRegistration:check_in.notes_label')}
              </span>
              <span className="font-medium text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs leading-relaxed">
                {kid.observations}
              </span>
            </div>
          )}

          {canViewCreatorInfo && kid?.createdBy && (
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="font-semibold text-gray-500">Creado por</span>
              <span className="font-bold text-gray-800 text-right flex items-center justify-end gap-1.5 flex-wrap">
                <span>
                  {capitalizeWords(`${kid.createdBy.firstName || ''} ${kid.createdBy.lastName || ''}`.trim())}
                </span>
                {kid.createdBy.groupName && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200 shrink-0">
                    {kid.createdBy.groupName}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
