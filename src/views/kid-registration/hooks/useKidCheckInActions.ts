import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  useCreateKidRegistrationMutation,
  useReprintKidRegistrationMutation,
  useDeleteKidRegistrationMutation,
  useDeleteKidMutation,
  useDeleteKidGuardianRelationMutation,
} from '@/libs/state/redux/api/kidChurchApi';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { bluetoothPrinter } from '@/libs/utils/printer/bluetoothPrinter';
import { KID_AGE_COPY } from '@/libs/common-types/constants';
import { APP_ROUTES } from '@/config/routes';
import { FormattedRelation } from './useKidCheckInData';

interface UseKidCheckInActionsProps {
  kid: any;
  kidGroups: any[];
  relationsList: FormattedRelation[];
  selectedGuardian: string;
  setSelectedGuardian: (id: string) => void;
  observationType: string;
  customObservation: string;
  isOverage: boolean;
  isSelectedGuardianPhoneInvalid: boolean;
  currentCampus: any;
  currentMeeting: any;
  currentPrinter: any;
  isMeetingValid: boolean;
  meetingErrorMsg?: string;
  guardianTerm: string;
  can: (capability: any) => boolean;
  refetchKid: () => Promise<any>;
  setShowAdminOutOfScheduleModal: (show: boolean) => void;
}

/**
 * Hook to handle all check-in actions: registration, reprinting ticket, deleting registration,
 * deleting child, and unlinking guardians. Encapsulates Bluetooth and server-side printing.
 *
 * @param {UseKidCheckInActionsProps} props - Actions dependencies and callbacks.
 * @returns {object} Actions and state of processing step.
 */
