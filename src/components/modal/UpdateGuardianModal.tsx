import React, { useEffect, useState, useMemo } from 'react';
import ModalOverlay from '@/components/ui/ModalOverlay';
import Button from '@/components/ui/Button';
import PhoneInput from '@/components/ui/PhoneInput';
import SelectSearch from '@/components/ui/SelectSearch';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import { UpdateKidGuardianPhone } from '@/libs/state/redux/thunks/kid-church/kid-guardian.thunk';
import { GetKid } from '@/libs/state/redux/thunks/kid-church/kid.thunk';
import { kidRelationSelect } from '@/libs/models/KidChurch';

export interface GuardianToUpdate {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender?: string;
  dialCodePhone?: string;
  phone: string;
  relation: string;
  kidId: string;
}

interface UpdateGuardianModalProps {
  open: boolean;
  onClose: () => void;
  guardian: GuardianToUpdate | null;
}

const sanitizePhoneDigits = (raw: string) => {
  if (!raw) return '';
  return raw.replace(/\D/g, ''); // Leave only numeric digits
};

const UpdateGuardianModal: React.FC<UpdateGuardianModalProps> = ({ open, onClose, guardian }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [dialCode, setDialCode] = useState('+57');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');
  const [error, setError] = useState('');

  // Filter relationship list by gender if available, or display all
  const availableRelations = useMemo(() => {
    if (guardian?.gender) {
      const filtered = kidRelationSelect
        .filter((r) => r.gender === guardian.gender)
        .map((r) => ({ id: r.value, name: r.label }));
      if (filtered.length > 0) return filtered;
    }
    return kidRelationSelect.map((r) => ({ id: r.value, name: r.label }));
  }, [guardian?.gender]);

  useEffect(() => {
    if (guardian) {
      setDialCode(guardian.dialCodePhone || '+57');
      setPhone(sanitizePhoneDigits(guardian.phone));
      setRelation(guardian.relation || '');
      setError('');
    }
  }, [guardian]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guardian || !guardian.id || !guardian.kidId) {
      toast.error('Información de acudiente incompleta');
      return;
    }

    const cleanPhone = sanitizePhoneDigits(phone);
    if (cleanPhone.length < 7) {
      setError('El teléfono debe tener al menos 7 dígitos');
      return;
    }

    if (!relation) {
      toast.error('Por favor seleccione la relación con el niño');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await dispatch(UpdateKidGuardianPhone({
        id: guardian.id,
        dialCodePhone: dialCode,
        phone: cleanPhone,
        relation: relation as any,
        kidId: guardian.kidId,
      })).unwrap();

      // If the API responds with an explicit error object
      if (response && (response as any).error) {
        const msg = (response as any)?.message || 'El teléfono ingresado ya existe o no es válido';
        toast.error(msg);
        return;
      }

      toast.success(`Datos de ${guardian.fullName} actualizados con éxito`);
      // Refresh view by re-fetching child details
      await dispatch(GetKid({ id: guardian.kidId }));
      onClose();
    } catch (err: any) {
      const errMsg = err?.message || err?.error || err?.response?.data?.message || 'Error al actualizar el acudiente';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <div className="bg-white rounded-2xl p-5 shadow-xl mx-auto w-full max-w-sm flex flex-col relative overflow-hidden">
        {/* Modal header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Actualizar Acudiente</h3>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{guardian?.fullName}</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 bg-gray-50 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors outline-none"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Selector de Parentesco / Relación */}
          <SelectSearch
            label="Parentesco / Relación"
            required
            value={relation}
            onChange={(val) => setRelation(val)}
            options={availableRelations}
            placeholder="Seleccionar parentesco..."
          />

          {/* Phone */}
          <PhoneInput 
            label="Teléfono"
            dialCode={dialCode}
            phone={phone}
            onDialCodeChange={(code) => setDialCode(code)}
            onPhoneChange={(val) => {
              setPhone(val);
              if (error) setError('');
            }}
            error={error}
          />

          <div className="flex gap-3 mt-2">
            <Button type="button" onClick={onClose} variant="ghost" className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={isLoading} className="flex-1">
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
};

export default UpdateGuardianModal;
