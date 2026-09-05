import React, { useState, useMemo } from 'react';
import AppDrawer from '@/components/ui/AppDrawer';
import { X, Cake, Phone, AlertTriangle, Eye, CheckCircle2, FileText } from 'lucide-react';
import { FaWhatsapp, FaChild, FaChildDress } from 'react-icons/fa6';
import dayjs from 'dayjs';
import clsx from 'clsx';
import TagKidGroup from '@/components/ui/TagKidGroup';
import ModalOverlay from '@/components/ui/ModalOverlay';
import {
  IKid,
  USER_GENDER_CODE_MAPPER,
  KID_RELATION_CODE_MAPPER,
  IKidGuardian,
  KidGuardianRelationCodeEnum,
} from '@/libs/models';
import { capitalizeWords } from '@/libs/utils/text';
import { formatDateOnly, isDateToday } from '@/libs/utils/date';
import { isKidOverage, KID_AGE_COPY } from '@/libs/common-types/constants';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { UserRole, ALL_SYSTEM_ROLES_METADATA } from '@/libs/utils/auth';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';

interface KidDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kid?: IKid;
}

/**
 * Bottom sheet drawer displaying complete details of a registered kid in Iglekids.
 * Uses the exact design language, styling, and card layout from KidCheckInView.
 *
 * @param {KidDetailsDrawerProps} props - Open state and kid data.
 * @returns {JSX.Element | null}
 */
