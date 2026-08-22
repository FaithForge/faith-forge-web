import React, { forwardRef } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Search } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: 'search' | 'none'; 
  fullWidth?: boolean;
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon = 'none', fullWidth = true, label, error, required, wrapperClassName, ...props }, ref) => {
    return (
      <div className={twMerge(clsx('mb-4', fullWidth && 'w-full', wrapperClassName))}>
        {label && (
          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          {icon === 'search' && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
          )}
          <input
            ref={ref}
            required={required}
            className={twMerge(clsx(
              'block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-2.5 focus:border-primary focus:ring-0 outline-none text-base shadow-sm transition-colors',
              icon === 'search' ? 'pl-10 pr-3' : 'px-3',
              error && 'border-red-500 focus:border-red-500',
              className
            ))}
            {...props}
          />
        </div>
        {error && <span className="text-red-500 text-xs font-medium mt-1 inline-block">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
