import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, CheckCircle2, ExternalLink, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { logout } from '@/libs/state/redux/slices/user/auth.slice';
import {
  useGetPendingTermsQuery,
  useAcceptTermsMutation,
} from '@/libs/state/redux/api/userApi';
import { APP_ROUTES } from '@/config/routes';
import { LegalDocumentsDrawer } from './LegalDocumentsDrawer';

const TermsAcceptanceModal: React.FC = () => {
  const { t } = useTranslation(['legal', 'common']);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const token = useAppSelector((state) => state.authSlice.token);

  // Do not show TermsAcceptanceModal while user is resolving login / biometric prompt on login page
  const isOnAuthPage = location.pathname === APP_ROUTES.auth.login;

  // Skip query if user is not authenticated or still on the login screen
  const { data, isLoading } = useGetPendingTermsQuery(undefined, {
    skip: !token || isOnAuthPage,
  });

  const [acceptTermsMutation] = useAcceptTermsMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [docDrawerOpen, setDocDrawerOpen] = useState(false);
  const [docDrawerTab, setDocDrawerTab] = useState<'terms' | 'privacy'>('terms');

  const hasPending = Boolean(token && !isOnAuthPage && !isLoading && data?.hasPending);
  const pendingItems = data?.pendingTerms?.filter((term) => term.mandatory && !term.accepted) || [];

  const handleAcceptAll = async () => {
    if (pendingItems.length === 0) return;
    setIsSubmitting(true);

    try {
      for (const item of pendingItems) {
        await acceptTermsMutation({
          termsType: item.termsType,
          version: item.requiredVersion,
          channel: 'APP_DIGITAL',
        }).unwrap();
      }

      toast.success(t('modal.success_title', { ns: 'legal' }), {
        description: t('modal.success_description', { ns: 'legal' }),
      });
    } catch (error) {
      toast.error('Error al guardar la aceptación de términos. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!hasPending) {
    return null;
  }

  return (
    <>
      <Dialog.Root open={hasPending}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] animate-in fade-in duration-200" />
          <Dialog.Content
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 w-[92vw] max-w-md z-[1000] animate-in zoom-in-95 fade-in duration-200 outline-none border border-slate-200 dark:border-slate-800"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <Dialog.Title className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-1.5">
                {t('modal.title', { ns: 'legal' })}
              </Dialog.Title>

              <Dialog.Description className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                {t('modal.subtitle', { ns: 'legal' })}
              </Dialog.Description>

              {/* Bullets Summary */}
              <div className="w-full text-left bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 mb-6 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                    {t('modal.summary_bullets.bullet_1', { ns: 'legal' })}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                    {t('modal.summary_bullets.bullet_2', { ns: 'legal' })}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                    {t('modal.summary_bullets.bullet_3', { ns: 'legal' })}
                  </p>
                </div>
              </div>

              {/* Read full documents links */}
              <div className="flex items-center justify-center gap-4 text-xs font-semibold text-primary mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setDocDrawerTab('terms');
                    setDocDrawerOpen(true);
                  }}
                  className="flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>{t('terms.title', { ns: 'legal' })}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setDocDrawerTab('privacy');
                    setDocDrawerOpen(true);
                  }}
                  className="flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>{t('privacy.title', { ns: 'legal' })}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-col w-full gap-2.5">
                <Button
                  variant="primary"
                  onClick={handleAcceptAll}
                  disabled={isSubmitting}
                  className="w-full py-3 text-sm font-bold shadow-md shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('modal.accepting', { ns: 'legal' })}</span>
                    </>
                  ) : (
                    <span>{t('modal.action_accept', { ns: 'legal' })}</span>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isSubmitting}
                  className="w-full text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('modal.action_logging_out', { ns: 'legal' })}</span>
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <LegalDocumentsDrawer
        open={docDrawerOpen}
        onOpenChange={setDocDrawerOpen}
        initialTab={docDrawerTab}
      />
    </>
  );
};

export default TermsAcceptanceModal;
