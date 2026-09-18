import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from '@/locales/es/common.json';
import kidRegistration from '@/locales/es/kidRegistration.json';

export const defaultNS = 'common';
export const resources = {
  es: {
    common,
    kidRegistration,
  },
} as const;

i18n
  .use(initReactI18next)
  .init({
    lng: 'es',
    fallbackLng: 'es',
    defaultNS,
    resources,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
