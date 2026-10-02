import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowLeft,
  Pencil,
  User as UserIcon,
  Lock,
  ShieldCheck,
  Building2,
  Users,
  Fingerprint,
  BellRing,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Layers,
  Camera,
  Award,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { useGetMyOverviewQuery } from '@/libs/state/redux/api/userApi';
import { useGetVolunteerByUserIdQuery } from '@/libs/state/redux/api/churchApi';
import { getVolunteerRoleLabel } from '@/libs/hooks/useTerm';
import { VolunteerRole } from '@/libs/models';
import { capitalizeWords } from '@/libs/utils/text';
import { formatPhoneDisplay } from '@/libs/utils/phone';
import { formatDateOnly } from '@/libs/utils/date';
import { ID_TYPE_CODE_MAPPER, USER_GENDER_CODE_MAPPER } from '@/libs/models/User';
import { clearAppCacheAndReload } from '@/libs/utils/appCache';
import {
  isBiometricsAvailable,
  hasRegisteredBiometrics,
  registerBiometrics,
  clearBiometricSession,
} from '@/libs/utils/biometrics';
import {
  isPushNotificationSupported,
  getExistingPushSubscription,
  getPushPermissionState,
  requestAndSyncPushSubscription,
  unregisterAndRemovePushSubscription,
} from '@/libs/utils/notifications/webPush';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ConfirmModal from '@/components/ui/ConfirmModal';
import EditProfileModal from '@/components/modal/EditProfileModal';

