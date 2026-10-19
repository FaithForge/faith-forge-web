import React from 'react';
import { Eye, Cake } from 'lucide-react';
import { FaChild, FaChildDress } from 'react-icons/fa6';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import TagKidGroup from '@/components/ui/TagKidGroup';
import { capitalizeWords } from '@/libs/utils/text';
import { KID_AGE_COPY } from '@/libs/common-types/constants';

interface KidProfileCardProps {
  kid: any;
  formattedAge: string;
  isBirthdayToday: boolean;
  isOverage: boolean;
  isRegistered: boolean;
  displayedGroupName: string;
  isStaticGroup?: boolean;
  imageError: boolean;
  setImageError: (err: boolean) => void;
  onOpenPhotoModal: () => void;
}

/**
 * Top profile header card for a child in KidCheckInView.
 * Displays photo/avatar, full name, code, group badge, overage/birthday badges, and volunteer toggle.
 *
 * @param {KidProfileCardProps} props - Component props.
 * @returns {JSX.Element}
 */
export const KidProfileCard: React.FC<KidProfileCardProps> = ({
  kid,
  formattedAge,
  isBirthdayToday,
  isOverage,
  isRegistered,
  displayedGroupName,
  isStaticGroup,
  imageError,
  setImageError,
  onOpenPhotoModal,
}) => {
  const { t } = useTranslation(['kidRegistration', 'common']);

  return (
    <>
      {/* Banner de cumpleaños */}
      {isBirthdayToday && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white p-3.5 rounded-2xl mb-4 flex items-center justify-center gap-2.5 text-sm font-black shadow-md animate-pulse tracking-wide">
          <Cake size={22} className="text-yellow-200 animate-bounce" />
          <span>{t('kidRegistration:check_in.birthday_banner')}</span>
        </div>
      )}

      {/* Cabecera Principal del Niño */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
        <div className="flex gap-4 items-center">
          <div className="relative shrink-0 group">
            <div
              onClick={() => {
                if (kid?.photoUrl && !imageError) onOpenPhotoModal();
              }}
              className={clsx(
                'w-20 h-20 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative',
                kid?.photoUrl && !imageError
                  ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95'
                  : '',
                (!kid?.photoUrl || imageError) &&
                  (kid?.gender === 'F' || (kid?.gender as string)?.toUpperCase() === 'FEMALE'
                    ? 'bg-pink-100 text-pink-500'
                    : 'bg-blue-100 text-blue-500'),
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
                onClick={onOpenPhotoModal}
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
              {t('kidRegistration:check_in.code_label')}: {kid?.faithForgeId || kid?.id}
              {formattedAge ? ` • ${t('kidRegistration:check_in.age_label')}: ${formattedAge}` : ''}
            </h4>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <TagKidGroup kidGroup={displayedGroupName} staticGroup={isStaticGroup} />
              {isOverage && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-red-100 text-red-800 rounded-full border border-red-200">
                  {KID_AGE_COPY.maxAgeBadge}
                </span>
              )}
              {isBirthdayToday && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300 flex items-center gap-1 animate-pulse">
                  {t('kidRegistration:dashboard.badge_birthday')}
                </span>
              )}
              {isRegistered && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                  {t('kidRegistration:dashboard.badge_registered')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
