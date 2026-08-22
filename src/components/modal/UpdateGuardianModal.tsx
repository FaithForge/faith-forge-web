import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import ModalOverlay from '@/components/ui/ModalOverlay';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface UpdateGuardianModalProps {
  open: boolean;
  onClose: () => void;
  guardian: { name: string; phone: string; relation: string } | null;
}

interface FormValues {
  phone: string;
}

const UpdateGuardianModal: React.FC<UpdateGuardianModalProps> = ({ open, onClose, guardian }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  useEffect(() => {
    if (guardian) {
      reset({ phone: guardian.phone });
    }
  }, [guardian, reset]);

  const onSubmit = (data: FormValues) => {
    // Aquí se conectaría con Redux o el backend
    toast.success(`Datos de ${guardian?.name} actualizados`);
    onClose();
  };

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <div className="bg-white rounded-2xl p-5 shadow-xl mx-auto w-full max-w-sm flex flex-col relative overflow-hidden">
        {/* Cabecera modal */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Actualizar Acudiente</h3>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{guardian?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors outline-none">
            <X size={16} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
          <Input 
            label="Teléfono Móvil"
            type="tel"
            placeholder="Ej: +57 300 123 4567"
            error={errors.phone?.message}
            {...register('phone', { required: 'El teléfono es obligatorio' })}
          />

          <div className="flex gap-3 mt-2">
            <Button type="button" onClick={onClose} variant="secondary" className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
};

export default UpdateGuardianModal;