/**
 * iOS-style accessible toggle switch component for settings.
 *
 * @param {Object} props Component properties.
 * @param {boolean} props.checked Whether the toggle is active.
 * @param {() => void} props.onChange Callback triggered on toggle.
 * @param {boolean} [props.disabled] Whether the toggle is disabled.
 * @param {string} props.label Accessible label for screen readers.
 * @returns {JSX.Element} Rendered switch button.
 */
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}> = ({ checked, onChange, disabled, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed ${
      checked ? 'bg-emerald-500' : 'bg-slate-300'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

/**
 * Modern social-style profile screen displaying user information, ministerial roles,
 * biometrics, notifications, and cache management, with a dedicated edit profile modal.
 *
 * @returns {JSX.Element | null} Rendered ProfileView screen.
 */
const ProfileView: React.FC = () => {
  const { t } = useTranslation(['profile', 'common']);
  const navigate = useNavigate();

  const user = useAppSelector((state) => state.authSlice.user);
  const token = useAppSelector((state) => state.authSlice.token);

  const { data: overview } = useGetMyOverviewQuery();

  const [activeTab, setActiveTab] = useState<'personal' | 'ministry' | 'security'>('personal');
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Security & device management state
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isRegisteringBio, setIsRegisteringBio] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [isBioEnabled, setIsBioEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);

  useEffect(() => {
    isBiometricsAvailable().then((available) => {
      setBioAvailable(available);
      setIsBioEnabled(hasRegisteredBiometrics());
    });

    if (isPushNotificationSupported()) {
      setPushSupported(true);
      getExistingPushSubscription().then((sub) => {
        setPushEnabled(Boolean(sub) && getPushPermissionState() === 'granted');
      });
    }
  }, []);

  if (!user) return null;

  const fullName = capitalizeWords(`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim());
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'US';
  const phoneDisplay = user.phone
    ? formatPhoneDisplay(user.phone, (user as any).dialCodePhone)
    : t('profile:not_available');

  const docTypeName = user.nationalIdType
    ? ID_TYPE_CODE_MAPPER[user.nationalIdType] || user.nationalIdType
    : t('profile:personal.document');

  const genderLabel = user.gender
    ? USER_GENDER_CODE_MAPPER[user.gender as keyof typeof USER_GENDER_CODE_MAPPER] || user.gender
    : t('profile:not_available');

  const birthdayFormatted = user.birthday
    ? formatDateOnly(user.birthday)
    : t('profile:not_available');

  const calculatedAge = user.birthday
    ? dayjs().diff(dayjs.utc(String(user.birthday).slice(0, 10)), 'year')
    : null;

  const handleToggleBiometrics = async () => {
    if (isBioEnabled) {
      clearBiometricSession();
      setIsBioEnabled(false);
      toast.success(t('profile:security.biometrics_disabled'));
    } else {
      setPasswordInput('');
      setShowPasswordModal(true);
    }
  };

  const handleConfirmPasswordAndRegisterBio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) return;

    setIsRegisteringBio(true);
    try {
      const targetUsername = (user.username || user.email || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '');
      const success = await registerBiometrics({
        username: targetUsername,
        password: passwordInput,
        user,
        token,
      });

      if (success) {
        setIsBioEnabled(true);
        setShowPasswordModal(false);
        setPasswordInput('');
        toast.success(t('profile:security.biometrics_enabled'));
      } else {
        toast.error('No se pudo configurar la biometría en este dispositivo.');
      }
    } catch {
      toast.error('Ocurrió un error al configurar la biometría.');
    } finally {
      setIsRegisteringBio(false);
    }
  };

  const handleTogglePush = async () => {
    setIsPushLoading(true);
    try {
      if (pushEnabled) {
        await unregisterAndRemovePushSubscription();
        setPushEnabled(false);
        toast.info(t('profile:security.push_disabled'));
      } else {
        const success = await requestAndSyncPushSubscription();
        if (success) {
          setPushEnabled(true);
          toast.success(t('profile:security.push_enabled'));
        } else {
          if (getPushPermissionState() === 'denied') {
            toast.error(
              'Las notificaciones están bloqueadas en tu navegador. Puedes habilitarlas en los permisos del sitio.'
            );
          } else {
            toast.error('No se concedieron permisos de notificación.');
          }
        }
      }
    } catch {
      toast.error('Ocurrió un problema al actualizar las notificaciones.');
    } finally {
      setIsPushLoading(false);
    }
  };

  const volunteerCampuses = overview?.volunteerContext?.campuses || [];

  const { data: volunteerProfile } = useGetVolunteerByUserIdQuery(
    { userId: user.id },
    { skip: !user?.id },
  );

  const formattedAssignments = useMemo(() => {
    // 1. Direct assignments from volunteerProfile
    if (volunteerProfile?.assignments && volunteerProfile.assignments.length > 0) {
      return volunteerProfile.assignments.map((asg) => {
        const min =
          asg.ministry ||
          asg.ministryArea?.ministry ||
          asg.ministryGroupConfig?.ministry ||
          asg.serviceAreaGroup?.ministryArea?.ministry;

        const ministryName =
          min?.name ||
          asg.ministry?.name ||
          t('profile:ministry.general_ministry');

        const roleLabel = getVolunteerRoleLabel(asg.role as VolunteerRole, {
          ministryType: min?.type,
          ministryOverrides: min?.terminologyOverrides,
        });

        const areaName =
          asg.serviceAreaGroup?.ministryArea?.name ||
          asg.ministryArea?.name ||
          (asg.role === VolunteerRole.MINISTRY_GENERAL_COORDINATOR
            ? t('profile:ministry.all_areas')
            : undefined);

        const groupName =
          asg.serviceAreaGroup?.ministryGroupConfig?.name ||
          asg.ministryGroupConfig?.name;

        const campusName =
          asg.serviceAreaGroup?.churchCampus?.name ||
          asg.serviceAreaGroup?.ministryArea?.ministry?.churchCampus?.name ||
          asg.ministryGroupConfig?.ministry?.churchCampus?.name ||
          asg.ministryArea?.ministry?.churchCampus?.name ||
          asg.ministry?.churchCampus?.name ||
          t('profile:not_available');

        return {
          id: asg.id,
          ministryName,
          roleLabel,
          role: asg.role,
          areaName,
          groupName,
          campusName,
        };
      });
    }

    // 2. Structured fallback from overview volunteerContext
    const list: Array<{
      id: string;
      ministryName: string;
      roleLabel: string;
      role: VolunteerRole;
      areaName?: string;
      groupName?: string;
      campusName: string;
    }> = [];

    for (const camp of volunteerCampuses) {
      if (camp.ministryCoordinator) {
        list.push({
          id: `coord-${camp.id}-${camp.ministryCoordinator.ministryId}`,
          ministryName: camp.ministryCoordinator.ministryName,
          roleLabel: getVolunteerRoleLabel(camp.ministryCoordinator.role),
          role: camp.ministryCoordinator.role,
          areaName: t('profile:ministry.all_areas'),
          groupName: t('profile:ministry.all_groups'),
          campusName: camp.name,
        });
      }

      for (const coord of camp.areaCoordinates || []) {
        list.push({
          id: `area-coord-${coord.id}`,
          ministryName: coord.ministryName || t('profile:ministry.general_ministry'),
          roleLabel: getVolunteerRoleLabel(coord.role),
          role: coord.role,
          areaName: coord.name,
          campusName: camp.name,
        });
      }

      for (const group of camp.groups || []) {
        if (group.areas && group.areas.length > 0) {
          for (const area of group.areas) {
            list.push({
              id: `area-${group.id}-${area.id}`,
              ministryName: area.ministryName || t('profile:ministry.general_ministry'),
              roleLabel: getVolunteerRoleLabel(area.role),
              role: area.role,
              areaName: area.name,
              groupName: group.name,
              campusName: camp.name,
            });
          }
        } else {
          list.push({
            id: `group-${group.id}`,
            ministryName: t('profile:ministry.general_ministry'),
            roleLabel: group.groupRole ? getVolunteerRoleLabel(group.groupRole) : t('profile:ministry.role_label'),
            role: group.groupRole || VolunteerRole.VOLUNTEER,
            groupName: group.name,
            campusName: camp.name,
          });
        }
      }
    }

    return list;
  }, [volunteerProfile, volunteerCampuses, t]);

  return (
    <div className="w-full bg-slate-50 text-slate-800 pb-16">
      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-3 sm:pt-5">
        {/* Back navigation button */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer py-1.5 px-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:bg-slate-50"
          >
            <ArrowLeft size={14} />
            <span>{t('common:actions.back')}</span>
          </button>
        </div>

        {/* Profile Header Card */}
        <section className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden mb-5">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              {/* Left: Avatar + Identity adjacent */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                {/* Avatar with edit button */}
                <div className="relative shrink-0 group">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(true)}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 ring-4 ring-primary/10 shadow-xs flex items-center justify-center font-black text-xl sm:text-2xl text-primary overflow-hidden cursor-pointer relative group/avatar focus:outline-hidden focus:ring-4 focus:ring-primary/40 transition-transform active:scale-95"
                    title={t('profile:edit_modal.change_photo')}
                    aria-label={t('profile:edit_modal.change_photo')}
                  >
                    {user.photoUrl ? (
                      <img src={user.photoUrl} alt={fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{initials}</span>
                    )}
                    {/* Hover camera overlay */}
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Camera size={20} className="drop-shadow-md" />
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(true)}
                    className="absolute -bottom-0.5 -right-0.5 p-1.5 bg-primary hover:bg-primary-hover text-white rounded-full shadow-md ring-2 ring-white cursor-pointer transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                    title={t('profile:edit_modal.change_photo')}
                    aria-label={t('profile:edit_modal.change_photo')}
                  >
                    <Camera size={11} />
                  </button>
                </div>

                {/* User Identity Info */}
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
                    {fullName}
                  </h2>

                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <CheckCircle2 size={11} />
                      {t('profile:verified_member')}
                    </span>

                    {user.username && (
                      <span className="text-xs text-slate-500 font-medium">
                        @{user.username}
                      </span>
                    )}

                    {user.faithForgeId && (
                      <span className="text-xs font-mono text-slate-400">
                        #{user.faithForgeId}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action: Edit Profile */}
              <div className="shrink-0 w-full sm:w-auto mt-2.5 sm:mt-0">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setIsEditOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 shadow-2xs font-bold text-xs sm:text-sm px-4 py-2"
                >
                  <Pencil size={13} />
                  <span>{t('profile:edit_profile')}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t border-slate-100 px-2 sm:px-6 grid grid-cols-3">
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`py-3 px-1 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 text-center ${
                activeTab === 'personal'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserIcon size={15} className="shrink-0" />
              <span className="hidden sm:inline">{t('profile:tabs.personal')}</span>
              <span className="sm:hidden truncate">{t('profile:tabs.personal_short')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ministry')}
              className={`py-3 px-1 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 text-center ${
                activeTab === 'ministry'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 size={15} className="shrink-0" />
              <span className="hidden sm:inline">{t('profile:tabs.ministry')}</span>
              <span className="sm:hidden truncate">{t('profile:tabs.ministry_short')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`py-3 px-1 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 text-center ${
                activeTab === 'security'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck size={15} className="shrink-0" />
              <span className="hidden sm:inline">{t('profile:tabs.security')}</span>
              <span className="sm:hidden truncate">{t('profile:tabs.security_short')}</span>
            </button>
          </div>
        </section>

        {/* Tab 1: Personal Info */}
        {activeTab === 'personal' && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
            {/* Header with subtle gray background */}
            <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-slate-100 bg-slate-50/70">
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {t('profile:personal.title')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('profile:personal.subtitle')}
              </p>
            </div>

            <div className="p-5 sm:p-6">
              {/* Clean definition list matching UserDetailView style */}
              <div className="divide-y divide-slate-100 text-xs sm:text-sm">
              {/* Document */}
              <div className="py-3 sm:py-3.5 flex items-center justify-between gap-3">
                <span className="font-medium text-slate-500">
                  {docTypeName}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-slate-900">
                    {user.nationalId || t('profile:not_available')}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                    <Lock size={10} className="text-amber-600" />
                    {t('profile:personal.document_locked_badge')}
                  </span>
                </div>
              </div>

              {/* Email */}
              <div className="py-3 sm:py-3.5 flex items-center justify-between gap-3">
                <span className="font-medium text-slate-500">
                  {t('profile:personal.email')}
                </span>
                <span className="font-semibold text-slate-900 text-right truncate">
                  {user.email || t('profile:not_available')}
                </span>
              </div>

              {/* Phone */}
              <div className="py-3 sm:py-3.5 flex items-center justify-between gap-3">
                <span className="font-medium text-slate-500">
                  {t('profile:personal.phone')}
                </span>
                <span className="font-semibold text-slate-900 text-right">
                  {phoneDisplay}
                </span>
              </div>

              {/* Birthday */}
              <div className="py-3 sm:py-3.5 flex items-center justify-between gap-3">
                <span className="font-medium text-slate-500">
                  {t('profile:personal.birthday')}
                </span>
                <span className="font-semibold text-slate-900 text-right">
                  {birthdayFormatted} {calculatedAge !== null ? `(${calculatedAge} años)` : ''}
                </span>
              </div>

              {/* Health Security Entity (EPS) */}
              <div className="py-3 sm:py-3.5 flex items-center justify-between gap-3">
                <span className="font-medium text-slate-500">
                  {t('profile:personal.eps')}
                </span>
                <span className="font-semibold text-slate-900 text-right">
                  {user.healthSecurityEntity || t('profile:not_available')}
                </span>
              </div>

              {/* Gender */}
              <div className="py-3 sm:py-3.5 flex items-center justify-between gap-3">
                <span className="font-medium text-slate-500">
                  {t('profile:personal.gender')}
                </span>
                <span className="font-semibold text-slate-900 text-right">
                  {genderLabel}
                </span>
              </div>

              {/* Registered date */}
              {user.createdAt && (
                <div className="py-3 sm:py-3.5 flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-500">
                    {t('profile:since')}
                  </span>
                  <span className="font-semibold text-slate-900 text-right">
                    {formatDateOnly(user.createdAt, 'MMMM [de] YYYY')}
                  </span>
                </div>
              )}
            </div>

            {/* Footer document lock note */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Lock size={12} className="text-amber-500 shrink-0" />
              <span>{t('profile:personal.document_locked_hint')}</span>
            </div>
            </div>
          </div>
        )}

        {/* Tab 2: Ministry and Church Service */}
        {activeTab === 'ministry' && (
          <div className="space-y-4">
            {/* Volunteer Context & Campus Assignments */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
              {/* Header with subtle gray background */}
              <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-slate-100 bg-slate-50/70">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  {t('profile:ministry.volunteer_title')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('profile:ministry.subtitle')}
                </p>
              </div>

              <div className="p-5 sm:p-6">
                {formattedAssignments.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {formattedAssignments.map((item) => (
                      <div
                        key={item.id}
                        className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-700 border border-violet-200/60 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
                            <Layers size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">
                              {item.ministryName}
                            </h4>
                            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                <MapPin size={11} className="text-slate-400 shrink-0" />
                                <span>{item.campusName}</span>
                              </span>
                              <span className="text-slate-300">•</span>
                              <span>
                                <span className="text-slate-400">{t('profile:ministry.area_label')}: </span>
                                <strong className="font-semibold text-slate-700">{item.areaName || t('profile:ministry.all_areas')}</strong>
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="inline-flex items-center gap-1">
                                <Users size={11} className="text-slate-400 shrink-0" />
                                <strong className="font-semibold text-slate-700">{item.groupName || t('profile:ministry.all_groups')}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 pl-[54px] sm:pl-0 self-start sm:self-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200/80 shadow-2xs">
                            <Award size={12} className="text-violet-600 shrink-0" />
                            <span>{item.roleLabel}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-xs text-slate-500">
                      {t('profile:ministry.no_volunteer')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Security & Device Configuration */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
            {/* Header with subtle gray background */}
            <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-slate-100 bg-slate-50/70">
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {t('profile:security.title')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('profile:security.subtitle')}
              </p>
            </div>

            <div className="p-5 sm:p-6 divide-y divide-slate-100">
              {/* Biometrics */}
              {bioAvailable && (
                <div className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                        isBioEnabled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Fingerprint size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {t('profile:security.biometrics_title')}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {t('profile:security.biometrics_desc')}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    <ToggleSwitch
                      checked={isBioEnabled}
                      onChange={handleToggleBiometrics}
                      label={t('profile:security.biometrics_title')}
                    />
                  </div>
                </div>
              )}

              {/* Push Notifications */}
              {pushSupported && (
                <div className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                        pushEnabled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <BellRing size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {t('profile:security.push_title')}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {t('profile:security.push_desc')}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    <ToggleSwitch
                      checked={pushEnabled}
                      onChange={handleTogglePush}
                      disabled={isPushLoading}
                      label={t('profile:security.push_title')}
                    />
                  </div>
                </div>
              )}

              {/* Clear cache and update app */}
              <div className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <RotateCcw size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {t('profile:security.cache_title')}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {t('profile:security.cache_desc')}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setShowClearCacheConfirm(true)}
                  className="w-full sm:w-auto shrink-0 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 shadow-2xs text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw size={13} />
                  <span>{t('profile:security.cache_btn')}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Profile Modal */}
      <EditProfileModal open={isEditOpen} onOpenChange={setIsEditOpen} />

      {/* Confirm Cache Purge */}
      <ConfirmModal
        open={showClearCacheConfirm}
        onOpenChange={setShowClearCacheConfirm}
        title={t('profile:security.cache_modal_title')}
        description={t('profile:security.cache_modal_desc')}
        confirmText={t('profile:security.cache_btn')}
        cancelText={t('common:actions.cancel')}
        type="info"
        onConfirm={clearAppCacheAndReload}
      />

      {/* Biometrics Password Modal */}
      <Dialog.Root open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-[330] animate-in fade-in" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-surface w-[90%] max-w-sm rounded-2xl shadow-xl z-[331] p-6 outline-none animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Fingerprint size={22} />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-gray-800">
                  {t('profile:security.biometrics_modal_title')}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-gray-500">
                  {t('profile:security.biometrics_modal_desc')}
                </Dialog.Description>
              </div>
            </div>

            <form onSubmit={handleConfirmPasswordAndRegisterBio} className="flex flex-col gap-4">
              <Input
                label={t('profile:security.biometrics_modal_password')}
                type="password"
                placeholder="Ingresa tu contraseña"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoComplete="current-password"
                className="placeholder:text-gray-400"
                required
              />

              <div className="flex gap-2 justify-end mt-2">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setShowPasswordModal(false)}
                >
                  {t('common:actions.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isRegisteringBio}
                  loadingText="Escaneando..."
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {t('profile:security.biometrics_modal_submit')}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default ProfileView;
