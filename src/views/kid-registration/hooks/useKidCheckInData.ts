import { useMemo } from 'react';
import dayjs from 'dayjs';
import { capitalizeWords } from '@/libs/utils/text';
import { formatPhoneDisplay, isPhoneValid } from '@/libs/utils/phone';
import { isDateToday, toDateOnlyInputValue } from '@/libs/utils/date';
import { KID_RELATION_CODE_MAPPER } from '@/libs/models/KidChurch';
import { isKidOverage } from '@/libs/common-types/constants';

export interface FormattedRelation {
  id: string;
  guardianId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  gender: string;
  relation: string;
  dialCodePhone: string;
  rawPhone: string;
  displayPhone: string;
  isPhoneErroneous: boolean;
  rawRelation: string;
  raw: any;
}

interface UseKidCheckInDataProps {
  kid: any;
  guardianTerm: string;
  selectedGuardian: string;
}

/**
 * Hook to extract and compute all derived display information for a child and guardians in Check-In.
 *
 * @param {UseKidCheckInDataProps} props - Child data and current selection context.
 * @returns {object} Formatted relationships, age, birthday, overage, and EPS status.
 */
export const useKidCheckInData = ({
  kid,
  guardianTerm,
  selectedGuardian,
}: UseKidCheckInDataProps) => {
  const getTranslatedRelation = (code: string) => {
    if (!code) return guardianTerm;
    return (KID_RELATION_CODE_MAPPER as Record<string, string>)[code] || code;
  };

  const relationsList: FormattedRelation[] = useMemo(() => {
    return (
      kid?.relations?.map((rel: any) => {
        const g = rel?.guardian || rel;
        const rawRelation = rel?.relationCode || rel?.relation || g?.relation || '';
        const firstName = g?.firstName || rel?.firstName || '';
        const lastName = g?.lastName || rel?.lastName || '';
        const dialCodePhone = g?.dialCodePhone || rel?.dialCodePhone || '+57';
        const rawPhone = g?.phone || rel?.phone || '';

        const fullName = capitalizeWords(`${firstName} ${lastName}`.trim());
        const relationLabel = getTranslatedRelation(rawRelation);
        const displayPhone = formatPhoneDisplay(rawPhone, dialCodePhone);
        const isPhoneErroneous = rawPhone ? !isPhoneValid(rawPhone, dialCodePhone) : false;
        const rawGender = g?.gender || rel?.gender || '';

        return {
          id: g?.id || rel?.id,
          guardianId: g?.id || rel?.guardianId || rel?.id,
          fullName,
          firstName,
          lastName,
          gender: rawGender,
          relation: relationLabel,
          dialCodePhone,
          rawPhone,
          displayPhone,
          isPhoneErroneous,
          rawRelation,
          raw: rel,
        };
      }) || []
    );
  }, [kid?.relations, guardianTerm]);

  const registrationGuardian = useMemo(() => {
    const guardianId = kid?.currentKidRegistration?.guardianId;
    if (!guardianId || !kid?.relations) return null;
    const found: any = (kid.relations as any[]).find(
      (rel: any) => (rel?.guardian?.id || rel?.id) === guardianId,
    );
    if (!found) return null;
    const g = found.guardian || found;
    const firstName = g.firstName || found.firstName || '';
    const lastName = g.lastName || found.lastName || '';
    const rawRelation = found.relationCode || found.relation || g.relation || '';
    const relation = getTranslatedRelation(rawRelation);
    const dialCode = g.dialCodePhone || found.dialCodePhone || '+57';
    const phone = g.phone || found.phone || '';

    return {
      fullName: capitalizeWords(`${firstName} ${lastName}`.trim()),
      relation,
      phone: `${dialCode} ${phone}`.trim(),
    };
  }, [kid, guardianTerm]);

  const isBirthdayToday = useMemo(() => {
    return isDateToday(kid?.birthday);
  }, [kid?.birthday]);

  const isEpsUnknown = useMemo(() => {
    if (!kid?.healthSecurityEntity) return false;
    const eps = kid.healthSecurityEntity.trim().toUpperCase();
    return eps === 'NO SABE' || eps === 'NO_SABE' || eps === 'NOSABE' || eps === 'SIN EPS';
  }, [kid?.healthSecurityEntity]);

  const formattedAge = useMemo(() => {
    if (kid?.birthday) {
      const birth = dayjs(toDateOnlyInputValue(kid.birthday));
      if (birth.isValid()) {
        const now = dayjs();
        const years = now.diff(birth, 'year');
        const months = now.diff(birth, 'month') % 12;
        return `${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'}`;
      }
    }
    if (kid?.age !== undefined) {
      const years = Math.floor(kid.age);
      const months = kid.ageInMonths !== undefined ? Math.max(0, kid.ageInMonths - years * 12) : 0;
      return `${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    return '';
  }, [kid?.birthday, kid?.age, kid?.ageInMonths]);

  const isOverage = useMemo(() => {
    return isKidOverage(kid);
  }, [kid]);

  const selectedGuardianObj = useMemo(() => {
    return relationsList.find(
      (g) => g.id === selectedGuardian || g.guardianId === selectedGuardian,
    );
  }, [relationsList, selectedGuardian]);

  const isSelectedGuardianPhoneInvalid = !!selectedGuardianObj?.isPhoneErroneous;

  return {
    relationsList,
    registrationGuardian,
    isBirthdayToday,
    isEpsUnknown,
    formattedAge,
    isOverage,
    selectedGuardianObj,
    isSelectedGuardianPhoneInvalid,
  };
};
