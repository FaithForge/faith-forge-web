import React from 'react';
import { AlertTriangle, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Select from '@/components/ui/Select';
import Can from '@/components/auth/Can';
import { FormattedRelation } from '../hooks/useKidCheckInData';

interface KidCheckInFormProps {
  relationsList: FormattedRelation[];
  selectedGuardian: string;
  setSelectedGuardian: (id: string) => void;
  selectedGuardianObj?: FormattedRelation;
  isSelectedGuardianPhoneInvalid: boolean;
  observationType: string;
  setObservationType: (val: string) => void;
  customObservation: string;
  setCustomObservation: (val: string) => void;
  guardianTerm: string;
  guardiansTerm: string;
  onOpenAssignGuardianModal: () => void;
  onUpdateGuardian: (rel: any) => void;
  onDeleteGuardianRelation: (rel: FormattedRelation) => void;
  kidId?: string;
}

/**
 * Check-in selection form for un-registered child.
 * Renders guardian radio list, wrong-phone warnings, and observations picker.
 *
 * @param {KidCheckInFormProps} props - Component props.
 * @returns {JSX.Element}
 */
export const KidCheckInForm: React.FC<KidCheckInFormProps> = ({
  relationsList,
  selectedGuardian,
  setSelectedGuardian,
  selectedGuardianObj,
  isSelectedGuardianPhoneInvalid,
  observationType,
  setObservationType,
  customObservation,
  setCustomObservation,
  guardianTerm,
  guardiansTerm,
  onOpenAssignGuardianModal,
  onUpdateGuardian,
  onDeleteGuardianRelation,
  kidId,
}) => {
  const { t } = useTranslation(['kidRegistration', 'common']);

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
      <div className="mb-5">
        <label className="block text-xs font-bold text-gray-700 mb-3 uppercase">
          {t('kidRegistration:form.step_guardian_info', { guardian: guardianTerm })}
        </label>
        <div className="flex flex-col gap-2.5">
          {relationsList.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs leading-relaxed shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-amber-950 text-sm mb-0.5">
                    No hay {guardiansTerm.toLowerCase()} registrados(as)
                  </strong>
                  <span className="text-amber-800">
                    Este niño no tiene {guardiansTerm.toLowerCase()} asignados(as). Por favor,{' '}
                    <strong>asigna un(a) {guardianTerm.toLowerCase()}</strong> seleccionando la opción en el menú
                    superior (<strong>⋮</strong>) o con el botón a continuación.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenAssignGuardianModal}
                className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 self-end sm:self-center"
              >
                <UserPlus size={15} /> Asignar {guardianTerm}
              </button>
            </div>
          ) : (
            relationsList.map((rel) => (
              <label
                key={rel.id}
                className="flex items-center gap-2.5 p-2.5 border-2 border-transparent hover:border-primary/50 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors relative has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="radio"
                  name="guardian"
                  checked={selectedGuardian === rel.id}
                  onChange={() => setSelectedGuardian(rel.id)}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="font-bold text-xs text-gray-800 break-words leading-tight"
                    title={`${rel.fullName} (${rel.relation})`}
                  >
                    {rel.fullName}{' '}
                    <span className="font-semibold text-gray-500 text-[11px]">({rel.relation})</span>
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[11px] text-gray-500 truncate">Tel: {rel.displayPhone}</p>
                    {rel.isPhoneErroneous && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/90 text-amber-950 text-[10px] font-bold border border-amber-300"
                        title="Teléfono con formato errado. Corregir con el lápiz antes de registrar."
                      >
                        <AlertTriangle size={11} className="text-amber-700 shrink-0" />
                        <span>Teléfono errado — Preguntar número correcto a {guardianTerm.toLowerCase()}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onUpdateGuardian({
                        id: rel.id,
                        firstName: rel.firstName,
                        lastName: rel.lastName,
                        fullName: rel.fullName,
                        gender: rel.gender,
                        dialCodePhone: rel.dialCodePhone,
                        phone: rel.rawPhone,
                        relation: rel.rawRelation,
                        kidId,
                      });
                    }}
                    className="text-primary p-1.5 bg-white rounded-full hover:bg-primary/10 shadow-sm border border-gray-200 transition-colors shrink-0"
                    title={`Editar ${guardianTerm.toLowerCase()}`}
                  >
                    <Pencil size={13} />
                  </button>
                  <Can capability="checkin:delete-guardian-relation">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDeleteGuardianRelation(rel);
                      }}
                      className="text-red-600 p-1.5 bg-white rounded-full hover:bg-red-50 shadow-sm border border-gray-200 hover:border-red-200 transition-colors shrink-0"
                      title={`Eliminar relación con ${guardianTerm.toLowerCase()}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </Can>
                </div>
              </label>
            ))
          )}
        </div>

        {selectedGuardianObj?.isPhoneErroneous && (
          <div className="mt-3 bg-amber-50 border-2 border-amber-300 text-amber-950 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="block font-bold text-amber-950 text-sm mb-0.5">
                  Teléfono errado — Preguntar número correcto a {guardianTerm.toLowerCase()}
                </strong>
                <span className="text-amber-900 leading-relaxed">
                  El número registrado (<strong>{selectedGuardianObj.displayPhone}</strong>) tiene un formato
                  errado. Por seguridad y comunicación, <strong>debes preguntarle el número correcto</strong> y
                  actualizarlo antes de poder registrar al niño.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateGuardian({
                  id: selectedGuardianObj.id,
                  firstName: selectedGuardianObj.firstName,
                  lastName: selectedGuardianObj.lastName,
                  fullName: selectedGuardianObj.fullName,
                  gender: selectedGuardianObj.gender,
                  dialCodePhone: selectedGuardianObj.dialCodePhone,
                  phone: selectedGuardianObj.rawPhone,
                  relation: selectedGuardianObj.rawRelation,
                  kidId,
                })
              }
              className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 self-end sm:self-center"
            >
              <Pencil size={14} /> Corregir Teléfono Ahora
            </button>
          </div>
        )}
      </div>

      <div>
        <Select
          label={t('kidRegistration:scanner.observations_select_label')}
          value={observationType}
          onChange={(e) => setObservationType(e.target.value)}
        >
          <option value="NONE">{t('kidRegistration:scanner.observations_options.none')}</option>
          <option value="Lleva bolso">{t('kidRegistration:scanner.observations_options.has_bag')}</option>
          <option value="Lleva merienda">{t('kidRegistration:scanner.observations_options.has_snack')}</option>
          <option value="Lleva bolso y merienda">
            {t('kidRegistration:scanner.observations_options.has_bag_and_snack')}
          </option>
          <option value="OTHER">{t('kidRegistration:scanner.observations_options.other')}</option>
        </Select>

        {observationType === 'OTHER' && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <textarea
              className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-2.5 px-3 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm placeholder:text-gray-400"
              rows={3}
              maxLength={300}
              placeholder={t('kidRegistration:scanner.custom_observation_placeholder')}
              value={customObservation}
              onChange={(e) => setCustomObservation(e.target.value)}
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
};
