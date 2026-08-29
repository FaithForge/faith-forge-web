import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { X, Search, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetKidGuardian, CreateKidGuardian } from '@/libs/state/redux/thunks/kid-church/kid-guardian.thunk';
import { GetKid } from '@/libs/state/redux/thunks/kid-church/kid.thunk';
import { cleanCurrentKidGuardian } from '@/libs/state/redux/slices/kid-church/kid-guardian.slice';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import SelectSearch from '@/components/ui/SelectSearch';
import Button from '@/components/ui/Button';
import { capitalizeWords } from '@/libs/utils/text';
import { validateTwoLastNames } from '@/libs/utils/validator';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import {
  IdType,
  UserIdType,
  userGenderSelect,
  kidRelationSelect,
} from '@/libs/models';

interface AssignGuardianModalProps {
  open: boolean;
  onClose: () => void;
  kidId: string;
}

const idTypeOptions = [
  { id: UserIdType.CC, name: IdType.CC },
  { id: UserIdType.TI, name: IdType.TI },
  { id: UserIdType.RC, name: IdType.RC },
  { id: UserIdType.CE, name: IdType.CE },
  { id: UserIdType.PS, name: IdType.PS },
];

const genderOptions = userGenderSelect.map(g => ({
  id: g.value,
  name: g.label,
}));

