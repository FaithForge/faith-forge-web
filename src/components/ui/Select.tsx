import React, { forwardRef } from 'react';
import { twMerge } from "tailwind-merge";
import clsx from 'clsx';
import { ChevronDown, Lock } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  fullWidth?: boolean;
  label?: string;
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, fullWidth = true, label, error, required, children, disabled, ...props }, ref) => {
    return (
      <div className={twMerge(clsx(fullWidth && 'w-full', className))}>
        {label && (
          <label
            className={clsx(
              'block text-xs font-bold mb-1.5 uppercase tracking-wide transition-colors',
              disabled ? 'text-gray-400' : 'text-gray-700'
            )}
          >
            {label} {required && <span className={disabled ? 'text-gray-300' : 'text-red-500'}>*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            required={required}
            disabled={disabled}
            className={twMerge(clsx(
              'block w-full rounded-xl border-2 border-gray-200 bg-white py-2.5 pl-3 pr-10 focus:border-primary focus:ring-0 outline-none text-base shadow-sm appearance-none transition-colors font-medium',
              'text-gray-900 [&>option]:text-gray-900 [&>option]:bg-white [&>option]:font-medium',
              'disabled:bg-gray-100/90 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed disabled:shadow-none',
              error && 'border-red-500 focus:border-red-500',
              className
            ))}
            {...props}
          >
            {children}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
            {disabled ? <Lock size={16} className="text-gray-400" /> : <ChevronDown size={20} />}
          </div>
        </div>
        {error && <span className="text-red-500 text-xs font-medium mt-1 inline-block">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
