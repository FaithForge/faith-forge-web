import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { APP_ROUTES } from "@/config/routes";
import Input from "@/components/ui/Input";
import Button from '@/components/ui/Button';

interface IFormLoginInput {
  username: string;
  password: string;
}

const LoginView = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<IFormLoginInput>();

  const onSubmit: SubmitHandler<IFormLoginInput> = async (data) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      const username = data.username.toLowerCase().trim();
      
      if (username === 'error') {
        toast.error('Usuario o contraseña incorrectos');
      } else {
        toast.success('¡Bienvenido!');
        // Por ahora redirigimos al rol de registro
        navigate(APP_ROUTES.kidRegistration.root);
      }
    }, 1000);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-slate-50 px-6 animate-in fade-in duration-500 pb-safe overflow-hidden z-0">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-20%] w-96 h-96 bg-blue-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse -z-10" style={{ animationDuration: '4s' }}></div>
      <div className="absolute top-[10%] right-[-20%] w-96 h-96 bg-cyan-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse -z-10" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
      <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse -z-10" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
      
      <div className="w-full max-w-sm flex flex-col items-center z-10">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center">
          <img src="/logo-iglekids.png" alt="Iglekids Logo" className="w-64 h-auto drop-shadow-sm" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-4">Iniciar Sesión</h2>
          
          <Input 
            label="Usuario / Email"
            type="text" 
            placeholder="Ingresa tu usuario"
            error={errors.username?.message}
            {...register('username', { required: 'Este campo es obligatorio' })}
          />

          <Input 
            label="Contraseña"
            type="password" 
            placeholder="Ingresa tu contraseña"
            error={errors.password?.message}
            {...register('password', { 
              required: 'La contraseña es obligatoria',
              minLength: { value: 6, message: 'Mínimo 6 caracteres' } 
            })}
          />

          <Button 
            type="submit" 
            block 
            variant="primary" 
            loading={isLoading}
            loadingText="Ingresando..."
            className="mt-4"
          >
            Ingresar
          </Button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-400 font-medium">V 2.2.0 Beta</p>
      </div>
    </div>
  );
};

export default LoginView;
