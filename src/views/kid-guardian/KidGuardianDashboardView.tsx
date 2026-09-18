import React, { useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import {
  QrCode,
  Maximize2,
  AlertCircle,
  Clock,
  CheckCircle2,
  HeartPulse,
  Sun,
  X,
  RefreshCw,
} from 'lucide-react';
import { FaChild, FaChildDress } from 'react-icons/fa6';
import clsx from 'clsx';
import * as Dialog from '@radix-ui/react-dialog';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { useGetMyGuardianAssignedKidsQuery } from '@/libs/state/redux/api/kidChurchApi';
import { KidGuardianRelationEnum } from '@/libs/models/KidChurch';
import { useKidsTerm } from '@/libs/hooks/useTerm';
import { capitalizeWords } from '@/libs/utils/text';
import Button from '@/components/ui/Button';

/**
 * Dashboard for the Kid Guardian (Acudiente) experience.
 * Displays the guardian's personal QR check-in code and the list of linked children.
 *
 * @returns {JSX.Element} The rendered Kid Guardian dashboard.
 */
const KidGuardianDashboardView: React.FC = () => {
  const authUser = useAppSelector((state) => state.authSlice.user);
  const kidsModuleName = useKidsTerm('module_alias');
  const guardianTerm = useKidsTerm('guardian');
  const classroomsTerm = useKidsTerm('classrooms');

  const [fullscreenQrOpen, setFullscreenQrOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetMyGuardianAssignedKidsQuery();

  const guardian = data?.guardian;
  const kids = data?.kids || [];
  const qrValue = guardian?.qrCodeValue || guardian?.id || authUser?.id || '';
  const firstName = guardian?.firstName || authUser?.firstName || '';
  const lastName = guardian?.lastName || authUser?.lastName || '';
  const guardianFullName = firstName || lastName
    ? `${capitalizeWords(firstName)} ${capitalizeWords(lastName)}`.trim()
    : '';
  const guardianPhone = guardian?.phone || authUser?.phone || '';
  const guardianDialCode = guardian?.dialCodePhone || authUser?.dialCodePhone || '+57';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Cargando tu información...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm text-center flex flex-col items-center gap-3 my-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">No pudimos cargar tus datos</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Ocurrió un problema al consultar tus niños asignados. Por favor verifica tu conexión.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => refetch()}
          loading={isFetching}
          className="mt-2 text-xs"
        >
          <RefreshCw className="w-4 h-4 mr-1.5 inline" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      {/* Guardian Digital ID Pass / QR Card */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-sky-700 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-36 h-36 bg-sky-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200 mb-1">
            Carnet Digital · {kidsModuleName}
          </span>
          <h2 className="text-lg font-black text-white truncate max-w-full">
            {guardianFullName || 'Acudiente'}
          </h2>
          {guardianPhone && (
            <p className="text-xs text-indigo-200/90 font-medium mt-0.5">
              Tel: {guardianDialCode} {guardianPhone}
            </p>
          )}

          {/* QR Code Container */}
          <div
            onClick={() => setFullscreenQrOpen(true)}
            className="mt-4 p-3.5 bg-white rounded-2xl shadow-md cursor-pointer transition-transform active:scale-95 group relative"
            role="button"
            tabIndex={0}
            aria-label="Ampliar código QR"
          >
            {qrValue ? (
              <QRCode
                value={qrValue}
                size={180}
                qrStyle="squares"
                fgColor="#0f172a"
                bgColor="#ffffff"
                ecLevel="M"
                quietZone={6}
              />
            ) : (
              <div className="w-[180px] h-[180px] flex items-center justify-center text-slate-400">
                <QrCode className="w-12 h-12 animate-pulse" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-2xl transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 bg-slate-900/80 text-white text-[11px] font-semibold py-1 px-2.5 rounded-full flex items-center gap-1 transition-opacity">
                <Maximize2 className="w-3 h-3" /> Ampliar
              </span>
            </div>
          </div>

          <p className="text-[11px] text-indigo-100/90 font-medium mt-3 flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            Muestra este código al llegar a la estación de registro
          </p>
        </div>
      </section>

      {/* Fullscreen QR Modal */}
      <Dialog.Root open={fullscreenQrOpen} onOpenChange={setFullscreenQrOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/85 z-50 animate-in fade-in duration-200" />
          <Dialog.Content className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md w-full bg-white rounded-3xl p-6 z-50 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200 outline-hidden">
            <div className="w-full flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="text-left">
                <Dialog.Title className="text-base font-bold text-slate-800">
                  Código QR de Ingreso
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  {guardianFullName}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="my-5 p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-inner flex items-center justify-center">
              {qrValue && (
                <QRCode
                  value={qrValue}
                  size={260}
                  qrStyle="squares"
                  fgColor="#000000"
                  bgColor="#ffffff"
                  ecLevel="M"
                  quietZone={10}
                />
              )}
            </div>

            <div className="w-full bg-amber-50 border border-amber-200/80 rounded-2xl p-3 flex items-center gap-2.5 text-left">
              <Sun className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-900 font-medium leading-relaxed">
                Sube el brillo de tu pantalla al máximo para facilitar el escaneo en el lector.
              </p>
            </div>

            <Button
              variant="primary"
              block
              onClick={() => setFullscreenQrOpen(false)}
              className="mt-4"
            >
              Listo
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Children Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
              Niños asignados
            </h3>
            <p className="text-xs text-slate-500">
              Vinculados a tu perfil de {guardianTerm.toLowerCase()}
            </p>
          </div>
          <span className="text-xs font-extrabold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
            {kids.length} {kids.length === 1 ? 'niño' : 'niños'}
          </span>
        </div>

        {kids.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <FaChild className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800">Sin niños vinculados aún</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                No tienes niños registrados a tu nombre todavía. Acércate a la estación de registro de{' '}
                {kidsModuleName} para asociar a tus hijos.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {kids.map((kid) => {
              const isGirl = kid.gender === 'F';
              const kidFullName = `${capitalizeWords(kid.firstName)} ${capitalizeWords(kid.lastName)}`;
              const isCheckedInToday = Boolean(kid.todayRegistration);

              return (
                <article
                  key={kid.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col gap-3 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Kid Avatar */}
                    <div
                      className={clsx(
                        'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-xs',
                        isGirl
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-sky-100 text-sky-600'
                      )}
                    >
                      {kid.photoUrl ? (
                        <img
                          src={kid.photoUrl}
                          alt={kidFullName}
                          className="w-full h-full object-cover"
                        />
                      ) : isGirl ? (
                        <FaChildDress className="w-6 h-6" />
                      ) : (
                        <FaChild className="w-6 h-6" />
                      )}
                    </div>

                    {/* Kid Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {kidFullName}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                        {kid.age !== undefined && (
                          <span>{kid.age} {kid.age === 1 ? 'año' : 'años'}</span>
                        )}
                        {kid.relation && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span>{KidGuardianRelationEnum[kid.relation] || kid.relation}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isCheckedInToday ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ingresado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Pendiente
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Classroom & Medical Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                    {kid.kidGroup && (
                      <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg">
                        {classroomsTerm}: {kid.kidGroup.name}
                      </span>
                    )}

                    {kid.medicalCondition && (
                      <span className="text-[11px] font-semibold bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                        <HeartPulse className="w-3 h-3 text-rose-500" />
                        {kid.medicalCondition.name}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default KidGuardianDashboardView;
