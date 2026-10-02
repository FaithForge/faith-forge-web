import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Lock, ShieldAlert, Pencil, Camera, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { updateAuthUser } from '@/libs/state/redux/slices/user/auth.slice';
import { useUpdateMyProfileMutation } from '@/libs/state/redux/api/userApi';
import { UploadUserImage } from '@/libs/state/redux/thunks/user/user.thunk';
import { resizeAndCropImageToSquare } from '@/libs/utils/image';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import {
  healthSecurityEntitySelect,
  ID_TYPE_CODE_MAPPER,
  userGenderSelect,
  UserGenderCode,
} from '@/libs/models/User';
import { toDateOnlyInputValue } from '@/libs/utils/date';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import SelectSearch from '@/components/ui/SelectSearch';
import PhoneInput from '@/components/ui/PhoneInput';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal to edit the authenticated user's personal basic profile information.
 * Documents (type and number) and credentials (password) are excluded.
 *
 * @param {EditProfileModalProps} props Component properties
 * @returns {JSX.Element | null} Rendered modal dialog
 */
const EditProfileModal: React.FC<EditProfileModalProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation(['profile', 'common']);
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.authSlice.user);
  const [updateMyProfile, { isLoading }] = useUpdateMyProfileMutation();

  useModalBackClose(open, () => onOpenChange(false));

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dialCodePhone, setDialCodePhone] = useState('+57');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState<string>('');
  const [healthSecurityEntity, setHealthSecurityEntity] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!user || !open) return;

    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setDialCodePhone((user as any).dialCodePhone || '+57');
    setPhone(user.phone || '');
    setEmail(user.email || '');
    setGender(user.gender || '');
    setHealthSecurityEntity(user.healthSecurityEntity || '');
    setPhotoPreview(user.photoUrl || '');
    setPhotoFile(null);

    setBirthday(toDateOnlyInputValue(user.birthday));
  }, [user, open]);

  if (!user) return null;

  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'US';

  const docTypeName = user.nationalIdType
    ? ID_TYPE_CODE_MAPPER[user.nationalIdType] || user.nationalIdType
    : t('profile:personal.document');

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const resizedBlob = await resizeAndCropImageToSquare(file);
        const resizedFile = new File([resizedBlob], file.name, { type: file.type });
        setPhotoFile(resizedFile);
        setPhotoPreview(URL.createObjectURL(resizedBlob));
      } catch {
        toast.error(t('profile:edit_modal.photo_process_error'));
      }
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error(t('profile:edit_modal.required_names'));
      return;
    }

    let finalPhotoUrl = user.photoUrl;

    if (photoFile) {
      try {
        setIsUploadingPhoto(true);
        const formData = new FormData();
        formData.append('file', photoFile);
        const uploadRes = await dispatch(UploadUserImage({ formData })).unwrap();
        if (uploadRes) finalPhotoUrl = uploadRes;
      } catch {
        toast.error(t('profile:edit_modal.photo_upload_error'));
      } finally {
        setIsUploadingPhoto(false);
      }
    } else if (!photoPreview && user.photoUrl) {
      finalPhotoUrl = undefined;
    }

    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dialCodePhone,
        phone: phone.trim() || undefined,
        email: email.trim().toLowerCase() || undefined,
        birthday: birthday || undefined,
        gender: (gender as UserGenderCode) || undefined,
        healthSecurityEntity: healthSecurityEntity.trim() || undefined,
        photoUrl: finalPhotoUrl || undefined,
      };

      const updatedUser = await updateMyProfile(payload).unwrap();
      dispatch(updateAuthUser(updatedUser));
      toast.success(t('profile:edit_modal.save_success'));
      onOpenChange(false);
    } catch (err: any) {
      const errorMsg =
        err?.data?.message ||
        err?.message ||
        t('profile:edit_modal.save_error');
      toast.error(errorMsg);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[320] animate-in fade-in" />
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-surface w-[92%] max-w-lg max-h-[90vh] rounded-2xl shadow-2xl z-[321] p-0 flex flex-col overflow-hidden outline-none animate-in fade-in zoom-in-95 duration-200 border border-slate-200/80">
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Pencil size={18} />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900 leading-tight">
                  {t('profile:edit_modal.title')}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 mt-0.5">
                  {t('profile:edit_modal.subtitle')}
                </Dialog.Description>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center cursor-pointer shrink-0"
              aria-label={t('common:actions.close', 'Cerrar')}
            >
              <X size={16} />
            </button>
          </div>

          {/* Form body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Profile photo picker section */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50/90 border border-slate-200/80 rounded-2xl">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full bg-white ring-4 ring-indigo-500/20 shadow-xs flex items-center justify-center font-bold text-2xl text-primary overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt={user.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <label
                  htmlFor="edit-modal-photo-input"
                  className="absolute bottom-0 right-0 p-1.5 bg-primary hover:bg-primary-hover text-white rounded-full shadow-md cursor-pointer transition-transform hover:scale-110 active:scale-95"
                  title={t('profile:edit_modal.change_photo')}
                >
                  <Camera size={14} />
                </label>
                <input
                  id="edit-modal-photo-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <p className="text-xs font-semibold text-slate-800">
                  {t('profile:edit_modal.photo_title')}
                </p>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {t('profile:edit_modal.photo_hint')}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1.5">
                  <label
                    htmlFor="edit-modal-photo-input"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer transition-colors"
                  >
                    <Camera size={13} className="text-primary" />
                    <span>{t('profile:edit_modal.change_photo')}</span>
                  </label>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 border border-rose-200/80 text-rose-600 hover:bg-rose-100/70 shadow-2xs cursor-pointer transition-colors"
                    >
                      <Trash2 size={13} />
                      <span>{t('profile:edit_modal.remove_photo')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Non-editable document callout */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-3 text-amber-900">
              <Lock size={18} className="shrink-0 text-amber-600 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-semibold text-amber-950">
                  {docTypeName}: <span className="font-mono">{user.nationalId || t('profile:not_available')}</span>
                </p>
                <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                  {t('profile:edit_modal.doc_notice')}
                </p>
              </div>
            </div>

            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label={t('profile:edit_modal.first_name')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t('profile:edit_modal.first_name_placeholder')}
                className="placeholder:text-gray-400"
                required
              />
              <Input
                label={t('profile:edit_modal.last_name')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t('profile:edit_modal.last_name_placeholder')}
                className="placeholder:text-gray-400"
                required
              />
            </div>

            {/* Email */}
            <Input
              type="email"
              label={t('profile:edit_modal.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('profile:edit_modal.email_placeholder')}
              className="placeholder:text-gray-400"
            />

            {/* Phone */}
            <PhoneInput
              label={t('profile:edit_modal.phone')}
              dialCode={dialCodePhone}
              phone={phone}
              onDialCodeChange={setDialCodePhone}
              onPhoneChange={setPhone}
            />

            {/* Birthday and Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                type="date"
                label={t('profile:edit_modal.birthday')}
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="placeholder:text-gray-400"
              />

              <Select
                label={t('profile:edit_modal.gender')}
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">{t('profile:edit_modal.gender_placeholder')}</option>
                {userGenderSelect.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Health Security Entity (EPS) */}
            <SelectSearch
              label={t('profile:edit_modal.eps')}
              options={healthSecurityEntitySelect}
              value={healthSecurityEntity}
              onChange={setHealthSecurityEntity}
              placeholder={t('profile:edit_modal.eps_placeholder')}
              searchable
            />

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="default"
                size="md"
                onClick={() => onOpenChange(false)}
                disabled={isLoading || isUploadingPhoto}
              >
                {t('common:actions.cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isLoading || isUploadingPhoto}
                loadingText={t('common:states.saving')}
              >
                {t('common:actions.save_changes')}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default EditProfileModal;
