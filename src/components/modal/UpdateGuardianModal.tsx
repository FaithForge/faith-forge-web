import React, { useEffect, useState } from 'react';
import ModalOverlay from '@/components/ui/ModalOverlay';
import Button from '@/components/ui/Button';
import PhoneInput from '@/components/ui/PhoneInput';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import { UpdateKidGuardianPhone } from '@/libs/state/redux/thunks/kid-church/kid-guardian.thunk';
import { GetKid } from '@/libs/state/redux/thunks/kid-church/kid.thunk';

export interface GuardianToUpdate {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
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
  return raw.replace(/\D/g, ''); // Dejar solo dígitos numéricos
};

const UpdateGuardianModal: React.FC<UpdateGuardianModalProps> = ({ open, onClose, guardian }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [dialCode, setDialCode] = useState('+57');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (guardian) {
      setDialCode(guardian.dialCodePhone || '+57');
      setPhone(sanitizePhoneDigits(guardian.phone));
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

    setError('');
    setIsLoading(true);

    try {
      const response = await dispatch(UpdateKidGuardianPhone({
        id: guardian.id,
        dialCodePhone: dialCode,
        phone: cleanPhone,
        relation: guardian.relation as any,
        kidId: guardian.kidId,
      })).unwrap();

      // Si la API responde con un objeto de error explícito
      if (response && (response as any).error) {
        const msg = (response as any)?.message || 'El teléfono ingresado ya existe o no es válido';
        toast.error(msg);
        return;
      }

      toast.success(`Teléfono de ${guardian.fullName} actualizado`);
      // Actualizar la vista re-consultando el detalle del niño
      await dispatch(GetKid({ id: guardian.kidId }));
      onClose();
    } catch (err: any) {
      const errMsg = err?.message || err?.error || err?.response?.data?.message || 'Error al actualizar el teléfono';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <div className="bg-white rounded-2xl p-5 shadow-xl mx-auto w-full max-w-sm flex flex-col relative overflow-hidden">
        {/* Cabecera modal */}
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <PhoneInput 
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
