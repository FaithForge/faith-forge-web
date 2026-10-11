import React from 'react';
import { Phone } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import clsx from 'clsx';
import { IVolunteerAssignment, VolunteerRole } from '@/libs/models/Volunteer';
import { MinistryType, MinistryAreaScope } from '@/libs/models';
import { capitalizeWords } from '@/libs/utils/text';
import { getVolunteerRoleLabel } from '@/libs/hooks/useTerm';
import { useRoleTheme } from '@/libs/hooks/useRoleTheme';

interface VolunteerAssignmentCardProps {
  assignment: IVolunteerAssignment;
  isCurrentUser: boolean;
}

/**
 * Individual volunteer assignment row card.
 * Displays photo/initials, full name, role badge, assigned area/SAG,
 * phone call action, and WhatsApp direct contact.
 */
export const VolunteerAssignmentCard: React.FC<VolunteerAssignmentCardProps> = ({
  assignment,
  isCurrentUser,
}) => {
  const user = assignment.user || assignment.volunteer?.user;
  const firstName = user?.firstName || 'Servidor';
  const lastName = user?.lastName || '';
  const fullName = capitalizeWords(`${firstName} ${lastName}`.trim());
  const isCoordinatorRole = assignment.role === VolunteerRole.GROUP_COORDINATOR;
  const isSupervisorRole = assignment.role === VolunteerRole.SUPERVISOR;
  const asgArea = assignment.ministryArea || assignment.serviceAreaGroup?.ministryArea;
  const isKids =
    assignment.ministry?.type === MinistryType.KIDS ||
    (!assignment.ministry && asgArea?.scope === MinistryAreaScope.KID_GROUP_MANAGEMENT);
  const roleName = getVolunteerRoleLabel(assignment.role, {
    ministryType: isKids ? MinistryType.KIDS : MinistryType.GENERAL,
    ministryOverrides: assignment.ministry?.terminologyOverrides,
  });

  const phone = user?.phone;
  const dialCode = user?.dialCodePhone || '+57';
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const fullPhone = cleanPhone ? `${dialCode}${cleanPhone}`.replace('+', '') : '';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'SV';
  const roleTheme = useRoleTheme(assignment);

  return (
    <div
      className={clsx(
        'p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors',
        roleTheme.highlightBg,
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Avatar */}
        <div className="relative shrink-0">
          {user?.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={fullName}
              className={clsx('w-11 h-11 rounded-2xl object-cover', roleTheme.photoRing)}
            />
          ) : (
            <div
              className={clsx(
                'w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm tracking-tight',
                roleTheme.avatar,
              )}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-gray-900 leading-tight truncate">
              {fullName}
            </h4>
            {isCurrentUser && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-slate-900 text-white shrink-0">
                TÚ
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span
              className={clsx(
                'px-2 py-0.5 rounded-full text-[10px] tracking-wide inline-flex items-center gap-1 shrink-0',
                roleTheme.badge,
              )}
            >
              {roleName}
            </span>

            {/* Area or SAG label */}
            {asgArea?.name && (
              <span
                className={clsx(
                  'px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0',
                  roleTheme.tagBg,
                )}
              >
                {asgArea.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Contact Actions: WhatsApp & Call */}
      <div className="flex items-center gap-1.5 shrink-0">
        {fullPhone && (
          <a
            href={`https://wa.me/${fullPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Escribir por WhatsApp"
            className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors active:scale-95"
          >
            <FaWhatsapp size={17} />
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone}`}
            title="Llamar"
            className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center transition-colors active:scale-95"
          >
            <Phone size={16} />
          </a>
        )}
      </div>
    </div>
  );
};
