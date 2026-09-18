import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, LogOut, RefreshCw, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { logout } from '@/libs/state/redux/slices/user/auth.slice';
import { FetchMyVolunteerPermissions } from '@/libs/state/redux/thunks/user/auth.thunk';
import { APP_ROUTES } from '@/config/routes';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { capitalizeWords } from '@/libs/utils/text';

/**
 * Blocking view displayed when an authenticated user only possesses the base USER role
 * and has not been granted any operational or administrative roles in the system.
 *
 * Prevents unauthorized access to application features, renders independently with nothing
 * exposed behind it, and prompts the user to log out or request role assignment from their coordinator.
 *
 * @returns {JSX.Element} Full-screen restricted access screen.
 */
const NoRolesAssignedView: React.FC = () => {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.authSlice.user);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const churchName = useAppSelector((state) => state.churchCampusSlice.church?.name);

  const userName = user
    ? capitalizeWords(`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()) || user.username
    : 'Usuario';

  /**
   * Logs out the user from the application and redirects to the login screen.
   */
  const handleLogout = () => {
    dispatch(logout());
    navigate(APP_ROUTES.auth.login, { replace: true });
    toast.success(t('no_roles.session_closed'));
  };

  /**
   * Re-evaluates assigned permissions from the server in case an admin recently assigned roles.
   */
  const handleCheckPermissions = async () => {
    setIsChecking(true);
    try {
      const resultAction = await dispatch(FetchMyVolunteerPermissions());
      if (FetchMyVolunteerPermissions.fulfilled.match(resultAction)) {
        const permissions = resultAction.payload;
        if (Array.isArray(permissions) && permissions.length > 0) {
          toast.success(t('no_roles.roles_updated'));
          return;
        }
      }
      toast.info(t('no_roles.no_roles_yet'));
    } catch {
      toast.error(t('no_roles.check_error'));
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none relative z-[999]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Visual Icon */}
        <div className="w-20 h-20 rounded-2xl bg-amber-50 border-2 border-amber-200/70 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
          <ShieldAlert size={42} className="stroke-[1.75]" />
        </div>

        {/* Brand identifier */}
        {churchName && (
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2">
            {churchName}
          </span>
        )}

        {/* Title */}
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          {t('no_roles.title')}
        </h2>

        {/* Current user badge */}
        <div className="mb-5 px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-1.5 font-medium max-w-full">
          <User size={14} className="text-slate-400 shrink-0" />
          <span className="truncate">
            {t('no_roles.connected_as')} <strong className="text-slate-800">{userName}</strong>
          </span>
        </div>

        {/* Main Alert Message */}
        <Alert
          type="warning"
          title={t('no_roles.restricted_title')}
          message={t('no_roles.restricted_message')}
          className="w-full text-left mb-5"
        />

        {/* Actions */}
        <div className="w-full flex flex-col gap-2.5">
          <Button
            variant="danger"
            block
            size="md"
            onClick={handleLogout}
            className="font-bold flex items-center justify-center gap-2 shadow-sm py-3"
          >
            <LogOut size={18} />
            <span>{t('no_roles.logout_button')}</span>
          </Button>

          <Button
            variant="default"
            block
            size="md"
            loading={isChecking}
            loadingText={t('common:states.loading')}
            onClick={handleCheckPermissions}
            className="font-medium text-slate-700 flex items-center justify-center gap-2 py-3"
          >
            <RefreshCw size={16} />
            <span>{t('no_roles.recheck_button')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoRolesAssignedView;
