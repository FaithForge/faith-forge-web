import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ArrowRight, LogIn } from 'lucide-react';
import Button from '@/components/ui/Button';
import { PwaInstallPrompt } from '@/components/pwa/PwaInstallPrompt';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { APP_ROUTES } from '@/config/routes';

/**
 * Public confirmation view displayed immediately after successful account activation.
 * Prompts the user to install the application as a PWA on their mobile device (Android / iOS)
 * and grants a direct button to proceed into the application.
 *
 * @returns {JSX.Element} Confirmation and PWA installation view.
 */
const AccountSignupConfirmationView: React.FC = () => {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const token = useAppSelector((state) => state.authSlice.token);
  const user = useAppSelector((state) => state.authSlice.user);

  const handleContinue = () => {
    if (token) {
      navigate('/', { replace: true });
    } else {
      navigate(APP_ROUTES.auth.login, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-8 animate-in fade-in duration-300">
      <div className="w-full max-w-md flex flex-col items-center gap-5 text-center">
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-1">
          <img src="/logo-iglekids.png" alt="Logo" className="w-48 h-auto drop-shadow-xs" />
        </div>

        <div className="w-full bg-white p-6 sm:p-7 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center gap-5">
          {/* Animated Success Badge */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-emerald-100/80 text-emerald-600 flex items-center justify-center border-4 border-emerald-50 shadow-inner">
              <CheckCircle2 size={44} className="stroke-[2.5]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
              ✓
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {t('auth:signup_confirmation.title')}
            </h2>
            <p className="text-sm font-semibold text-emerald-700 mt-1">
              {t('auth:signup_confirmation.subtitle')}
            </p>
            {user?.username && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
                <span className="font-medium text-slate-500">{t('auth:signup_confirmation.your_username')}</span>
                <span className="font-mono text-primary font-bold">@{user.username}</span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2 leading-relaxed max-w-xs mx-auto">
              {t('auth:signup_confirmation.account_ready_desc')}
            </p>
          </div>

          {/* PWA Installation Section */}
          <div className="w-full pt-1">
            <PwaInstallPrompt />
          </div>

          {/* Action button */}
          <div className="w-full pt-2 flex flex-col gap-2.5">
            <Button
              type="button"
              variant="primary"
              onClick={handleContinue}
              block
              className="py-3.5 font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2"
            >
              {token ? (
                <>
                  {t('auth:signup_confirmation.action_enter_app')}
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  {t('auth:signup_confirmation.action_login')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSignupConfirmationView;
