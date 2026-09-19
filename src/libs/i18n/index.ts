import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from '@/locales/es/common.json';
import kidRegistration from '@/locales/es/kidRegistration.json';
import kidChurch from '@/locales/es/kidChurch.json';
import auth from '@/locales/es/auth.json';
import admin from '@/locales/es/admin.json';
import kidGuardian from '@/locales/es/kidGuardian.json';
import hub from '@/locales/es/hub.json';
import legal from '@/locales/es/legal.json';

export const defaultNS = 'common';
export const resources = {
  es: {
    common,
    kidRegistration,
    kidChurch,
    auth,
    admin,
    kidGuardian,
    hub,
    legal,
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
