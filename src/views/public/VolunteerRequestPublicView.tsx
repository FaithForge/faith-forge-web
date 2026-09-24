import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Sparkles,
  Shield,
  User,
  MapPin,
  AlertCircle,
  Search,
  LogIn,
} from 'lucide-react';
import { toast } from 'sonner';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import PhoneInput from '@/components/ui/PhoneInput';
import Button from '@/components/ui/Button';
import { validatePhoneNumber } from '@/libs/utils/phone';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import {
  CheckVolunteerUser,
  CreateVolunteerApplication,
  GetPublicVolunteerCatalog,
} from '@/libs/state/redux/thunks/church/volunteerApplication.thunk';
import {
  ICheckVolunteerUserResponse,
  VolunteerRole,
  ServiceAreaGroupStateEnum,
} from '@/libs/models';
import { APP_ROUTES } from '@/config/routes';

const ID_TYPES = [
  { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
  { value: 'TI', label: 'Tarjeta de Identidad (TI)' },
  { value: 'CE', label: 'Cédula de Extranjería (CE)' },
  { value: 'PS', label: 'Pasaporte (PS)' },
  { value: 'RC', label: 'Registro Civil (RC)' },
];

const GENDER_OPTIONS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
];

const ROLE_OPTIONS = [
  { value: VolunteerRole.VOLUNTEER, label: 'Servidor' },
  { value: VolunteerRole.SUPERVISOR, label: 'Supervisor' },
  { value: VolunteerRole.GROUP_COORDINATOR, label: 'Coordinador de Grupo' },
];

/**
 * Public volunteer registration view accessed via QR code or direct link.
 * Allows attendees to submit their application without logging in.
 *
 * @returns {JSX.Element} Public application form or success confirmation.
 */
