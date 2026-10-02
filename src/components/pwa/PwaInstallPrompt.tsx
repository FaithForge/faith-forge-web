import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Download, Share, PlusSquare, Smartphone, X } from 'lucide-react';
import Button from '@/components/ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Interactive PWA installation component.
 * Detects whether the device is running in standalone mode, Android/Chromium, or iOS Safari,
 * providing the native installation prompt or guided home-screen instructions.
 *
 * @returns {JSX.Element} PWA installation prompt card and modal.
 */
export const PwaInstallPrompt: React.FC = () => {
  const { t } = useTranslation(['auth', 'common']);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed PWA)
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(checkStandalone);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIos(isIosDevice);

    // Capture beforeinstallprompt for Android and desktop Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosModal(true);
      return;
    }

    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsStandalone(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error('PWA install error:', err);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Fallback for browsers where beforeinstallprompt already fired or is not supported
      setShowIosModal(true);
    }
  };

  if (isStandalone) {
    return (
      <div className="w-full bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center gap-3 text-emerald-800">
        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <CheckCircle2 size={20} className="text-emerald-600" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
            {t('auth:pwa.already_installed')}
          </p>
          <p className="text-xs text-emerald-600 mt-0.5">
            {t('auth:pwa.card_desc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full bg-linear-to-br from-blue-50 to-indigo-50/70 border border-blue-200/70 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
            <Smartphone size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800">
              {t('auth:pwa.card_title')}
            </h4>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
              {t('auth:pwa.card_desc')}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto shrink-0">
          <Button
            type="button"
            variant="primary"
            onClick={handleInstallClick}
            loading={isInstalling}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2"
          >
            <Download size={16} />
            {isIos ? t('auth:pwa.install_button_ios') : t('auth:pwa.install_button_android')}
          </Button>
        </div>
      </div>

      {/* iOS & Manual Installation Guided Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Smartphone size={18} className="text-primary" />
                {t('auth:pwa.ios_modal_title')}
              </h3>
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3.5 py-1 text-left">
              {/* Step 1 */}
              <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Share size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    {t('auth:pwa.ios_modal_step1_title')}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                    {t('auth:pwa.ios_modal_step1_desc')}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <PlusSquare size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    {t('auth:pwa.ios_modal_step2_title')}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                    {t('auth:pwa.ios_modal_step2_desc')}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-800">
                    {t('auth:pwa.ios_modal_step3_title')}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                    {t('auth:pwa.ios_modal_step3_desc')}
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={() => setShowIosModal(false)}
              block
              className="py-3 rounded-xl font-bold text-sm mt-1"
            >
              {t('auth:pwa.ios_modal_close')}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
