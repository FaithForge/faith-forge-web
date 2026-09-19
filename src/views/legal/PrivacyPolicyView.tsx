import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Lock, FileText, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/Button';
import { APP_ROUTES } from '@/config/routes';

const PrivacyPolicyView: React.FC = () => {
  const { t } = useTranslation(['legal', 'common']);
  const navigate = useNavigate();

  const sections = [
    {
      title: t('privacy.sections.purpose.title', { ns: 'legal' }),
      content: t('privacy.sections.purpose.content', { ns: 'legal' }),
    },
    {
      title: t('privacy.sections.sensitive_data.title', { ns: 'legal' }),
      content: t('privacy.sections.sensitive_data.content', { ns: 'legal' }),
    },
    {
      title: t('privacy.sections.rights.title', { ns: 'legal' }),
      content: t('privacy.sections.rights.content', { ns: 'legal' }),
    },
    {
      title: t('privacy.sections.security.title', { ns: 'legal' }),
      content: t('privacy.sections.security.content', { ns: 'legal' }),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Top sticky header */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(APP_ROUTES.auth.login)}
            className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back_to_login', { ns: 'legal' })}</span>
          </Button>

          <Link
            to={APP_ROUTES.legal.terms}
            replace
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>{t('terms.title', { ns: 'legal' })}</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:px-6 sm:py-12">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-10">
          {/* Header Banner */}
          <div className="flex items-start gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {t('privacy.title', { ns: 'legal' })}
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                {t('privacy.last_updated', { ns: 'legal' })} • Versión 1.0.0
              </p>
            </div>
          </div>

          {/* Intro */}
          <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white mb-1.5">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Compromiso de Privacidad y Habeas Data</span>
            </div>
            <p>{t('privacy.intro', { ns: 'legal' })}</p>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {sections.map((sec, idx) => (
              <section
                key={idx}
                className="p-4 sm:p-5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/20"
              >
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                  {sec.title}
                </h2>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {sec.content}
                </p>
              </section>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>© {new Date().getFullYear()} • Tratamiento seguro y confidencial de datos.</p>
      </footer>
    </div>
  );
};

export default PrivacyPolicyView;
