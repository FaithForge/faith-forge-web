import React from 'react';
import { Drawer } from 'vaul';
import { X, Cake, Phone, User, HeartPulse, FileText, Clock, Shield } from 'lucide-react';
import dayjs from 'dayjs';
import TagKidGroup from '@/components/ui/TagKidGroup';
import {
  IKid,
  UserGenderCode,
  USER_GENDER_CODE_MAPPER,
  KID_RELATION_CODE_MAPPER,
  IKidGuardian,
  KidGuardianRelationCodeEnum,
} from '@/libs/models';
import { capitalizeWords } from '@/libs/utils/text';

interface KidDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kid?: IKid;
}

/**
 * Bottom sheet drawer displaying complete details of a registered kid in Iglekids.
 *
 * @param {KidDetailsDrawerProps} props - Open state and kid data.
 * @returns {JSX.Element}
 */
const KidDetailsDrawer: React.FC<KidDetailsDrawerProps> = ({ open, onOpenChange, kid }) => {
  if (!kid) return null;

  const imageProfile = kid.photoUrl
    ? kid.photoUrl
    : kid.gender === UserGenderCode.FEMALE
      ? '/icons/girl-v2.png'
      : '/icons/boy-v2.png';

  const isBirthdayToday = (() => {
    if (!kid.birthday) return false;
    const str = typeof kid.birthday === 'string' ? kid.birthday : new Date(kid.birthday).toISOString();
    if (str.length >= 10 && str.includes('-')) {
      const parts = str.substring(0, 10).split('-');
      if (parts.length === 3) {
        return `${parts[1]}-${parts[2]}` === dayjs().format('MM-DD');
      }
    }
    return dayjs(kid.birthday).format('MM-DD') === dayjs().format('MM-DD');
  })();

  const birthdayFormatted = kid.birthday
    ? dayjs(kid.birthday).format('D [de] MMMM [de] YYYY')
    : null;

  const checkingGuardian = kid.relations?.find(
    (relation) => relation.id === kid.currentKidRegistration?.guardianId
  );

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[100]" />
        <Drawer.Content className="bg-gray-50 flex flex-col rounded-t-[24px] fixed bottom-0 left-0 right-0 z-[101] outline-none mt-20 max-h-[calc(100vh-5rem)]">
          {/* Header Bar */}
          <div className="p-4 bg-white rounded-t-[24px] border-b border-gray-100 shadow-sm z-20 flex items-center justify-between sticky top-0">
            <div className="w-8" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-1.5 rounded-full bg-gray-300 mb-1" />
              <h3 className="font-bold text-gray-800 text-lg">Detalle del Niño</h3>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto p-4 flex flex-col gap-4 pb-12">
            {/* Top Profile Card */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="relative mb-3">
                <img
                  src={imageProfile}
                  alt={kid.firstName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-gray-100"
                />
              </div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                {capitalizeWords(`${kid.firstName || ''} ${kid.lastName || ''}`.trim())}
              </h1>
              <div className="mt-2">
                <TagKidGroup kidGroup={kid.kidGroup?.name} staticGroup={kid.staticGroup} />
              </div>
            </div>

            {/* Birthday Alert */}
            {isBirthdayToday && (
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-2xl shadow-sm flex items-center gap-3 animate-pulse">
                <Cake size={28} className="shrink-0" />
                <div>
                  <h4 className="font-black text-base">¡Hoy es su cumpleaños! 🎉</h4>
                  <p className="text-xs text-amber-100">Felicítalo y haz de su día una gran bendición.</p>
                </div>
              </div>
            )}

            {/* General Info Card */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2 mb-3">
                <User size={16} className="text-primary" /> Datos Generales
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-500 font-medium block">Código</span>
                  <span className="font-bold text-gray-800">{kid.faithForgeId || kid.id || 'N/A'}</span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-500 font-medium block">Edad</span>
                  <span className="font-bold text-gray-800">
                    {Math.floor(kid.age ?? 0)} años {kid.ageInMonths ? `y ${kid.ageInMonths - Math.floor(kid.age ?? 0) * 12} meses` : ''}
                  </span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-500 font-medium block">Fecha Nacimiento</span>
                  <span className="font-bold text-gray-800">{birthdayFormatted || 'N/A'}</span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-500 font-medium block">Género</span>
                  <span className="font-bold text-gray-800">
                    {kid.gender ? (USER_GENDER_CODE_MAPPER as any)[kid.gender] || kid.gender : 'N/A'}
                  </span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 col-span-2">
                  <span className="text-xs text-gray-500 font-medium block">EPS / Salud</span>
                  <span className="font-bold text-gray-800">{kid.healthSecurityEntity || 'No especificada'}</span>
                </div>
              </div>

              {kid.medicalCondition && (
                <div className="mt-3 bg-red-50 p-3 rounded-xl border border-red-200">
                  <span className="text-xs font-bold text-red-700 flex items-center gap-1.5 mb-1">
                    <HeartPulse size={15} /> Condición Médica / Alergias
                  </span>
                  <p className="text-sm font-semibold text-red-900">
                    {kid.medicalCondition.code ? `${kid.medicalCondition.code} - ` : ''}{kid.medicalCondition.name}
                  </p>
                </div>
              )}

              {kid.observations && (
                <div className="mt-3 bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-1">
                    <FileText size={15} /> Observaciones Generales
                  </span>
                  <p className="text-sm text-amber-950 font-medium">{kid.observations}</p>
                </div>
              )}
            </div>

            {/* Check-In Info Card */}
            {kid.currentKidRegistration && (
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-primary" /> Información de Registro Hoy
                </h3>
                <div className="flex flex-col gap-2.5 text-sm">
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <span className="text-xs text-emerald-700 font-semibold block">Hora de Ingreso</span>
                    <span className="font-bold text-emerald-900 text-base">
                      {dayjs(kid.currentKidRegistration.date).format('h:mm:ss A (D [de] MMMM)')}
                    </span>
                  </div>

                  {checkingGuardian && (
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-xs text-gray-500 font-medium block">Acudiente que Realizó el Ingreso</span>
                      <p className="font-bold text-gray-800 mt-0.5">
                        {capitalizeWords(`${checkingGuardian.firstName} ${checkingGuardian.lastName || ''}`.trim())}
                        <span className="text-xs font-normal text-gray-500 ml-1.5">
                          ({(KID_RELATION_CODE_MAPPER as any)[checkingGuardian.relation] || checkingGuardian.relation})
                        </span>
                      </p>
                    </div>
                  )}

                  {kid.currentKidRegistration.observation && (
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                      <span className="text-xs text-amber-800 font-bold block">Observación del Registro</span>
                      <p className="text-sm text-amber-950 mt-0.5">{kid.currentKidRegistration.observation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Guardians Card */}
            {kid.relations && kid.relations.length > 0 && (
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2 mb-3">
                  <Shield size={16} className="text-primary" /> Acudientes Autorizados
                </h3>
                <div className="flex flex-col gap-2.5">
                  {kid.relations.map((guardian: IKidGuardian, idx: number) => {
                    const phoneFormatted = `${guardian.dialCodePhone || '+57'} ${guardian.phone || ''}`.trim();
                    const rawPhone = `${guardian.dialCodePhone || ''}${guardian.phone || ''}`.replace(/\s+/g, '');
                    return (
                      <div
                        key={guardian.id || idx}
                        className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-800 text-sm truncate">
                            {capitalizeWords(`${guardian.firstName} ${guardian.lastName || ''}`.trim())}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {(KID_RELATION_CODE_MAPPER as any)[guardian.relation as KidGuardianRelationCodeEnum] || guardian.relation}
                          </p>
                          <p className="text-xs font-semibold text-primary mt-1">
                            {phoneFormatted}
                          </p>
                        </div>
                        {guardian.phone && (
                          <a
                            href={`tel:${rawPhone}`}
                            className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm hover:bg-emerald-700 transition-colors"
                            title="Llamar acudiente"
                          >
                            <Phone size={18} />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default KidDetailsDrawer;