const VolunteerRequestPublicView: React.FC = () => {
  const { t } = useTranslation(['auth', 'common']);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { catalog, loadingCatalog, submitting } = useAppSelector(
    (state) => state.volunteerApplicationSlice
  );

  const [churchCampusId, setChurchCampusId] = useState(searchParams.get('campusId') || '');
  const [ministryAreaId, setMinistryAreaId] = useState(searchParams.get('areaId') || '');
  const [ministryGroupConfigId, setMinistryGroupConfigId] = useState(
    searchParams.get('groupId') || ''
  );
  const [requestedRole, setRequestedRole] = useState<VolunteerRole | ''>(
    (searchParams.get('role') as VolunteerRole) || ''
  );

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalIdType, setNationalIdType] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [dialCodePhone, setDialCodePhone] = useState('+57');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Lookup state for existing user
  const [checkingUser, setCheckingUser] = useState(false);
  const [hasCheckedUser, setHasCheckedUser] = useState(false);
  const [existingUser, setExistingUser] = useState<ICheckVolunteerUserResponse | null>(null);

  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    dispatch(GetPublicVolunteerCatalog());
  }, [dispatch]);

  const ministryName = useMemo(() => {
    const target =
      catalog?.ministryAreas?.find((a) => a.ministry?.name)?.ministry ||
      catalog?.ministryGroupConfigs?.find((g) => g.ministry?.name)?.ministry;
    return target?.name || 'el ministerio';
  }, [catalog]);

  // 1. Filtrar grupos que pertenecen a la sede seleccionada
  const filteredGroups = useMemo(() => {
    if (!churchCampusId || !catalog?.ministryGroupConfigs) return [];

    const sagGroupIds = new Set(
      (catalog.serviceAreaGroups || [])
        .filter(
          (sag) =>
            sag.churchCampusId === churchCampusId &&
            sag.state === ServiceAreaGroupStateEnum.ACTIVE,
        )
        .map((sag) => sag.ministryGroupConfigId),
    );

    return catalog.ministryGroupConfigs.filter((g) => {
      const campusId = g.churchCampusId || g.ministry?.churchCampusId;
      return campusId === churchCampusId || sagGroupIds.has(g.id);
    });
  }, [catalog, churchCampusId]);

  // 2. Filtrar áreas que pertenecen a la sede y opcionalmente al grupo seleccionado
  const filteredAreas = useMemo(() => {
    if (!churchCampusId || !catalog?.ministryAreas) return [];

    // Si hay un grupo seleccionado, priorizar áreas asociadas via ServiceAreaGroup
    if (ministryGroupConfigId) {
      const sagForGroup = (catalog.serviceAreaGroups || []).filter(
        (sag) =>
          sag.churchCampusId === churchCampusId &&
          sag.ministryGroupConfigId === ministryGroupConfigId &&
          sag.state === ServiceAreaGroupStateEnum.ACTIVE,
      );

      if (sagForGroup && sagForGroup.length > 0) {
        const allowedAreaIds = new Set(sagForGroup.map((sag) => sag.ministryAreaId));
        return catalog.ministryAreas.filter((a) => allowedAreaIds.has(a.id));
      }
    }

    // Fallback: todas las áreas activas de la sede
    return catalog.ministryAreas.filter((a) => {
      const campusId = a.churchCampusId || a.ministry?.churchCampusId;
      return campusId === churchCampusId;
    });
  }, [catalog, churchCampusId, ministryGroupConfigId]);

  /**
   * Handles campus selection change and resets dependent fields.
   *
   * @param {string} newCampusId - The selected church campus ID.
   * @returns {void}
   */
  const handleCampusChange = (newCampusId: string) => {
    setChurchCampusId(newCampusId);
    setMinistryGroupConfigId('');
    setRequestedRole('');
    setMinistryAreaId('');
  };

  /**
   * Handles service group selection change and resets area if chosen.
   *
   * @param {string} newGroupId - The selected ministry group config ID.
   * @returns {void}
   */
  const handleGroupChange = (newGroupId: string) => {
    setMinistryGroupConfigId(newGroupId);
    setMinistryAreaId('');
  };

  /**
   * Handles volunteer role change, clearing area if group coordinator is chosen.
   *
   * @param {VolunteerRole | ''} newRole - The selected volunteer role.
   * @returns {void}
   */
  const handleRoleChange = (newRole: VolunteerRole | '') => {
    setRequestedRole(newRole);
    if (newRole === VolunteerRole.GROUP_COORDINATOR) {
      setMinistryAreaId('');
    }
  };

  const handleDocumentChange = (newDoc: string) => {
    setNationalId(newDoc);
    if (hasCheckedUser) {
      setHasCheckedUser(false);
      setExistingUser(null);
    }
  };

  const handleDocumentTypeChange = (newType: string) => {
    setNationalIdType(newType);
    if (hasCheckedUser) {
      setHasCheckedUser(false);
      setExistingUser(null);
    }
  };

  const handleCheckUser = async () => {
    if (!nationalIdType) {
      toast.error(t('auth:volunteer_request.toast_select_id_type'));
      return;
    }
    if (!nationalId.trim()) {
      toast.error(t('auth:volunteer_request.toast_enter_id'));
      return;
    }

    setCheckingUser(true);
    try {
      const result = await dispatch(
        CheckVolunteerUser({
          nationalId: nationalId.trim(),
          nationalIdType,
        })
      ).unwrap();

      setHasCheckedUser(true);
      if (result.exists && result.userId) {
        setExistingUser(result);
        toast.success(t('auth:volunteer_request.toast_server_found'));
      } else {
        setExistingUser(null);
        toast.info(t('auth:volunteer_request.toast_no_prev_record'));
      }
    } catch {
      setHasCheckedUser(true);
      setExistingUser(null);
    } finally {
      setCheckingUser(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nationalIdType) {
      toast.error(t('auth:volunteer_request.toast_select_id_type'));
      return;
    }
    if (!nationalId.trim()) {
      toast.error(t('auth:volunteer_request.toast_enter_id'));
      return;
    }
    if (!hasCheckedUser) {
      toast.error(t('auth:volunteer_request.toast_check_doc_first'));
      return;
    }
    if (!churchCampusId) {
      toast.error(t('auth:volunteer_request.toast_select_campus'));
      return;
    }
    if (!ministryGroupConfigId) {
      toast.error(t('auth:volunteer_request.toast_select_group'));
      return;
    }
    if (!requestedRole) {
      toast.error(t('auth:volunteer_request.toast_select_role'));
      return;
    }
    if (requestedRole !== VolunteerRole.GROUP_COORDINATOR && !ministryAreaId) {
      toast.error(t('auth:volunteer_request.toast_select_area'));
      return;
    }

    // Si es usuario nuevo, validar datos obligatorios
    if (!existingUser?.userId) {
      if (!firstName.trim()) {
        toast.error(t('auth:volunteer_request.toast_enter_first_name'));
        return;
      }
      if (!lastName.trim()) {
        toast.error(t('auth:volunteer_request.toast_enter_last_name'));
        return;
      }
      const lastNameParts = lastName.trim().split(/\s+/).filter(Boolean);
      if (lastNameParts.length < 2) {
        toast.error(t('auth:volunteer_request.toast_enter_both_last_names'));
        return;
      }
      if (!birthday) {
        toast.error(t('auth:volunteer_request.toast_enter_birthday'));
        return;
      }
      if (!gender) {
        toast.error(t('auth:volunteer_request.toast_select_gender'));
        return;
      }
      if (phone && phone.trim()) {
        const phoneVal = validatePhoneNumber(phone, dialCodePhone);
        if (!phoneVal.isValid) {
          toast.error(phoneVal.error || t('auth:volunteer_request.toast_valid_phone'));
          return;
        }
      }
    }

    try {
      const isGroupCoordinator = requestedRole === VolunteerRole.GROUP_COORDINATOR;
      const areaIdPayload = isGroupCoordinator ? undefined : ministryAreaId || undefined;

      if (existingUser?.userId) {
        await dispatch(
          CreateVolunteerApplication({
            userId: existingUser.userId,
            churchCampusId,
            ministryAreaId: areaIdPayload,
            ministryGroupConfigId,
            requestedRole: requestedRole as VolunteerRole,
          })
        ).unwrap();
      } else {
        await dispatch(
          CreateVolunteerApplication({
            churchCampusId,
            ministryAreaId: areaIdPayload,
            ministryGroupConfigId,
            requestedRole: requestedRole as VolunteerRole,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            nationalIdType,
            nationalId: nationalId.trim(),
            birthday,
            gender,
            dialCodePhone: phone.trim() ? dialCodePhone : undefined,
            phone: phone.trim() || undefined,
            email: email.trim().toLowerCase() || undefined,
          })
        ).unwrap();
      }

      setSubmittedSuccess(true);
      toast.success(t('auth:volunteer_request.toast_submit_success'));
    } catch (err: any) {
      let msg = t('auth:volunteer_request.toast_submit_error');
      if (typeof err === 'string') {
        msg = err;
      } else if (err?.message) {
        if (typeof err.message === 'string') {
          msg = err.message;
        } else if (typeof err.message === 'object' && err.message?.message && typeof err.message.message === 'string') {
          msg = err.message.message;
        } else if (Array.isArray(err.message)) {
          msg = err.message.join(', ');
        }
      }
      toast.error(msg);
    }
  };

  const handleReset = () => {
    setChurchCampusId('');
    setMinistryAreaId('');
    setMinistryGroupConfigId('');
    setRequestedRole('');
    setFirstName('');
    setLastName('');
    setNationalIdType('');
    setNationalId('');
    setBirthday('');
    setGender('');
    setDialCodePhone('+57');
    setPhone('');
    setEmail('');
    setCheckingUser(false);
    setHasCheckedUser(false);
    setExistingUser(null);
    setSubmittedSuccess(false);
  };

  if (submittedSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-surface to-surface flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-100 text-center space-y-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={40} className="stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {t('auth:volunteer_request.submitted_title')}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('auth:volunteer_request.submitted_desc', { ministry: ministryName })}
            </p>
          </div>

          {/* Recordatorio en confirmación sobre múltiples grupos */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-left flex items-start gap-2.5 text-xs text-amber-900">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <span className="font-bold">{t('auth:volunteer_request.multi_group_title')}</span> {t('auth:volunteer_request.multi_group_desc')}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left text-xs text-gray-600 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">{t('auth:volunteer_request.volunteer_label')}</span>
              <span className="font-semibold text-gray-800">
                {existingUser
                  ? `${existingUser.maskedFirstName} ${existingUser.maskedLastName}`
                  : `${firstName} ${lastName}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">{t('auth:volunteer_request.document_label')}</span>
              <span className="font-semibold text-gray-800">{nationalIdType} {nationalId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">{t('auth:volunteer_request.campus_label')}</span>
              <span className="font-semibold text-gray-800">
                {catalog?.campuses?.find((c) => c.id === churchCampusId)?.name || 'Sede'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">{t('auth:volunteer_request.group_label')}</span>
              <span className="font-semibold text-gray-800">
                {catalog?.ministryGroupConfigs?.find((g) => g.id === ministryGroupConfigId)?.name || 'Grupo'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">{t('auth:volunteer_request.role_label')}</span>
              <span className="font-semibold text-emerald-600">
                {ROLE_OPTIONS.find((r) => r.value === requestedRole)?.label || requestedRole}
              </span>
            </div>
            {requestedRole !== VolunteerRole.GROUP_COORDINATOR && ministryAreaId && (
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">{t('auth:volunteer_request.area_label')}</span>
                <span className="font-semibold text-gray-800">
                  {catalog?.ministryAreas?.find((a) => a.id === ministryAreaId)?.name}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2.5 pt-1">
            <Button
              onClick={handleReset}
              block
              className="rounded-2xl py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              {t('auth:volunteer_request.register_another_button')}
            </Button>

            <Button
              type="button"
              variant="default"
              onClick={() => navigate(APP_ROUTES.auth.login)}
              block
              className="rounded-2xl py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer border-gray-200"
            >
              <LogIn size={16} className="text-gray-500" />
              {t('auth:volunteer_request.login_button')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100/60 py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white p-2 shadow-md border border-gray-100 mx-auto">
            <img src="/logo-iglekids.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <Sparkles size={13} />
              {t('auth:volunteer_request.badge')}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {t('auth:volunteer_request.title')}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
              {t('auth:volunteer_request.subtitle', { ministry: ministryName })}
            </p>
          </div>

          {/* Anotación sobre múltiples grupos */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 sm:p-3.5 max-w-md mx-auto text-left flex items-start gap-2.5 shadow-xs">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              <span className="font-bold">{t('auth:volunteer_request.multi_group_warning_prefix')}</span> {t('auth:volunteer_request.multi_group_warning_text')}
            </p>
          </div>
        </div>

        {/* Main Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-gray-200/80 space-y-6"
        >
          {/* Section 1: Identificación (Primero que todo) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <Shield size={18} className="text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                {t('auth:volunteer_request.section_id')}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <Select
                  label={t('auth:volunteer_request.id_type')}
                  required
                  value={nationalIdType}
                  onChange={(e) => handleDocumentTypeChange(e.target.value)}
                >
                  <option value="" className="text-gray-700 bg-white">{t('auth:volunteer_request.id_type_select')}</option>
                  {ID_TYPES.map((idType) => (
                    <option key={idType.value} value={idType.value} className="text-gray-900 bg-white font-medium">
                      {idType.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Input
                  label={t('auth:volunteer_request.id_number')}
                  required
                  placeholder={t('auth:volunteer_request.id_number_placeholder')}
                  value={nationalId}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                />
              </div>
            </div>

            {/* Botón para verificar documento si aún no se ha consultado */}
            {!hasCheckedUser && (
              <Button
                type="button"
                onClick={handleCheckUser}
                loading={checkingUser}
                disabled={!nationalIdType || !nationalId.trim()}
                block
                className="rounded-2xl py-3 text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Search size={15} />
                {t('auth:volunteer_request.check_my_data')}
              </Button>
            )}

            {/* Feedback: Usuario encontrado */}
            {hasCheckedUser && existingUser?.exists && (
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={22} className="stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-block text-[10px] font-bold text-emerald-700 uppercase tracking-wide bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      {t('auth:volunteer_request.server_identified_badge')}
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-gray-900 mt-1 truncate">
                      {existingUser.maskedFirstName} {existingUser.maskedLastName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-600 mt-0.5">
                      {existingUser.maskedPhone && (
                        <span><span className="text-gray-400">Tel:</span> {existingUser.maskedPhone}</span>
                      )}
                      {existingUser.maskedEmail && (
                        <span><span className="text-gray-400">Email:</span> {existingUser.maskedEmail}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium mt-1">
                      {t('auth:volunteer_request.no_need_refill_hint')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHasCheckedUser(false);
                    setExistingUser(null);
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-900 underline font-medium cursor-pointer shrink-0"
                >
                  {t('auth:volunteer_request.change_doc')}
                </button>
              </div>
            )}

            {/* Feedback: Usuario nuevo */}
            {hasCheckedUser && !existingUser?.exists && (
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-sky-900">
                <AlertCircle size={17} className="text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{t('auth:volunteer_request.no_prev_record_title')}</span>
                  <p className="mt-0.5 text-sky-800">
                    {t('auth:volunteer_request.no_prev_record_desc')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Datos Personales (Solo para nuevos registros) */}
          {hasCheckedUser && !existingUser?.exists && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <User size={18} className="text-emerald-600" />
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                  {t('auth:volunteer_request.section_personal')}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={t('auth:volunteer_request.first_name')}
                  required
                  placeholder={t('auth:volunteer_request.first_name_placeholder')}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  label={t('auth:volunteer_request.last_name')}
                  required
                  placeholder={t('auth:volunteer_request.last_name_placeholder')}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={t('auth:volunteer_request.birthday')}
                  type="date"
                  required
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
                <Select
                  label={t('auth:volunteer_request.gender')}
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="" className="text-gray-700 bg-white">{t('auth:volunteer_request.gender_placeholder')}</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value} className="text-gray-900 bg-white font-medium">
                      {g.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PhoneInput
                  label={t('auth:volunteer_request.phone')}
                  dialCode={dialCodePhone}
                  phone={phone}
                  onDialCodeChange={setDialCodePhone}
                  onPhoneChange={setPhone}
                />
                <Input
                  label={t('auth:volunteer_request.email')}
                  type="email"
                  placeholder={t('auth:volunteer_request.email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Section: Dónde sirves actualmente */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <MapPin size={18} className="text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                {hasCheckedUser && !existingUser?.exists ? t('auth:volunteer_request.section_placement_new') : t('auth:volunteer_request.section_placement_existing')}
              </h2>
            </div>

            <div className="space-y-3">
              <Select
                label={t('auth:volunteer_request.campus')}
                required
                value={churchCampusId}
                onChange={(e) => handleCampusChange(e.target.value)}
                disabled={loadingCatalog}
              >
                <option value="" className="text-gray-700 bg-white">{t('auth:volunteer_request.campus_placeholder')}</option>
                {catalog?.campuses?.map((c) => (
                  <option key={c.id} value={c.id} className="text-gray-900 bg-white font-medium">
                    {c.name}
                  </option>
                ))}
              </Select>

              <Select
                label={t('auth:volunteer_request.group')}
                required
                value={ministryGroupConfigId}
                onChange={(e) => handleGroupChange(e.target.value)}
                disabled={loadingCatalog || !churchCampusId}
              >
                <option value="" className="text-gray-700 bg-white">
                  {!churchCampusId
                    ? t('auth:volunteer_request.select_campus_first')
                    : filteredGroups.length === 0
                    ? t('auth:volunteer_request.no_groups_for_campus')
                    : t('auth:volunteer_request.select_group_item')}
                </option>
                {filteredGroups.map((g) => (
                  <option key={g.id} value={g.id} className="text-gray-900 bg-white font-medium">
                    {g.name}
                  </option>
                ))}
              </Select>

              <Select
                label={t('auth:volunteer_request.role')}
                required
                value={requestedRole}
                onChange={(e) => handleRoleChange(e.target.value as VolunteerRole)}
                disabled={!ministryGroupConfigId}
              >
                <option value="" className="text-gray-700 bg-white">
                  {!ministryGroupConfigId ? t('auth:volunteer_request.select_group_first') : t('auth:volunteer_request.select_role_item')}
                </option>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="text-gray-900 bg-white font-medium">
                    {opt.label}
                  </option>
                ))}
              </Select>

              {requestedRole && requestedRole !== VolunteerRole.GROUP_COORDINATOR && (
                <Select
                  label={t('auth:volunteer_request.area')}
                  required
                  value={ministryAreaId}
                  onChange={(e) => setMinistryAreaId(e.target.value)}
                  disabled={loadingCatalog || !churchCampusId}
                >
                  <option value="" className="text-gray-700 bg-white">
                    {filteredAreas.length === 0
                      ? t('auth:volunteer_request.no_areas_available')
                      : t('auth:volunteer_request.select_area_item')}
                  </option>
                  {filteredAreas.map((a) => (
                    <option key={a.id} value={a.id} className="text-gray-900 bg-white font-medium">
                      {a.name}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              block
              loading={submitting}
              className="rounded-2xl py-3.5 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
            >
              {submitting ? t('auth:volunteer_request.submitting') : t('auth:volunteer_request.submit')}
            </Button>
            <p className="text-[11px] text-center text-gray-400 mt-2">
              {t('auth:volunteer_request.privacy_notice')}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VolunteerRequestPublicView;
