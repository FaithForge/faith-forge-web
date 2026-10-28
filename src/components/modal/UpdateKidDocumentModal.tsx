import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, IdCard } from 'lucide-react';
import { toast } from 'sonner';
import ModalOverlay from '@/components/ui/ModalOverlay';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SelectSearch from '@/components/ui/SelectSearch';
import { useUpdateKidMutation } from '@/libs/state/redux/api/kidChurchApi';
import { IKid, idKidTypeSelect, UserIdType } from '@/libs/models';
import { isFeatureEnabled } from '@/config/features';
import { capitalizeWords } from '@/libs/utils/text';

interface UpdateKidDocumentModalProps {
  open: boolean;
  onClose: () => void;
  kid?: IKid | null;
  onSuccess?: (updatedFields: { nationalIdType: UserIdType; nationalId: string }) => void;
}

/**
 * Dedicated modal to quickly register or update a child's identity document
 * during the check-in flow without leaving the screen or blocking registration.
 *
 * @param {UpdateKidDocumentModalProps} props - Modal state, target kid, and callbacks.
 * @returns {JSX.Element} Rendered modal dialog.
 */
const UpdateKidDocumentModal: React.FC<UpdateKidDocumentModalProps> = ({
  open,
  onClose,
  kid,
  onSuccess,
}) => {
  const { t } = useTranslation(['kidRegistration', 'common']);
  const [updateKid, { isLoading }] = useUpdateKidMutation();

  const [nationalIdType, setNationalIdType] = useState<UserIdType>(UserIdType.RC);
  const [nationalId, setNationalId] = useState<string>('');
  const [error, setError] = useState<string>('');

  const documentTypeOptions = useMemo(
    () =>
      idKidTypeSelect.map((opt) => ({
        id: opt.value,
        name: opt.label,
      })),
    [],
  );

  useEffect(() => {
    if (open && kid) {
      setNationalIdType((kid.nationalIdType as UserIdType) || UserIdType.RC);
      setNationalId(kid.nationalId || '');
      setError('');
    }
  }, [open, kid]);

  const kidFullName = useMemo(() => {
    if (!kid) return '';
    return capitalizeWords(`${kid.firstName || ''} ${kid.lastName || ''}`.trim());
  }, [kid]);

  /**
   * Validates and submits the child's document update to the backend.
   *
   * @param {React.FormEvent} e - Form submit event.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!kid?.id) return;

    const trimmedDoc = nationalId.trim();
    if (!trimmedDoc) {
      setError(t('kidRegistration:check_in.update_document_modal.number_required'));
      return;
    }

    setError('');

    try {
      await updateKid({
        id: kid.id,
        data: {
          nationalIdType,
          nationalId: trimmedDoc,
        },
      }).unwrap();

      toast.success(t('kidRegistration:check_in.update_document_modal.success_toast'));
      onSuccess?.({ nationalIdType, nationalId: trimmedDoc });
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; message?: string };
      const message =
        apiErr?.data?.message ||
        apiErr?.message ||
        t('kidRegistration:check_in.update_document_modal.error_toast');
      toast.error(message);
    }
  };

  if (!open || !isFeatureEnabled('kidRegister')) return null;

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <div className="bg-white rounded-2xl p-5 shadow-xl mx-auto w-full max-w-sm flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100 gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <IdCard size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-gray-800 leading-snug">
                {t('kidRegistration:check_in.update_document_modal.title')}
              </h3>
              {kidFullName && (
                <p className="text-xs font-semibold text-gray-500 mt-0.5 truncate">{kidFullName}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-gray-50 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors outline-none shrink-0 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed mb-4">
          {t('kidRegistration:check_in.update_document_modal.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <SelectSearch
            label={t('kidRegistration:check_in.update_document_modal.type_label')}
            required
            value={nationalIdType}
            onChange={(val) => setNationalIdType(val as UserIdType)}
            options={documentTypeOptions}
            placeholder={t('kidRegistration:check_in.update_document_modal.type_placeholder')}
          />

          <Input
            label={t('kidRegistration:check_in.update_document_modal.number_label')}
            required
            value={nationalId}
            onChange={(e) => {
              setNationalId(e.target.value);
              if (error) setError('');
            }}
            onClear={() => {
              setNationalId('');
              if (error) setError('');
            }}
            placeholder={t('kidRegistration:check_in.update_document_modal.number_placeholder')}
            error={error}
            className="placeholder:text-gray-400"
          />

          <div className="flex gap-3 mt-2">
            <Button type="button" onClick={onClose} variant="ghost" className="flex-1">
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={isLoading} className="flex-1">
              {t('kidRegistration:check_in.update_document_modal.btn_save')}
            </Button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
};

export default UpdateKidDocumentModal;
