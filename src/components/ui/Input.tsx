import React, { forwardRef, useState } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Search, X, Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: 'search' | 'none'; 
  fullWidth?: boolean;
  label?: string;
  error?: string;
  wrapperClassName?: string;
  onClear?: () => void;
  showPasswordToggle?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type,
    icon = 'none', 
    fullWidth = true, 
    label, 
    error, 
    required, 
    wrapperClassName,
    autoComplete = 'off',
    autoCorrect = 'off',
    autoCapitalize = 'off',
    spellCheck = false,
    onClear,
    showPasswordToggle = true,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === 'password';
    const resolvedType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

    const hasValue = props.value !== undefined && String(props.value).length > 0;
    const showClearButton = Boolean(onClear && hasValue && !props.disabled && !isPasswordType);
    const showEyeButton = Boolean(isPasswordType && showPasswordToggle);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      props.onFocus?.(e);
      const target = e.currentTarget;
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }, 150);
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }, 350);
    };

    return (
      <div className={twMerge(clsx(fullWidth && 'w-full', wrapperClassName))}>
        {label && (
          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {icon === 'search' && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
          )}
          <input
            ref={ref}
            type={resolvedType}
            required={required}
            autoComplete={autoComplete}
            autoCorrect={autoCorrect}
            autoCapitalize={autoCapitalize}
            spellCheck={spellCheck}
            onFocus={handleFocus}
            className={twMerge(clsx(
              'block w-full rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 placeholder:font-normal font-medium py-2.5 focus:border-primary focus:ring-0 outline-none text-base shadow-sm transition-colors',
              'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed disabled:border-gray-200 disabled:opacity-80',
              icon === 'search' ? 'pl-10' : 'pl-3',
              (showClearButton || showEyeButton) ? 'pr-10' : 'pr-3',
              error && 'border-red-500 focus:border-red-500',
              className
            ))}
            {...props}
          />
          {showClearButton && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear?.();
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
              aria-label="Limpiar campo"
            >
              <div className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-transform active:scale-90">
                <X size={12} strokeWidth={2.5} />
              </div>
            </button>
          )}
          {showEyeButton && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPassword((prev) => !prev);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && <span className="text-red-500 text-xs font-medium mt-1 inline-block">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