export const AssignGuardianModal: React.FC<AssignGuardianModalProps> = ({
  open,
  onClose,
  kidId,
}) => {
  useModalBackClose(open, onClose);

  const dispatch = useAppDispatch();
  const { current: existingGuardian, loading: guardianLoading } = useAppSelector(
    (state) => state.kidGuardianSlice
  );

  const [nationalIdType, setNationalIdType] = useState<string>(UserIdType.CC);
  const [nationalId, setNationalId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dialCodePhone, setDialCodePhone] = useState('+57');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<string>('');
  const [relation, setRelation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      dispatch(cleanCurrentKidGuardian());
      setNationalIdType(UserIdType.CC);
      setNationalId('');
      setFirstName('');
      setLastName('');
      setDialCodePhone('+57');
      setPhone('');
      setGender('');
      setRelation('');
    }
  }, [open, dispatch]);

  // Autocomplete if existing guardian found in DB
  useEffect(() => {
    if (existingGuardian) {
      if (existingGuardian.nationalIdType) setNationalIdType(existingGuardian.nationalIdType);
      if (existingGuardian.firstName) setFirstName(capitalizeWords(existingGuardian.firstName));
      if (existingGuardian.lastName) setLastName(capitalizeWords(existingGuardian.lastName));
      if (existingGuardian.dialCodePhone) setDialCodePhone(existingGuardian.dialCodePhone);
      if (existingGuardian.phone) setPhone(existingGuardian.phone);
      if (existingGuardian.gender) setGender(existingGuardian.gender);
      if (existingGuardian.relation) setRelation(existingGuardian.relation);
    }
  }, [existingGuardian]);

  const handleSearchGuardian = () => {
    const cleanDoc = nationalId.trim();
    if (cleanDoc) {
      dispatch(GetKidGuardian(cleanDoc));
    }
  };

  const handleClearGuardian = () => {
    dispatch(cleanCurrentKidGuardian());
    setNationalIdType(UserIdType.CC);
    setNationalId('');
    setFirstName('');
    setLastName('');
    setDialCodePhone('+57');
    setPhone('');
    setGender('');
    setRelation('');
  };

  // Filter relations based on gender
  const availableRelations = kidRelationSelect
    .filter((r) => !gender || r.gender === gender)
    .map((r) => ({ id: r.value, name: r.label }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nationalId.trim()) {
      toast.error('Por favor ingrese el número de documento');
      return;
    }
    if (!firstName.trim()) {
      toast.error('Por favor ingrese el nombre del acudiente');
      return;
    }
    const lastNameValidation = validateTwoLastNames(lastName);
    if (lastNameValidation !== true) {
      toast.error(typeof lastNameValidation === 'string' ? lastNameValidation : 'Se deben colocar ambos apellidos');
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      toast.error('Por favor ingrese un número de teléfono válido (mínimo 7 dígitos)');
      return;
    }
    if (!gender) {
      toast.error('Por favor seleccione el género del acudiente');
      return;
    }
    if (!relation) {
      toast.error('Por favor seleccione el parentesco / relación con el niño');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        kidId,
        nationalIdType,
        nationalId: nationalId.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dialCodePhone,
        phone: phone.trim(),
        gender,
        relation,
      };

      const response = await dispatch(CreateKidGuardian(payload as any));
      if (!response.payload?.error) {
        toast.success('¡Acudiente asignado con éxito!');
        await dispatch(GetKid({ id: kidId }));
        onClose();
      } else {
        toast.error(response.payload?.error || 'Error al asignar el acudiente');
      }
    } catch {
      toast.error('Error de conexión al asignar el acudiente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer.Root handleOnly repositionInputs={false} open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/50 z-[300]" />
        <Drawer.Content 
          className="bg-surface flex flex-col rounded-t-[24px] fixed bottom-0 left-0 right-0 z-[301] max-h-[90dvh] outline-none"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="w-full bg-white rounded-t-[24px] border-b border-gray-100 shadow-xs z-10 flex items-center justify-between px-4 py-3.5 shrink-0 sticky top-0">
            <div className="w-8 shrink-0" />
            <Drawer.Title className="font-bold text-gray-800 text-base flex-1 text-center truncate px-2">
              Asignar Nuevo Acudiente
            </Drawer.Title>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 active:scale-95 transition-all shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto overscroll-contain flex-1 min-h-0 flex flex-col gap-4 pb-12">
            {/* Banner if already exists in database */}
            {existingGuardian && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <UserCheck size={18} className="text-emerald-600 shrink-0" />
                  <span>Acudiente encontrado en la base de datos</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearGuardian}
                  className="text-xs text-emerald-700 underline font-bold"
                >
                  Limpiar
                </button>
              </div>
            )}

            {/* Tipo de Documento */}
            <SelectSearch
              label="Tipo de Documento"
              required
              value={nationalIdType}
              onChange={(val) => setNationalIdType(val)}
              options={idTypeOptions}
              placeholder="Seleccionar tipo de documento..."
              disabled={!!existingGuardian}
            />

            {/* Document and Search Button */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Número de Documento <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  onBlur={handleSearchGuardian}
                  disabled={!!existingGuardian}
                  placeholder="Escribir número de documento..."
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-2.5 pl-3 pr-10 focus:border-primary focus:ring-0 outline-none text-base shadow-sm transition-colors disabled:bg-gray-100 disabled:text-gray-500"
                />
                <button
                  type="button"
                  onClick={handleSearchGuardian}
                  disabled={guardianLoading || !!existingGuardian}
                  className="absolute right-2 text-gray-400 hover:text-primary p-1.5 transition-colors"
                >
                  <Search size={18} />
                </button>
              </div>
            </div>

            {/* Nombre */}
            <Input
              label="Nombre"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={!!existingGuardian}
              placeholder="Escribir nombre..."
            />

            {/* Apellidos */}
            <Input
              label="Apellidos"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={!!existingGuardian}
              placeholder="Escribir apellidos..."
            />

            {/* Phone */}
            <PhoneInput
              label="Teléfono"
              required
              dialCode={dialCodePhone}
              phone={phone}
              disabled={!!existingGuardian}
              onDialCodeChange={setDialCodePhone}
              onPhoneChange={setPhone}
            />

            {/* Gender */}
            <SelectSearch
              label="Género"
              required
              value={gender}
              onChange={(val) => {
                setGender(val);
                setRelation('');
              }}
              options={genderOptions}
              placeholder="Seleccionar género..."
              disabled={!!existingGuardian}
            />

            {/* Relationship to Child */}
            <SelectSearch
              label="Relación con el Niño"
              required
              value={relation}
              onChange={(val) => setRelation(val)}
              options={availableRelations}
              placeholder="Seleccionar relación..."
            />

            {/* Botón Asignar */}
            <Button
              type="submit"
              block
              variant="primary"
              loading={isSubmitting || guardianLoading}
              loadingText="Asignando..."
              className="mt-2"
            >
              Asignar Acudiente
            </Button>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default AssignGuardianModal;
