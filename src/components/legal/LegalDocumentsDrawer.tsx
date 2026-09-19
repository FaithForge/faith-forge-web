import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Lock, FileText, Check, FileCheck } from 'lucide-react';
import clsx from 'clsx';
import { AppDrawer } from '@/components/ui/AppDrawer';
import Button from '@/components/ui/Button';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';

export interface LegalDocumentsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: 'terms' | 'privacy';
}

/**
 * Bottom drawer modal displaying Terms of Service and Privacy Policy.
 * Provides comfortable reading typography, clear tab switching, and avoids colliding with the close button.
 */
export const LegalDocumentsDrawer: React.FC<LegalDocumentsDrawerProps> = ({
  open,
  onOpenChange,
  initialTab = 'terms',
}) => {
  useModalBackClose(open, () => onOpenChange(false));
  const { t } = useTranslation(['legal', 'common']);
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  // Sync activeTab when initialTab changes on drawer opening
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  const termsSections = [
    {
      title: t('terms.sections.nature.title', { ns: 'legal' }),
      content: t('terms.sections.nature.content', { ns: 'legal' }),
    },
    {
      title: t('terms.sections.third_party_data.title', { ns: 'legal' }),
      content: t('terms.sections.third_party_data.content', { ns: 'legal' }),
    },
    {
      title: t('terms.sections.custody.title', { ns: 'legal' }),
      content: t('terms.sections.custody.content', { ns: 'legal' }),
    },
    {
      title: t('terms.sections.indemnity.title', { ns: 'legal' }),
      content: t('terms.sections.indemnity.content', { ns: 'legal' }),
    },
    {
      title: t('terms.sections.availability.title', { ns: 'legal' }),
      content: t('terms.sections.availability.content', { ns: 'legal' }),
    },
    {
      title: t('terms.sections.confidentiality.title', { ns: 'legal' }),
      content: t('terms.sections.confidentiality.content', { ns: 'legal' }),
    },
  ];

  const privacySections = [
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
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      maxHeight="max-h-[92dvh]"
      title="Información Legal"
      icon={<FileCheck className="w-5 h-5 text-primary" />}
      headerClassName="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800"
      bodyClassName="px-4 sm:px-6 pt-3 pb-8 overflow-y-auto"
      overlayZIndex="z-[1100]"
      contentZIndex="z-[1101]"
    >
      <div className="flex flex-col gap-5 max-w-xl mx-auto w-full">
        {/* Tab switch buttons */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={clsx(
              'flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none',
              activeTab === 'terms'
                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            )}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">Términos de Uso</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={clsx(
              'flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none',
              activeTab === 'privacy'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            )}
          >
            <Lock className="w-4 h-4 shrink-0" />
            <span className="truncate">Privacidad</span>
          </button>
        </div>

        {/* Tab Content: Terms of Service */}
        {activeTab === 'terms' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            {/* Document Header inside body */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  {t('terms.title', { ns: 'legal' })}
                </h2>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('terms.last_updated', { ns: 'legal' })}
                </p>
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary px-2.5 py-1 rounded-full shrink-0">
                v1.0.0
              </span>
            </div>

            {/* Preamble callout */}
            <div className="p-4 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/15 text-xs sm:text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1.5 font-bold text-primary mb-1.5">
                <FileText className="w-4 h-4 shrink-0" />
                <span>Declaración General</span>
              </div>
              <p>{t('terms.preamble', { ns: 'legal' })}</p>
            </div>

            {/* Structured clauses */}
            <div className="space-y-3">
              {termsSections.map((sec, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-xs"
                >
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">
                    {sec.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {sec.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Privacy Policy */}
        {activeTab === 'privacy' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            {/* Document Header inside body */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  {t('privacy.title', { ns: 'legal' })}
                </h2>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('privacy.last_updated', { ns: 'legal' })}
                </p>
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full shrink-0">
                v1.0.0
              </span>
            </div>

            {/* Intro callout */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-xs sm:text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 mb-1.5">
                <FileText className="w-4 h-4 shrink-0" />
                <span>Compromiso de Privacidad y Habeas Data</span>
              </div>
              <p>{t('privacy.intro', { ns: 'legal' })}</p>
            </div>

            {/* Structured clauses */}
            <div className="space-y-3">
              {privacySections.map((sec, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-xs"
                >
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">
                    {sec.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {sec.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Close Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            onClick={() => onOpenChange(false)}
            className="w-full py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20"
          >
            <Check className="w-4 h-4" />
            <span>Entendido</span>
          </Button>
        </div>
      </div>
    </AppDrawer>
  );
};

export default LegalDocumentsDrawer;