const KidDetailsDrawer: React.FC<KidDetailsDrawerProps> = ({ open, onOpenChange, kid }) => {
  useModalBackClose(open, () => onOpenChange(false));

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  const user = useAppSelector((state) => state.authSlice.user);
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);

  const registeredGuardianId = kid?.currentKidRegistration?.guardianId;
  const kidRelations = kid?.relations;

  // Find the guardian who performed check-in today
  const primaryGuardian = useMemo(() => {
    if (!registeredGuardianId || !kidRelations) return null;
    return (
      kidRelations.find(
        (rel) => rel.id === registeredGuardianId || (rel as any).guardian?.id === registeredGuardianId,
      ) || null
    );
  }, [kidRelations, registeredGuardianId]);

  // Other authorized guardians
  const otherGuardians = useMemo(() => {
    if (!kidRelations) return [];
    if (!primaryGuardian) return kidRelations;
    return kidRelations.filter(
      (rel) => rel.id !== primaryGuardian.id && (rel as any).guardian?.id !== primaryGuardian.id,
    );
  }, [kidRelations, primaryGuardian]);

  if (!kid) return null;

  const isOverage = isKidOverage(kid);
  const isRegistered = !!kid.currentKidRegistration;

  const senderName = user ? capitalizeWords(`${user.firstName || ''} ${user.lastName || ''}`.trim()) : 'un servidor';
  let roleTitle = 'Servidor(a)';
  if (currentRole === UserRole.KID_GROUP_USER || currentRole === UserRole.KID_REGISTER_USER) {
    roleTitle = 'Maestro(a)';
  } else if (currentRole === UserRole.KID_GROUP_SUPERVISOR || currentRole === UserRole.KID_REGISTER_SUPERVISOR) {
    roleTitle = 'Supervisor(a)';
  } else if (currentRole === UserRole.KID_GROUP_ADMIN || currentRole === UserRole.KID_REGISTER_ADMIN) {
    roleTitle = 'Coordinador(a)';
  } else if (currentRole === UserRole.ADMIN || currentRole === UserRole.SUPER_ADMIN || currentRole === UserRole.KID_CHURCH_ADMIN) {
    roleTitle = 'Administrador(a)';
  } else if (currentRole && ALL_SYSTEM_ROLES_METADATA[currentRole as UserRole]?.name) {
    roleTitle = ALL_SYSTEM_ROLES_METADATA[currentRole as UserRole].name;
  }

  const isBirthdayToday = isDateToday(kid.birthday);

  const birthdayFormatted = formatDateOnly(kid.birthday);

  const formattedAge = kid.age != null
    ? `${Math.floor(kid.age)} años${kid.ageInMonths ? ` y ${kid.ageInMonths - Math.floor(kid.age) * 12} meses` : ''}`
    : null;

  const isEpsUnknown = kid?.healthSecurityEntity?.trim()?.toUpperCase() === 'NO SABE';

  const registrationObservation =
    kid?.currentKidRegistration?.observation ||
    (kid?.currentKidRegistration as any)?.observations ||
    (kid?.currentKidRegistration as any)?.additionalInfo?.observation ||
    (kid?.currentKidRegistration as any)?.additionalInfo?.observations;

  const renderGuardianCard = (
    guardian: IKidGuardian,
    isPrimary: boolean = false,
  ) => {
    const g = (guardian as any).guardian || guardian;
    const firstName = g.firstName || guardian.firstName || '';
    const lastName = g.lastName || guardian.lastName || '';
    const fullName = capitalizeWords(`${firstName} ${lastName}`.trim());
    const rawRelation = (guardian as any).relationCode || guardian.relation || g.relation || '';
    const relationLabel = (KID_RELATION_CODE_MAPPER as any)[rawRelation as KidGuardianRelationCodeEnum] || rawRelation;
    const dialCode = g.dialCodePhone || guardian.dialCodePhone || '+57';
    const phone = g.phone || guardian.phone || '';
    const phoneFormatted = `${dialCode} ${phone}`.trim();
    const rawPhone = `${dialCode}${phone}`.replace(/\s+/g, '');
    const cleanWhatsAppDigits = `${dialCode}${phone}`.replace(/\D/g, '');
    const kidName = capitalizeWords(`${kid.firstName || ''} ${kid.lastName || ''}`.trim());
    const defaultWhatsAppText = `Hola, te hablamos de Iglekids. Mi nombre es *${senderName}* y soy *${roleTitle}* del área de Iglekids. Te escribimos sobre el niño(a) *${kidName}* por: `;
    const whatsappUrl = `https://wa.me/${cleanWhatsAppDigits}?text=${encodeURIComponent(defaultWhatsAppText)}`;

    return (
      <div
        key={guardian.id || `${firstName}-${lastName}`}
        className={clsx(
          "p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3",
          isPrimary
            ? "bg-emerald-50/40 border-emerald-200 shadow-2xs"
            : "bg-gray-50/70 border-gray-200/80 hover:bg-gray-100/60"
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-bold text-gray-900 text-sm truncate">
              {fullName}
            </p>
            {isPrimary && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100/90 text-emerald-800 rounded-full border border-emerald-300/80 shrink-0 flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-700" /> Entregó hoy
              </span>
            )}
            <span className="text-[11px] font-medium text-gray-600 bg-gray-200/70 px-2 py-0.5 rounded-md shrink-0">
              {relationLabel}
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-600">
            {phoneFormatted}
          </p>
        </div>

        {phone && (
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs hover:bg-emerald-600 active:scale-95 transition-all"
              title="Enviar mensaje por WhatsApp"
            >
              <FaWhatsapp size={16} />
            </a>
            <a
              href={`tel:${rawPhone}`}
              className="w-8 h-8 rounded-full bg-gray-200/80 text-gray-700 hover:bg-gray-300 flex items-center justify-center active:scale-95 transition-all"
              title="Llamar acudiente"
            >
              <Phone size={15} />
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <AppDrawer
        open={open}
        onOpenChange={onOpenChange}
        title="Detalle del Niño"
        bodyClassName="p-4 flex flex-col gap-4 pb-12"
      >
              {/* Birthday Banner */}
              {isBirthdayToday && (
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white p-3.5 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-black shadow-md animate-pulse tracking-wide">
                  <Cake size={22} className="text-yellow-200 animate-bounce" />
                  <span>¡¡¡HOY ES SU CUMPLEAÑOS!!! 🎉🎂</span>
                </div>
              )}

              {/* Banner de aviso si la EPS es NO SABE */}
              {isEpsUnknown && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl flex items-start gap-3 text-xs leading-relaxed shadow-xs">
                  <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-900 text-sm mb-0.5">⚠️ EPS no registrada ("NO SABE")</h4>
                    <p className="text-amber-800">
                      La EPS del niño se encuentra registrada como <span className="font-bold">"NO SABE"</span>.
                    </p>
                  </div>
                </div>
              )}

              {/* Cabecera Principal del Niño (Matches KidCheckInView) */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex gap-4 items-center">
                  <div className="relative shrink-0 group">
                    <div 
                      onClick={() => {
                        if (kid?.photoUrl && !imageError) setShowPhotoModal(true);
                      }}
                      className={clsx(
                        "w-20 h-20 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative",
                        kid?.photoUrl && !imageError ? "cursor-pointer transition-transform hover:scale-105 active:scale-95" : "",
                        (!kid?.photoUrl || imageError) && (
                          kid?.gender === 'F' || (kid?.gender as string)?.toUpperCase() === 'FEMALE'
                            ? "bg-pink-100 text-pink-500"
                            : "bg-blue-100 text-blue-500"
                        )
                      )}
                    >
                      {kid?.photoUrl && !imageError ? (
                        <>
                          <img 
                            src={kid.photoUrl} 
                            alt="Avatar" 
                            className="w-full h-full object-cover" 
                            onError={() => setImageError(true)}
                          />
                          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <Eye size={24} className="text-white drop-shadow-md" />
                          </div>
                        </>
                      ) : kid?.gender === 'F' || (kid?.gender as string)?.toUpperCase() === 'FEMALE' ? (
                        <FaChildDress size={42} />
                      ) : (
                        <FaChild size={42} />
                      )}
                    </div>

                    {kid?.photoUrl && !imageError && (
                      <button
                        type="button"
                        onClick={() => setShowPhotoModal(true)}
                        className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-primary transition-transform active:scale-90"
                      >
                        <Eye size={12} />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 leading-snug break-words">
                      {capitalizeWords(`${kid.firstName || ''} ${kid.lastName || ''}`)}
                    </h3>
                    <h4 className="text-sm text-gray-500 font-medium mt-0.5">
                      Código: {kid?.faithForgeId || kid?.id}{formattedAge ? ` • Edad: ${formattedAge}` : ''}
                    </h4>
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <TagKidGroup
                        kidGroup={kid.kidGroup?.name}
                        staticGroup={kid.staticGroup}
                      />
                      {isOverage && (
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-red-100 text-red-800 rounded-full border border-red-200">
                          {KID_AGE_COPY.maxAgeBadge}
                        </span>
                      )}
                      {isBirthdayToday && (
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300 flex items-center gap-1 animate-pulse">
                          🎂 Hoy
                        </span>
                      )}
                      {isRegistered && (
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                          Registrado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta con Información Detallada del Niño (Datos del Niño) */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">
                  Datos del niño
                </h2>
                <div className="flex flex-col gap-y-3 text-sm">
                  {formattedAge && (
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="font-semibold text-gray-500">Edad</span>
                      <span className="font-bold text-gray-800">{formattedAge}</span>
                    </div>
                  )}

                  {kid?.birthday && (
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="font-semibold text-gray-500">Fecha de nacimiento</span>
                      <span className="font-bold text-gray-800">{birthdayFormatted}</span>
                    </div>
                  )}

                  {kid?.gender && (
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="font-semibold text-gray-500">Género</span>
                      <span className="font-bold text-gray-800">
                        {kid.gender === 'M' ? 'Masculino' : kid.gender === 'F' ? 'Femenino' : (USER_GENDER_CODE_MAPPER as any)[kid.gender] || kid.gender}
                      </span>
                    </div>
                  )}

                  {kid?.healthSecurityEntity && (
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="font-semibold text-gray-500">EPS</span>
                      <span className={clsx("font-bold", isEpsUnknown ? "text-amber-700 flex items-center gap-1.5" : "text-gray-800")}>
                        {isEpsUnknown && <AlertTriangle size={15} className="text-amber-600" />}
                        {capitalizeWords(kid.healthSecurityEntity)}
                      </span>
                    </div>
                  )}

                  {kid?.medicalCondition && (
                    <div className="flex justify-between items-start py-1 border-b border-gray-50">
                      <span className="font-semibold text-gray-500">Condición Médica</span>
                      <span className="font-bold text-amber-600 text-right">
                        {typeof kid.medicalCondition === 'object' ? `${kid.medicalCondition.code || ''} - ${kid.medicalCondition.name || ''}` : kid.medicalCondition}
                      </span>
                    </div>
                  )}

                  {kid?.observations && (
                    <div className="flex flex-col py-1">
                      <span className="font-semibold text-gray-500 mb-1">Observaciones generales</span>
                      <span className="font-medium text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs leading-relaxed">
                        {kid.observations}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Información del Registro (Si está registrado hoy) */}
              {kid.currentKidRegistration && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">
                    Información del registro
                  </h2>
                  <div className="flex flex-col gap-y-3 text-sm">
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="font-semibold text-gray-500">Hora de ingreso</span>
                      <span className="font-bold text-gray-800 text-right">
                        {dayjs(kid.currentKidRegistration.date).format('h:mm:ss A (D [de] MMMM)')}
                      </span>
                    </div>

                    {registrationObservation && (
                      <div className="flex flex-col py-1 border-b border-gray-50 last:border-0">
                        <span className="font-semibold text-gray-500 mb-1">Observaciones del ingreso</span>
                        <span className="font-medium text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs leading-relaxed">
                          {registrationObservation}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Acudientes Autorizados */}
              {kid.relations && kid.relations.length > 0 && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3.5">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2">
                    Acudientes Autorizados
                  </h2>

                  <div className="flex flex-col gap-2.5">
                    {/* Acudiente principal que realizó el registro hoy */}
                    {primaryGuardian && renderGuardianCard(primaryGuardian, true)}

                    {/* Otros acudientes autorizados */}
                    {otherGuardians.length > 0 && (
                      <>
                        {primaryGuardian && (
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1 px-1">
                            Otros acudientes
                          </p>
                        )}
                        {otherGuardians.map((guardian) => renderGuardianCard(guardian, false))}
                      </>
                    )}
                  </div>
                </div>
              )}
      </AppDrawer>

      {/* Modal de Foto Grande (Zoom) */}
      <ModalOverlay open={showPhotoModal} onClose={() => setShowPhotoModal(false)}>
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full mx-auto p-4 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowPhotoModal(false)}
            className="absolute top-4 right-4 z-10 w-9 h-9 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60 active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
          <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-inner flex items-center justify-center">
            <img
              src={kid.photoUrl}
              alt={kid.firstName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="mt-3 text-center">
            <h4 className="font-bold text-gray-900 text-base">
              {capitalizeWords(`${kid.firstName || ''} ${kid.lastName || ''}`.trim())}
            </h4>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {kid.faithForgeId ? `Código: ${kid.faithForgeId}` : ''}
            </p>
          </div>
        </div>
      </ModalOverlay>
    </>
  );
};

export default KidDetailsDrawer;

