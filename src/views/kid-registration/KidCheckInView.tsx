import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Printer, MoreVertical, Pencil, UserPlus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import PageHeader from '@/components/ui/PageHeader';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { KidCheckInSkeleton } from '@/components/ui/DetailSkeleton';
import Can from '@/components/auth/Can';
import ProcessingPrintModal from '@/components/modal/ProcessingPrintModal';
import UpdateGuardianModal from '@/components/modal/UpdateGuardianModal';
import AssignGuardianModal from '@/components/modal/AssignGuardianModal';
import DeleteKidModal from '@/components/modal/DeleteKidModal';
import UpdateKidDocumentModal from '@/components/modal/UpdateKidDocumentModal';

import { useAppSelector } from '@/libs/state/redux/hooks';
import { useGetKidQuery, useGetKidGroupsQuery } from '@/libs/state/redux/api/kidChurchApi';
import { usePermissions } from '@/libs/hooks/usePermissions';
import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';
import { useKidsTerm } from '@/libs/hooks/useTerm';
import { KID_AGE_COPY } from '@/libs/common-types/constants';
import { capitalizeWords } from '@/libs/utils/text';
import { APP_ROUTES } from '@/config/routes';
import { isFeatureEnabled } from '@/config/features';

import { useKidCheckInData } from './hooks/useKidCheckInData';
import { useKidCheckInActions } from './hooks/useKidCheckInActions';
import { KidProfileCard } from './components/KidProfileCard';
import { KidInfoCard } from './components/KidInfoCard';
import { KidCheckInForm } from './components/KidCheckInForm';
import { RegisteredKidSummary } from './components/RegisteredKidSummary';

dayjs.locale('es');

/**
 * Child Check-In view (`/kid-registration/check-in/:id`).
 * Coordinates child inspection, guardian selection, ESC/POS ticket printing, and service registration.
 *
 * @returns {JSX.Element}
 */
