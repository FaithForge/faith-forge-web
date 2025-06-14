import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormContext } from './FormContext';

interface FormProps {
  children: React.ReactNode;
  onSubmit: (data: any) => void;
  defaultValues?: Record<string, any>;
  className?: string;
}

const Form: React.FC<FormProps> = ({ children, onSubmit, defaultValues = {}, className }) => {
  const methods = useForm({ defaultValues, mode: 'onChange' });

  return (
    <FormContext.Provider value={methods}>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className={className}>
          {children}
        </form>
      </FormProvider>
    </FormContext.Provider>
  );
};

export default Form;
