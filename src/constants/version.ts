import changelogData from '@/data/changelog.json';

export type SemVerType = 'major' | 'minor' | 'patch';

export interface ChangelogItem {
  version: string;
  type: SemVerType;
  timestamp: string;
  dateFormatted: string;
  title: string;
  description?: string;
  changes: string[];
}

export const APP_CHANGELOG: ChangelogItem[] = changelogData as ChangelogItem[];

export const APP_VERSION: string = APP_CHANGELOG[0]?.version || '3.0.0';

export const APP_BUILD_DATE: string = APP_CHANGELOG[0]?.dateFormatted || '07/09/2026 12:00 AM';

export interface SemVerMeta {
  label: string;
  badgeClass: string;
  dotClass: string;
  description: string;
}

export const SEMVER_META: Record<SemVerType, SemVerMeta> = {
  major: {
    label: 'Mayor',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
    description: 'Cambios mayores, rediseño o reestructuración.',
  },
  minor: {
    label: 'Nueva Función',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    dotClass: 'bg-sky-500',
    description: 'Nuevas herramientas, pantallas o mejoras compatibles.',
  },
  patch: {
    label: 'Parche / Mejora',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
    description: 'Correcciones de errores, fallos de pantalla o ajustes de estabilidad.',
  },
};
