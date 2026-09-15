import React from 'react';
import { ChurchTermKey, KidsTermKey } from '@/libs/constants/defaultTerminology';
import { useChurchTerm, useKidsTerm, useMinistryTerm } from '@/libs/hooks/useTerm';

interface ChurchTermProps {
  k: ChurchTermKey;
}

/**
 * Renderiza declarativamente un término institucional de nivel Iglesia.
 */
export const ChurchTerm: React.FC<ChurchTermProps> = ({ k }) => {
  const term = useChurchTerm(k);
  return <>{term}</>;
};

interface KidsTermProps {
  k: KidsTermKey;
}

/**
 * Renderiza declarativamente un término operativo del Ministerio de Niños.
 */
export const KidsTerm: React.FC<KidsTermProps> = ({ k }) => {
  const term = useKidsTerm(k);
  return <>{term}</>;
};

interface MinistryTermProps {
  ministryId?: string;
  k: string;
  fallback?: string;
}

/**
 * Renderiza declarativamente un término de un ministerio específico.
 */
export const MinistryTerm: React.FC<MinistryTermProps> = ({
  ministryId,
  k,
  fallback,
}) => {
  const term = useMinistryTerm(ministryId, k, fallback);
  return <>{term}</>;
};
