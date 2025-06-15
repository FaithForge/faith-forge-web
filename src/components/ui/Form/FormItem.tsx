import React from 'react';
import { useFormContext } from './FormContext';
import { Controller, RegisterOptions, useFormState } from 'react-hook-form';

interface FormItemProps {
  name: string;
  label?: string;
  rules?: RegisterOptions;
  children: React.ReactElement;
}

const FormItem: React.FC<FormItemProps> = ({ name, label, rules, children }) => {
  const { control } = useFormContext();
  const { errors } = useFormState({ control });
  const error = errors[name];

  return (
    <fieldset className="fieldset">
      {label && <legend className="fieldset-legend">{label}</legend>}

      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) =>
          React.cloneElement(children, {
            ...field,
            className: `${children.props.className} ${error ? 'border-red-500' : ''}`,
          })
        }
      />

      {error && <p className="text-sm text-red-600 mt-1">{error.message?.toString()}</p>}
    </fieldset>
  );
};

export default FormItem;