const KidCheckInView: React.FC = () => {
  const { t } = useTranslation(['kidRegistration', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const guardianTerm = useKidsTerm('guardian');
  const guardiansTerm = useKidsTerm('guardians');
  const isKidRegisterEnabled = isFeatureEnabled('kidRegister');

  const currentCampus = useAppSelector((state) => state.churchCampusSlice.current);
  const currentMeeting = useAppSelector((state) => state.churchMeetingSlice.current);
  const { canViewCreatorInfo, can } = usePermissions();
  const { shouldBlockKids, isMeetingValid, meetingErrorMsg, currentPrinter } =
    useChurchMeetingStatus();

  const { data: kid, isLoading: loading, refetch: refetchKid } = useGetKidQuery(
    { id: id || '', registrationChurchMeetingId: currentMeeting?.id },
    { skip: !id },
  );
  const { data: kidGroups = [] } = useGetKidGroupsQuery();

  // Local form state
  const [selectedGuardian, setSelectedGuardian] = useState<string>('');
  const [observationType, setObservationType] = useState<string>('NONE');
  const [customObservation, setCustomObservation] = useState<string>('');
  const [selectedGuardianToUpdate, setSelectedGuardianToUpdate] = useState<any>(null);

  // Modals & Menu state
  const [showMenu, setShowMenu] = useState(false);
  const [showAssignGuardianModal, setShowAssignGuardianModal] = useState(false);
  const [showDeleteKidModal, setShowDeleteKidModal] = useState(false);
  const [showUpdateDocumentModal, setShowUpdateDocumentModal] = useState(false);
  const [showAdminOutOfScheduleModal, setShowAdminOutOfScheduleModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset imageError when kid or photo changes
  useEffect(() => {
    setImageError(false);
  }, [kid?.photoUrl]);

  // Security and schedule guard: Block entry if service is not started or out of schedule
  useEffect(() => {
    if (shouldBlockKids && !can('checkin:bypass-schedule')) {
      toast.error(
        meetingErrorMsg || 'El servicio aún no ha comenzado. El registro de niños no está disponible.',
      );
      navigate(APP_ROUTES.kidRegistration.root, { replace: true });
    }
  }, [shouldBlockKids, can, meetingErrorMsg, navigate]);

  // Derived data hook
  const {
    relationsList,
    registrationGuardian,
    isBirthdayToday,
    isEpsUnknown,
    formattedAge,
    isOverage,
    selectedGuardianObj,
    isSelectedGuardianPhoneInvalid,
  } = useKidCheckInData({
    kid,
    guardianTerm,
    selectedGuardian,
  });

  // Actions & printing hook
  const {
    isProcessing,
    processingStep,
    guardianRelationToDelete,
    setGuardianRelationToDelete,
    printerMode,
    executeRegistration,
    handleCheckIn,
    handleReprint,
    handleDelete,
    handleDeleteKid,
    handleConfirmDeleteGuardianRelation,
  } = useKidCheckInActions({
    kid,
    kidGroups,
    relationsList,
    selectedGuardian,
    setSelectedGuardian,
    observationType,
    customObservation,
    isOverage,
    isSelectedGuardianPhoneInvalid,
    currentCampus,
    currentMeeting,
    currentPrinter,
    isMeetingValid,
    meetingErrorMsg,
    guardianTerm,
    can,
    refetchKid,
    setShowAdminOutOfScheduleModal,
  });

  // Automatically select the first guardian when relations are loaded
  useEffect(() => {
    if (relationsList.length > 0 && !selectedGuardian) {
      setSelectedGuardian(relationsList[0].id);
    }
  }, [relationsList, selectedGuardian]);

  const isRegistered = !!kid?.currentKidRegistration;

  const registeredGroup = isRegistered
    ? kidGroups.find((g) => g.id === kid?.currentKidRegistration?.groupId)
    : undefined;

  const displayedGroupName = isRegistered
    ? registeredGroup?.name || kid?.kidGroup?.name || 'General'
    : kid?.kidGroup?.name || 'Sin salón';

  const isStaticGroup = !!kid?.staticGroup;

  const rightMenuAction = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowMenu((prev) => !prev)}
        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-primary-foreground"
        title="Opciones"
      >
        <MoreVertical size={20} />
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 text-gray-800 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                if (id) navigate(APP_ROUTES.kidRegistration.updateKid(id));
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm font-semibold text-gray-700 transition-colors"
            >
              <Pencil size={17} className="text-gray-500" />
              <span>{t('kidRegistration:check_in.btn_update_data')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                setShowAssignGuardianModal(true);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm font-semibold text-gray-700 transition-colors"
            >
              <UserPlus size={17} className="text-gray-500" />
              <span>{t('kidRegistration:check_in.btn_assign_guardian', { guardian: guardianTerm })}</span>
            </button>

            <Can capability="checkin:delete-kid">
              <div className="border-t border-gray-100 my-1" />
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteKidModal(true);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-sm font-semibold text-red-600 transition-colors"
              >
                <Trash2 size={17} className="text-red-500" />
                <span>{t('kidRegistration:check_in.btn_delete_kid')}</span>
              </button>
            </Can>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-full bg-gray-50 flex flex-col flex-1 pb-6 sm:pb-8">
      <PageHeader
        title="Detalle y Registro"
        onBack={() => navigate(APP_ROUTES.kidRegistration.root)}
        rightAction={rightMenuAction}
      />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full pb-16 animate-in fade-in slide-in-from-right-4 duration-300">
        {(!kid || kid.id !== id || (loading && !(kid as any).relations)) && <KidCheckInSkeleton />}

        {kid && kid.id === id && (!loading || !!(kid as any).relations) && (
          <>
            <KidProfileCard
              kid={kid}
              formattedAge={formattedAge}
              isBirthdayToday={isBirthdayToday}
              isOverage={isOverage}
              isRegistered={isRegistered}
              displayedGroupName={displayedGroupName}
              isStaticGroup={isStaticGroup}
              imageError={imageError}
              setImageError={setImageError}
              onOpenPhotoModal={() => setShowPhotoModal(true)}
            />

            <KidInfoCard
              kid={kid}
              formattedAge={formattedAge}
              isEpsUnknown={isEpsUnknown}
              canViewCreatorInfo={canViewCreatorInfo}
              guardianTerm={guardianTerm}
              onOpenUpdateDocumentModal={
                isKidRegisterEnabled ? () => setShowUpdateDocumentModal(true) : undefined
              }
            />

            {isRegistered ? (
              <RegisteredKidSummary
                kid={kid}
                registrationGuardian={registrationGuardian}
                relationsList={relationsList}
                guardianTerm={guardianTerm}
                guardiansTerm={guardiansTerm}
                onReprint={handleReprint}
                onDelete={handleDelete}
                onUpdateGuardian={(rel) => setSelectedGuardianToUpdate(rel)}
                onDeleteGuardianRelation={(rel) => setGuardianRelationToDelete(rel)}
              />
            ) : (
              <>
                <KidCheckInForm
                  relationsList={relationsList}
                  selectedGuardian={selectedGuardian}
                  setSelectedGuardian={setSelectedGuardian}
                  selectedGuardianObj={selectedGuardianObj}
                  isSelectedGuardianPhoneInvalid={isSelectedGuardianPhoneInvalid}
                  observationType={observationType}
                  setObservationType={setObservationType}
                  customObservation={customObservation}
                  setCustomObservation={setCustomObservation}
                  guardianTerm={guardianTerm}
                  guardiansTerm={guardiansTerm}
                  onOpenAssignGuardianModal={() => setShowAssignGuardianModal(true)}
                  onUpdateGuardian={(rel) => setSelectedGuardianToUpdate(rel)}
                  onDeleteGuardianRelation={(rel) => setGuardianRelationToDelete(rel)}
                  kidId={kid?.id}
                />

                {isOverage && !can('checkin:bypass-age-limit') && (
                  <Alert type="error" message={KID_AGE_COPY.maxAgeAlertMessage} className="mb-4" />
                )}

                {shouldBlockKids && (
                  <Alert
                    type="error"
                    message={meetingErrorMsg || 'El servicio ha finalizado. El registro no está disponible.'}
                    className="mb-4"
                  />
                )}

                {isSelectedGuardianPhoneInvalid && (
                  <div className="mb-4 p-3.5 bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs rounded-xl flex items-center gap-2.5 shadow-xs">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                    <span>
                      <strong className="text-amber-950">Registro bloqueado:</strong> El/La{' '}
                      {guardianTerm.toLowerCase()} seleccionado(a) tiene un número con formato errado. Debe
                      preguntarle el número correcto y actualizarlo para poder registrar.
                    </span>
                  </div>
                )}

                <Button
                  onClick={handleCheckIn}
                  block
                  variant="primary"
                  className="mb-3"
                  loading={isProcessing}
                  loadingText={processingStep}
                  disabled={
                    shouldBlockKids ||
                    loading ||
                    isProcessing ||
                    relationsList.length === 0 ||
                    (isOverage && !can('checkin:bypass-age-limit')) ||
                    isSelectedGuardianPhoneInvalid
                  }
                >
                  <Printer size={20} className="mr-2 shrink-0" />{' '}
                  {t('kidRegistration:check_in.btn_confirm_checkin')}
                </Button>
                {/* Espaciador para evitar que el BottomNav flotante tape el botón */}
                <div className="h-24 sm:h-28 pointer-events-none shrink-0" aria-hidden="true" />
              </>
            )}
          </>
        )}
      </div>

      <ProcessingPrintModal
        open={isProcessing}
        isBluetooth={printerMode === 'BLUETOOTH'}
        stepText={processingStep}
      />

      <UpdateGuardianModal
        open={!!selectedGuardianToUpdate}
        onClose={() => setSelectedGuardianToUpdate(null)}
        guardian={selectedGuardianToUpdate}
      />

      <AssignGuardianModal
        open={showAssignGuardianModal}
        onClose={() => setShowAssignGuardianModal(false)}
        kidId={id || ''}
      />

      <DeleteKidModal
        open={showDeleteKidModal}
        onClose={() => setShowDeleteKidModal(false)}
        kid={kid}
        onConfirm={handleDeleteKid}
      />

      {isKidRegisterEnabled && (
        <UpdateKidDocumentModal
          open={showUpdateDocumentModal}
          onClose={() => setShowUpdateDocumentModal(false)}
          kid={kid}
          onSuccess={() => refetchKid()}
        />
      )}

      <ConfirmModal
        open={showAdminOutOfScheduleModal}
        onOpenChange={setShowAdminOutOfScheduleModal}
        title="¿Registrar fuera de horario?"
        description={`${meetingErrorMsg || 'El servicio seleccionado se encuentra fuera del horario habitual de registro.'} Como administrador, ¿deseas confirmar y proceder con el registro de este niño?`}
        confirmText="Sí, registrar"
        cancelText={t('common:actions.cancel')}
        type="warning"
        onConfirm={executeRegistration}
      />

      <ConfirmModal
        open={!!guardianRelationToDelete}
        onOpenChange={(open) => {
          if (!open) setGuardianRelationToDelete(null);
        }}
        title={`¿Eliminar relación de ${guardianTerm.toLowerCase()}?`}
        description={`¿Estás seguro de que deseas desvincular a ${guardianRelationToDelete?.fullName || `este(a) ${guardianTerm.toLowerCase()}`} del niño? Esta acción eliminará la relación pero mantendrá el historial de registros.`}
        confirmText="Sí, eliminar"
        cancelText={t('common:actions.cancel')}
        type="danger"
        onConfirm={handleConfirmDeleteGuardianRelation}
      />

      {/* Modal / Lightbox de Foto en Tamaño Grande */}
      {showPhotoModal && kid?.photoUrl && (
        <div
          onClick={() => setShowPhotoModal(false)}
          className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-sm w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center p-4 animate-in zoom-in-95 duration-200"
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="font-bold text-gray-800 text-sm truncate">
                {capitalizeWords(`${kid.firstName || ''} ${kid.lastName || ''}`)}
              </span>
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-base transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="w-full aspect-square mt-3 rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
              <img
                src={kid.photoUrl}
                alt="Foto del niño en tamaño completo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidCheckInView;
