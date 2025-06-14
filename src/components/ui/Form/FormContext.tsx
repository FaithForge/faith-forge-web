import { createContext, useContext } from 'react';
import { UseFormReturn } from 'react-hook-form';

export const FormContext = createContext<UseFormReturn<any> | null>(null);

export const useFormContext = () => {
  const ctx = useContext(FormContext);
  if (!ctx) {
    throw new Error('Form.Item debe estar dentro de Form');
  }
  return ctx;
};
