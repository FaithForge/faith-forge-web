import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Sparkles, Shield, User, MapPin, Layers, Users, Calendar, AlertCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import PhoneInput from '@/components/ui/PhoneInput';
import Button from '@/components/ui/Button';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import {
  CheckVolunteerUser,
  CreateVolunteerApplication,
  GetPublicVolunteerCatalog,
} from '@/libs/state/redux/thunks/church/volunteerApplication.thunk';
import { ICheckVolunteerUserResponse, VolunteerRole } from '@/libs/models';

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
  const dispatch = useAppDispatch();
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

  // 1. Filtrar áreas que pertenecen a la sede seleccionada
  const filteredAreas = useMemo(() => {
    if (!churchCampusId || !catalog?.ministryAreas) return [];
    return catalog.ministryAreas.filter((a) => {
      const campusId = a.churchCampusId || a.ministry?.churchCampusId;
      return campusId === churchCampusId;
    });
  }, [catalog?.ministryAreas, churchCampusId]);

  // 2. Filtrar grupos que pertenecen a la sede y al área seleccionada
  const filteredGroups = useMemo(() => {
    if (!churchCampusId || !ministryAreaId || !catalog) return [];

    const selectedArea = catalog.ministryAreas?.find((a) => a.id === ministryAreaId);

    // Prioridad 1: ServiceAreaGroups configurados específicamente para esta área y sede
    const sagForArea = catalog.serviceAreaGroups?.filter(
      (sag) =>
        sag.churchCampusId === churchCampusId &&
        sag.ministryAreaId === ministryAreaId &&
        sag.active !== false
    );

    if (sagForArea && sagForArea.length > 0) {
      const allowedGroupConfigIds = new Set(sagForArea.map((sag) => sag.ministryGroupConfigId));
      return (catalog.ministryGroupConfigs || []).filter((g) => allowedGroupConfigIds.has(g.id));
    }

    // Prioridad 2: Grupos que pertenecen al mismo campus y ministerio del área
    return (catalog.ministryGroupConfigs || []).filter((g) => {
      const campusId = g.churchCampusId || g.ministry?.churchCampusId;
      const campusMatches = campusId === churchCampusId;
      const ministryMatches = selectedArea ? g.ministryId === selectedArea.ministryId : true;
      return campusMatches && ministryMatches;
    });
  }, [catalog, churchCampusId, ministryAreaId]);

  const handleCampusChange = (newCampusId: string) => {
    setChurchCampusId(newCampusId);
    setMinistryAreaId('');
    setMinistryGroupConfigId('');
  };

  const handleAreaChange = (newAreaId: string) => {
    setMinistryAreaId(newAreaId);
    setMinistryGroupConfigId('');
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
      toast.error('Por favor selecciona el tipo de documento');
      return;
    }
    if (!nationalId.trim()) {
      toast.error('Por favor ingresa tu número de documento');
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
        toast.success('¡Servidor encontrado en el sistema!');
      } else {
        setExistingUser(null);
        toast.info('No encontramos un registro previo. Por favor completa tus datos personales.');
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
      toast.error('Por favor selecciona el tipo de documento');
      return;
    }
    if (!nationalId.trim()) {
      toast.error('Por favor ingresa tu número de documento');
      return;
    }
    if (!hasCheckedUser) {
      toast.error('Por favor consulta tu documento primero');
      return;
    }
    if (!churchCampusId) {
      toast.error('Por favor selecciona una sede');
      return;
    }
    if (!ministryAreaId) {
      toast.error('Por favor selecciona un área de ministerio');
      return;
    }
    if (!ministryGroupConfigId) {
      toast.error('Por favor selecciona un grupo');
      return;
    }
    if (!requestedRole) {
      toast.error('Por favor selecciona el rol en el que sirves');
      return;
    }

    // Si es usuario nuevo, validar datos obligatorios
    if (!existingUser?.userId) {
      if (!firstName.trim()) {
        toast.error('Por favor ingresa tus nombres completos');
        return;
      }
      if (!lastName.trim()) {
        toast.error('Por favor ingresa tus apellidos completos');
        return;
      }
      const lastNameParts = lastName.trim().split(/\s+/).filter(Boolean);
      if (lastNameParts.length < 2) {
        toast.error('Por favor ingresa ambos apellidos (primer y segundo apellido)');
        return;
      }
      if (!birthday) {
        toast.error('Por favor ingresa tu fecha de nacimiento');
        return;
      }
      if (!gender) {
        toast.error('Por favor selecciona tu género');
        return;
      }
    }

    try {
      if (existingUser?.userId) {
        await dispatch(
          CreateVolunteerApplication({
            userId: existingUser.userId,
            churchCampusId,
            ministryAreaId,
            ministryGroupConfigId,
            requestedRole: requestedRole as VolunteerRole,
          })
        ).unwrap();
      } else {
        await dispatch(
          CreateVolunteerApplication({
            churchCampusId,
            ministryAreaId,
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
      toast.success('¡Registro de servidor enviado exitosamente!');
    } catch (err: any) {
      let msg = 'Error al registrar los datos del servidor';
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
              ¡Registro Enviado!
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Muchas gracias. Tus datos han sido recibidos para registrar y actualizar el equipo de servidores en <span className="font-bold text-emerald-700">Iglekids</span>.
              Tu coordinador confirmará tu asignación en el sistema.
            </p>
          </div>

          {/* Recordatorio en confirmación sobre múltiples grupos */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-left flex items-start gap-2.5 text-xs text-amber-900">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <span className="font-bold">¿Sirves en otro grupo?</span> Si también sirves en otro culto o grupo, debes registrar cada uno por separado pulsando el botón a continuación.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left text-xs text-gray-600 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">Servidor:</span>
              <span className="font-semibold text-gray-800">
                {existingUser
                  ? `${existingUser.maskedFirstName} ${existingUser.maskedLastName}`
                  : `${firstName} ${lastName}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">Documento:</span>
              <span className="font-semibold text-gray-800">{nationalIdType} {nationalId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">Rol:</span>
              <span className="font-semibold text-emerald-600">
                {ROLE_OPTIONS.find((r) => r.value === requestedRole)?.label || requestedRole}
              </span>
            </div>
          </div>

          <Button
            onClick={handleReset}
            block
            className="rounded-2xl py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
          >
            Registrar en otro grupo o servidor
          </Button>
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
            <img src="/logo-iglekids.png" alt="Iglekids" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <Sparkles size={13} />
              Registro de Servidores
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Registro de Servidores
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
              Diligencia este formulario para confirmar tus datos y registrar el grupo donde sirves actualmente en <span className="font-bold text-gray-800">Iglekids</span>.
            </p>
          </div>

          {/* Anotación sobre múltiples grupos */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 sm:p-3.5 max-w-md mx-auto text-left flex items-start gap-2.5 shadow-xs">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              <span className="font-bold">Importante:</span> Si sirves en más de un grupo (culto/horario), debes diligenciar este formulario <span className="underline font-bold">una vez por cada grupo</span> en el que participes.
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
                1. Identificación
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <Select
                  label="Tipo Documento"
                  required
                  value={nationalIdType}
                  onChange={(e) => handleDocumentTypeChange(e.target.value)}
                >
                  <option value="" className="text-gray-700 bg-white">Selecciona tipo...</option>
                  {ID_TYPES.map((idType) => (
                    <option key={idType.value} value={idType.value} className="text-gray-900 bg-white font-medium">
                      {idType.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Número de Documento"
                  required
                  placeholder="Ej. 1020304050"
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
                Consultar mis datos
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
                      Servidor Identificado
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
                      ✓ No necesitas volver a llenar tus datos personales. Continúa con tu grupo de servicio abajo.
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
                  Cambiar
                </button>
              </div>
            )}

            {/* Feedback: Usuario nuevo */}
            {hasCheckedUser && !existingUser?.exists && (
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-sky-900">
                <AlertCircle size={17} className="text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">No encontramos un registro previo con este documento.</span>
                  <p className="mt-0.5 text-sky-800">
                    Por favor completa tus datos personales a continuación para registrarte:
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
                  2. Datos Personales
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Nombres Completos"
                  required
                  placeholder="Ej. Juan Carlos"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  label="Apellidos Completos"
                  required
                  placeholder="Ej. Pérez Gómez (ambos apellidos)"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Fecha de Nacimiento"
                  type="date"
                  required
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
                <Select
                  label="Género"
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="" className="text-gray-700 bg-white">Selecciona tu género...</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value} className="text-gray-900 bg-white font-medium">
                      {g.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PhoneInput
                  label="Teléfono Celular"
                  dialCode={dialCodePhone}
                  phone={phone}
                  onDialCodeChange={setDialCodePhone}
                  onPhoneChange={setPhone}
                />
                <Input
                  label="Correo Electrónico"
                  type="email"
                  placeholder="Ej. correo@ejemplo.com"
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
                {hasCheckedUser && !existingUser?.exists ? '3. Dónde sirves actualmente' : '2. Dónde sirves actualmente'}
              </h2>
            </div>

            <div className="space-y-3">
              <Select
                label="Sede / Campus"
                required
                value={churchCampusId}
                onChange={(e) => handleCampusChange(e.target.value)}
                disabled={loadingCatalog}
              >
                <option value="" className="text-gray-700 bg-white">Selecciona tu sede...</option>
                {catalog?.campuses?.map((c) => (
                  <option key={c.id} value={c.id} className="text-gray-900 bg-white font-medium">
                    {c.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Área de Ministerio"
                required
                value={ministryAreaId}
                onChange={(e) => handleAreaChange(e.target.value)}
                disabled={loadingCatalog || !churchCampusId}
              >
                <option value="" className="text-gray-700 bg-white">
                  {!churchCampusId
                    ? 'Primero selecciona una sede...'
                    : filteredAreas.length === 0
                    ? 'No hay áreas disponibles para esta sede'
                    : 'Selecciona el área...'}
                </option>
                {filteredAreas.map((a) => (
                  <option key={a.id} value={a.id} className="text-gray-900 bg-white font-medium">
                    {a.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Grupo de Servicio"
                required
                value={ministryGroupConfigId}
                onChange={(e) => setMinistryGroupConfigId(e.target.value)}
                disabled={loadingCatalog || !ministryAreaId}
              >
                <option value="" className="text-gray-700 bg-white">
                  {!ministryAreaId
                    ? 'Primero selecciona un área...'
                    : filteredGroups.length === 0
                    ? 'No hay grupos configurados para esta área'
                    : 'Selecciona el grupo...'}
                </option>
                {filteredGroups.map((g) => (
                  <option key={g.id} value={g.id} className="text-gray-900 bg-white font-medium">
                    {g.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Rol en el que sirves"
                required
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value as VolunteerRole)}
              >
                <option value="" className="text-gray-700 bg-white">Selecciona tu rol...</option>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="text-gray-900 bg-white font-medium">
                    {opt.label}
                  </option>
                ))}
              </Select>
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
              {submitting ? 'Registrando datos...' : 'Registrar Mis Datos'}
            </Button>
            <p className="text-[11px] text-center text-gray-400 mt-2">
              Tus datos serán tratados de manera confidencial según las políticas de la iglesia.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VolunteerRequestPublicView;
