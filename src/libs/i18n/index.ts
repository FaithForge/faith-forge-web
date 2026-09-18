import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from '@/locales/es/common.json';
import kidRegistration from '@/locales/es/kidRegistration.json';
import kidChurch from '@/locales/es/kidChurch.json';
import auth from '@/locales/es/auth.json';
import admin from '@/locales/es/admin.json';

export const defaultNS = 'common';
export const resources = {
  es: {
    common,
    kidRegistration,
    kidChurch,
    auth,
    admin,
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