export const useKidCheckInActions = ({
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
}: UseKidCheckInActionsProps) => {
  const { t } = useTranslation(['kidRegistration', 'common']);
  const navigate = useNavigate();

  const [createKidRegistration] = useCreateKidRegistrationMutation();
  const [reprintKidRegistration] = useReprintKidRegistrationMutation();
  const [deleteKidRegistration] = useDeleteKidRegistrationMutation();
  const [deleteKid] = useDeleteKidMutation();
  const [deleteGuardianRelation] = useDeleteKidGuardianRelationMutation();

  const printerModeSlice = useAppSelector((state) => state.printerModeSlice);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('Registrando...');
  const [guardianRelationToDelete, setGuardianRelationToDelete] = useState<FormattedRelation | null>(null);

  const executeRegistration = async (): Promise<void> => {
    if (isOverage && !can('checkin:bypass-age-limit')) {
      toast.error(KID_AGE_COPY.maxAgeToastError);
      return;
    }
    if (!selectedGuardian) {
      toast.error(`Por favor seleccione un(a) ${guardianTerm.toLowerCase()}`);
      return;
    }
    if (isSelectedGuardianPhoneInvalid) {
      toast.error(
        `El/La ${guardianTerm.toLowerCase()} seleccionado(a) tiene un número con formato errado. Debe preguntarle el número correcto y actualizarlo antes de registrar.`,
      );
      return;
    }
    if (!kid?.id || !kid?.kidGroup?.id) {
      toast.error('El niño no tiene asignado un grupo válido');
      return;
    }

    const targetGroupId = kid.kidGroup.id;

    let finalObservation = '';
    if (observationType === 'OTHER') {
      finalObservation = customObservation.trim();
    } else if (observationType !== 'NONE') {
      finalObservation = observationType;
    }

    if (!currentMeeting?.id) {
      toast.error('No hay una reunión activa seleccionada.');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStep('Guardando registro...');
      const isBluetooth = printerModeSlice?.mode === 'BLUETOOTH' && bluetoothPrinter.isConnected();
      const registrationResponse = (await createKidRegistration({
        kidId: kid.id,
        observation: finalObservation || undefined,
        kidGuardianId: selectedGuardian,
        kidGroupId: targetGroupId,
        churchMeetingId: currentMeeting.id,
        churchPrinterId: isBluetooth ? undefined : (currentPrinter?.id || undefined),
        skipServerPrint: isBluetooth,
      }).unwrap()) as { securityCode?: string; code?: string } | undefined;

      if (isBluetooth) {
        setProcessingStep('Imprimiendo etiqueta Bluetooth...');
        const guardian = relationsList.find(
          (g) => g.id === selectedGuardian || g.guardianId === selectedGuardian,
        );
        const group = kidGroups.find((g) => g.id === targetGroupId);
        const currentReg = kid.currentKidRegistration as { securityCode?: string } | undefined;
        await bluetoothPrinter.printKidTicket({
          kidName: `${kid.firstName} ${kid.lastName}`.trim(),
          kidGroup: group?.name || kid.kidGroup?.name || 'General',
          securityCode:
            registrationResponse?.securityCode ||
            registrationResponse?.code ||
            currentReg?.securityCode,
          guardianName: guardian ? `${guardian.firstName} ${guardian.lastName}`.trim() : undefined,
          guardianPhone: guardian?.displayPhone || guardian?.rawPhone,
          observation: finalObservation || undefined,
          campusName: currentCampus?.name,
          meetingName: currentMeeting?.name,
          gender: kid.gender,
        });
        toast.success('¡Etiqueta impresa por Bluetooth con éxito!');
      } else {
        toast.success('¡Etiqueta de registro enviada a impresión!');
      }
      navigate(APP_ROUTES.kidRegistration.root);
    } catch {
      toast.error('Error al registrar');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckIn = async (): Promise<void> => {
    if (!selectedGuardian) {
      toast.error(`Por favor seleccione un(a) ${guardianTerm.toLowerCase()}`);
      return;
    }
    if (isSelectedGuardianPhoneInvalid) {
      toast.error(
        `El/La ${guardianTerm.toLowerCase()} seleccionado(a) tiene un número con formato errado. Debe preguntarle el número correcto y actualizarlo antes de registrar.`,
      );
      return;
    }
    if (!kid?.id || !kid?.kidGroup?.id) {
      toast.error('El niño no tiene asignado un grupo válido');
      return;
    }

    if (!isMeetingValid) {
      if (can('checkin:bypass-schedule')) {
        setShowAdminOutOfScheduleModal(true);
        return;
      } else {
        toast.error(
          meetingErrorMsg ||
            'El servicio seleccionado ha finalizado. No se pueden realizar nuevos registros.',
        );
        navigate(APP_ROUTES.kidRegistration.root);
        return;
      }
    }

    await executeRegistration();
  };

  const handleReprint = async (): Promise<void> => {
    if (!kid?.currentKidRegistration) return;
    try {
      setIsProcessing(true);
      setProcessingStep(t('kidRegistration:check_in.reprint_requesting'));
      const isBluetooth = printerModeSlice?.mode === 'BLUETOOTH' && bluetoothPrinter.isConnected();
      await reprintKidRegistration({
        id: kid.currentKidRegistration.id,
        churchPrinterId: isBluetooth ? undefined : (currentPrinter?.id || undefined),
        skipServerPrint: isBluetooth,
      }).unwrap();
      if (isBluetooth) {
        setProcessingStep(t('kidRegistration:check_in.reprint_printing_bluetooth'));
        const guardian = relationsList.find(
          (g) => g.id === selectedGuardian || g.guardianId === selectedGuardian,
        );
        const currentReg = kid.currentKidRegistration as any;
        await bluetoothPrinter.printKidTicket({
          kidName: `${kid.firstName} ${kid.lastName}`.trim(),
          kidGroup: kid.kidGroup?.name || 'General',
          securityCode: currentReg?.securityCode || currentReg?.code,
          guardianName: guardian ? `${guardian.firstName} ${guardian.lastName}`.trim() : undefined,
          guardianPhone: guardian?.displayPhone || guardian?.rawPhone,
          campusName: currentCampus?.name,
          meetingName: currentMeeting?.name,
          gender: kid.gender || (kid as any).sex,
        });
        toast.success(t('kidRegistration:check_in.reprint_success_bluetooth'));
      } else {
        toast.success(t('kidRegistration:check_in.reprint_success'));
      }
      navigate(APP_ROUTES.kidRegistration.root);
    } catch {
      toast.error(t('kidRegistration:check_in.reprint_error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!kid?.currentKidRegistration) return;
    try {
      await deleteKidRegistration({ id: kid.currentKidRegistration.id, kidId: kid.id }).unwrap();
      toast.success(t('kidRegistration:check_in.delete_registration_success'));
      navigate(APP_ROUTES.kidRegistration.root);
    } catch {
      toast.error(t('kidRegistration:check_in.delete_registration_error'));
    }
  };

  const handleDeleteKid = async (targetKidId?: string): Promise<void> => {
    if (!kid?.id) return;
    try {
      await deleteKid({ id: kid.id, targetKidId }).unwrap();
      toast.success(
        targetKidId
          ? 'Niño eliminado e información transferida correctamente'
          : 'Niño eliminado correctamente',
      );
      navigate(APP_ROUTES.kidRegistration.root, { replace: true });
    } catch {
      toast.error('Error al eliminar el niño');
    }
  };

  const handleConfirmDeleteGuardianRelation = async (): Promise<void> => {
    if (!guardianRelationToDelete || !kid?.id) return;
    const targetGuardianId = guardianRelationToDelete.guardianId || guardianRelationToDelete.id;
    const guardianName = guardianRelationToDelete.fullName;

    try {
      await deleteGuardianRelation({
        kidId: kid.id,
        guardianId: targetGuardianId,
      }).unwrap();

      toast.success(
        `Relación con ${guardianName || `el/la ${guardianTerm.toLowerCase()}`} eliminada con éxito`,
      );
      if (selectedGuardian === targetGuardianId) {
        setSelectedGuardian('');
      }
      await refetchKid();
    } catch (err: unknown) {
      const errorResponse = err as { data?: { message?: string }; message?: string };
      const msg =
        errorResponse?.data?.message ||
        errorResponse?.message ||
        `Error al eliminar la relación con ${guardianTerm.toLowerCase()}`;
      toast.error(msg);
    } finally {
      setGuardianRelationToDelete(null);
    }
  };

  return {
    isProcessing,
    processingStep,
    guardianRelationToDelete,
    setGuardianRelationToDelete,
    printerMode: printerModeSlice?.mode,
    executeRegistration,
    handleCheckIn,
    handleReprint,
    handleDelete,
    handleDeleteKid,
    handleConfirmDeleteGuardianRelation,
  };
};
