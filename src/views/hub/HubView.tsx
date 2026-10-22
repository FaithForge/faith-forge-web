import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Shield, ChevronRight, LogOut, Sparkles, Building2 } from 'lucide-react';
import { FaChild } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { setActiveExperience, changeCurrentRole } from '@/libs/state/redux/slices/user/auth.slice';
import { UserLogout } from '@/libs/state/redux/thunks/user/auth.thunk';
import { UserExperienceEnum, UserRole, ChurchRole, AppRole, isOperationalStaffRole } from '@/libs/utils/auth';
import { isRoleEnabled } from '@/config/roles';
import { APP_ROUTES } from '@/config/routes';
import { userRolesNavBarConfig } from '@/components/layout/TopBar';
import { useChurchTerm, useKidsTerm } from '@/libs/hooks/useTerm';
import { useChurchModules } from '@/libs/hooks/useChurchModules';
import { ChurchModule } from '@/libs/models/Church';
import { formatPersonShortName } from '@/libs/utils/text';

/**
 * Hub screen displaying available experience spaces (Admin, Server, Kid Guardian)
 * for multi-role users, ensuring a clean and conscious workspace separation.
 *
 * @returns {JSX.Element} The rendered Hub experience selector.
 */
const HubView: React.FC = () => {
  const { t } = useTranslation(['hub', 'common', 'auth']);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.authSlice.user);
  const experiences = useAppSelector((state) => state.authSlice.experiences) || [];
  const volunteerCampuses = useAppSelector((state) => state.volunteerContextSlice.campuses || []);

  const kidsModuleName = useKidsTerm('module_alias');
  const volunteerTerm = useChurchTerm('volunteer');
  const guardianTerm = useKidsTerm('guardian');
  const { hasModule } = useChurchModules();

  const shortName = formatPersonShortName(user?.firstName, user?.lastName) || 'Usuario';

  const routeUserToExperience = (exp: UserExperienceEnum, replace = false) => {
    dispatch(setActiveExperience(exp));

    if (exp === UserExperienceEnum.ADMIN) {
      const adminRole = (user?.roles || []).find((r: any) =>
        [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF].includes(r)
      ) || UserRole.ADMIN;
      dispatch(changeCurrentRole(adminRole as any));
      const adminTheme = adminRole === UserRole.SUPER_ADMIN
        ? 'theme-SUPER_ADMIN'
        : adminRole === UserRole.STAFF
        ? 'theme-STAFF'
        : 'theme-ADMIN';
      document.body.className = `${adminTheme} antialiased bg-slate-50`;
      navigate(APP_ROUTES.admin.root, { replace });
    } else if (exp === UserExperienceEnum.MINISTRY_COORDINATOR) {
      dispatch(changeCurrentRole(ChurchRole.MINISTRY_ADMIN as any));
      document.body.className = 'theme-MINISTRY_ADMIN antialiased bg-slate-50';
      navigate(APP_ROUTES.ministryCoordinator.root, { replace });
    } else if (exp === UserExperienceEnum.KID_CHURCH_STAFF) {
      // 1. Search for an explicitly assigned and enabled operational role in account roles
      const userOperationalRole = (user?.roles || []).find((r: any) =>
        isOperationalStaffRole(r) && isRoleEnabled(r)
      );

      // 2. Or resolve from assigned volunteer campus groups/areas
      let volunteerAssignedRole: AppRole | undefined;
      for (const campus of volunteerCampuses) {
        for (const group of campus.groups || []) {
          const primaryArea = group.areas?.[0];
          const primaryRole = primaryArea?.role || group.groupRole;
          const isGroupRegistration = primaryArea?.scope === 'KID_REGISTRATION';
          let targetRole: AppRole;
          if (primaryRole === 'GROUP_COORDINATOR') {
            targetRole = ChurchRole.KID_CHURCH_GROUP_COORDINATOR;
          } else if (primaryRole === 'SUPERVISOR') {
            targetRole = isGroupRegistration
              ? ChurchRole.KID_REGISTER_SUPERVISOR
              : ChurchRole.KID_CHURCH_SUPERVISOR;
          } else {
            targetRole = isGroupRegistration
              ? ChurchRole.KID_REGISTER_USER
              : ChurchRole.KID_CHURCH_USER;
          }
          if (targetRole && isRoleEnabled(targetRole)) {
            volunteerAssignedRole = targetRole;
            break;
          }
        }
        if (volunteerAssignedRole) break;
      }

      const operationalRole =
        userOperationalRole || volunteerAssignedRole || ChurchRole.KID_REGISTER_USER;

      dispatch(changeCurrentRole(operationalRole as any));
      const themeClass =
        userRolesNavBarConfig[operationalRole]?.themeClass || 'theme-KID_REGISTER_USER';
      document.body.className = `${themeClass} antialiased bg-slate-50`;
      const targetUrl =
        userRolesNavBarConfig[operationalRole]?.dashboardUrl || APP_ROUTES.kidRegistration.root;
      const safeTargetUrl =
        targetUrl === APP_ROUTES.kidRegistration.root || targetUrl === APP_ROUTES.kidChurch.root
          ? targetUrl
          : APP_ROUTES.kidRegistration.root;
      navigate(safeTargetUrl, { replace });
    } else if (exp === UserExperienceEnum.KID_GUARDIAN) {
      navigate(APP_ROUTES.kidGuardian.root, { replace });
    }
  };

  useEffect(() => {
    delete document.body.dataset.role;
    document.body.className = 'theme-USER antialiased bg-slate-50';
  }, []);

  // Card definitions ordered: 1. Admin, 2. Ministry Coordinator, 3. Staff, 4. Kid Guardian
  const cardsConfig = [
    {
      id: UserExperienceEnum.ADMIN,
      title: t('hub:cards.admin_title', 'Administración'),
      subtitle: t(
        'hub:cards.admin_subtitle',
        'Gestión institucional, sedes, reuniones y usuarios',
      ),
      icon: Crown,
      gradient: 'from-slate-800 to-slate-900',
      badgeBg: 'bg-slate-100 text-slate-700',
      borderColor: 'border-slate-200 hover:border-slate-400',
      iconColor: 'text-amber-400',
      iconBg: 'bg-slate-800 text-white',
    },
    {
      id: UserExperienceEnum.MINISTRY_COORDINATOR,
      title: t('hub:cards.ministry_coordinator_title', 'Coordinador de Ministerio'),
      subtitle: t(
        'hub:cards.ministry_coordinator_subtitle',
        'Gestión estratégica, estructura y estadísticas de servicio y asistencia',
      ),
      icon: Building2,
      gradient: 'from-sky-600 to-cyan-700',
      badgeBg: 'bg-sky-50 text-sky-700',
      borderColor: 'border-sky-200 hover:border-sky-400',
      iconColor: 'text-sky-500',
      iconBg: 'bg-gradient-to-br from-[#73c2fb] to-[#0284c7] text-white',
    },
    {
      id: UserExperienceEnum.KID_CHURCH_STAFF,
      title: t('hub:cards.staff_title', {
        volunteer: volunteerTerm,
        module: kidsModuleName,
        defaultValue: `${volunteerTerm} ${kidsModuleName}`,
      }),
      subtitle: t(
        'hub:cards.staff_subtitle',
        'Estación de registro de niños, escaneo y atención en salones',
      ),
      icon: Shield,
      gradient: 'from-emerald-600 to-teal-700',
      badgeBg: 'bg-emerald-50 text-emerald-700',
      borderColor: 'border-emerald-200 hover:border-emerald-400',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-600 text-white',
    },
    {
      id: UserExperienceEnum.KID_GUARDIAN,
      title: t('hub:cards.guardian_title', {
        guardian: guardianTerm,
        module: kidsModuleName,
        defaultValue: `${guardianTerm} - ${kidsModuleName}`,
      }),
      subtitle: t(
        'hub:cards.guardian_subtitle',
        'Carnet digital con código QR para ingreso y consulta de mis niños',
      ),
      icon: FaChild,
      gradient: 'from-indigo-600 to-sky-600',
      badgeBg: 'bg-indigo-50 text-indigo-700',
      borderColor: 'border-indigo-200 hover:border-indigo-400',
      iconColor: 'text-indigo-400',
      iconBg: 'bg-gradient-to-br from-indigo-500 to-sky-500 text-white',
    },
  ];

  const isSuperAdmin = (user?.roles || []).includes(UserRole.SUPER_ADMIN);
  const isAdmin = isSuperAdmin || (user?.roles || []).includes(UserRole.ADMIN);

  // Filter cards so KID_CHURCH_STAFF is ONLY shown if user has at least one active, enabled operational role,
  // volunteer assignment, or administrative access.
  const hasActiveStaffRole =
    isSuperAdmin ||
    isAdmin ||
    volunteerCampuses.some((c) => (c.groups || []).length > 0) ||
    (user?.roles || []).some(
      (r: any) => isOperationalStaffRole(r) && isRoleEnabled(r)
    ) ||
    experiences.includes(UserExperienceEnum.KID_CHURCH_STAFF);

  const availableCards = cardsConfig.filter((card) => {
    if (!experiences.includes(card.id)) return false;
    if (card.id === UserExperienceEnum.KID_CHURCH_STAFF) {
      if (!hasModule(ChurchModule.KID_CHURCH)) return false;
      if (!hasActiveStaffRole) return false;
    }
    if (card.id === UserExperienceEnum.KID_GUARDIAN) {
      if (!hasModule(ChurchModule.KID_CHURCH)) return false;
    }
    return true;
  });

  // If the user only has 1 available card, automatically redirect them without showing the hub
  useEffect(() => {
    if (availableCards.length === 1) {
      routeUserToExperience(availableCards[0].id, true);
    }
  }, [availableCards.length]);

  const handleSelectExperience = (exp: UserExperienceEnum) => {
    routeUserToExperience(exp, false);
  };

  const handleLogout = async () => {
    await dispatch(UserLogout());
    navigate(APP_ROUTES.auth.login, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full mx-auto pt-6 sm:pt-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('hub:badge', 'Espacios de trabajo')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('hub:greeting', { name: shortName, defaultValue: `Hola, ${shortName} 👋` })}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
            {t('hub:prompt', '¿A qué espacio deseas ingresar hoy?')}
          </p>
        </div>

        {/* Experience Cards Grid */}
        <div className="space-y-3.5">
          {availableCards.map((card, idx) => {
            const IconComponent = card.icon;
            return (
              <motion.button
                key={card.id}
                type="button"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.08 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectExperience(card.id)}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl bg-white border-2 ${card.borderColor} shadow-sm hover:shadow-md transition-all flex items-center justify-between group focus:outline-hidden`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="pr-2">
                    <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {card.title}
                    </h2>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {card.subtitle}
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center text-slate-400 shrink-0 transition-colors">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Footer with Logout */}
      <div className="max-w-md w-full mx-auto pt-8 pb-4 text-center">
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50/60 rounded-xl transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('common:actions.logout', 'Cerrar sesión')}</span>
        </button>
      </div>
    </div>
  );
};

export default HubView;
