import React, { forwardRef, useState } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Search, X, Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: 'search' | 'none';
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  fullWidth?: boolean;
  label?: string;
  error?: string;
  helperText?: React.ReactNode;
  badge?: React.ReactNode;
  wrapperClassName?: string;
  onClear?: () => void;
  showPasswordToggle?: boolean;
}

/**
 * Standard reusable single-line input primitive matching design specifications.
 * Fully theme-adaptive with rounded-2xl container, subtle borders, focus glow, and clear actions.
 *
 * @param {InputProps} props - Input configuration, label, icons, and validation props.
 * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref to the underlying HTML input.
 * @returns {JSX.Element} Rendered input element with integrated label and wrapper.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      icon = 'none',
      leftIcon,
      rightElement,
      fullWidth = true,
      label,
      error,
      helperText,
      badge,
      required,
      wrapperClassName,
      autoComplete = 'off',
      autoCorrect = 'off',
      autoCapitalize = 'off',
      spellCheck = false,
      onClear,
      showPasswordToggle = true,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === 'password';
    const resolvedType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

    const hasValue = props.value !== undefined && String(props.value).length > 0;
    const showClearButton = Boolean(onClear && hasValue && !props.disabled && !isPasswordType);
    const showEyeButton = Boolean(isPasswordType && showPasswordToggle);

    // Resolve left icon
    const resolvedLeftIcon =
      leftIcon || (icon === 'search' ? <Search size={18} className="text-gray-400 group-focus-within:text-primary transition-colors" /> : null);

    return (
      <div className={twMerge(clsx(fullWidth && 'w-full', 'group', wrapperClassName))}>
        {label && (
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label
              className={clsx(
                'block text-xs font-bold uppercase tracking-wide transition-colors',
                props.disabled ? 'text-gray-400' : 'text-gray-700',
              )}
            >
              {label.replace(/\s*\((?:opcional|Opcional)\)/i, '')}
              {/\((?:opcional|Opcional)\)/i.test(label) && (
                <span className="text-gray-400 font-medium normal-case tracking-normal ml-1">
                  (opcional)
                </span>
              )}
              {required && (
                <span className={props.disabled ? 'text-gray-300' : 'text-rose-500 font-black'}>
                  {' '}
                  *
                </span>
              )}
            </label>

            {badge && <div className="shrink-0">{badge}</div>}
          </div>
        )}

        <div
          className={twMerge(
            clsx(
              'relative flex items-center w-full rounded-2xl border bg-white px-3 py-2.5 sm:py-3 shadow-2xs transition-all',
              error
                ? 'border-rose-300 ring-2 ring-rose-100 focus-within:border-rose-500 focus-within:ring-rose-200'
                : 'border-gray-200/90 hover:border-gray-300 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10',
              props.disabled &&
                'bg-gray-100/80 text-gray-500 border-gray-200 opacity-80 cursor-not-allowed',
            ),
          )}
        >
          {resolvedLeftIcon && (
            <div className="shrink-0 mr-2.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
              {resolvedLeftIcon}
            </div>
          )}

          {/* Inner input stripped of legacy box/shadow artifacts */}
          <input
            ref={ref}
            type={resolvedType}
            required={required}
            autoComplete={autoComplete}
            autoCorrect={autoCorrect}
            autoCapitalize={autoCapitalize}
            spellCheck={spellCheck}
            className={twMerge(
              'block w-full bg-transparent border-0 p-0 text-base sm:text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal outline-none focus:outline-none focus:ring-0 shadow-none',
              'disabled:cursor-not-allowed disabled:text-gray-500',
              className?.replace(/\b(shadow-\S+|shadow|border-\S+|border|rounded-\S+|rounded|bg-\S+)\b/g, '').trim(),
            )}
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
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors shrink-0 cursor-pointer"
              tabIndex={-1}
              aria-label="Limpiar campo"
            >
              <div className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-transform active:scale-90">
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
              className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors shrink-0 cursor-pointer"
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}

          {rightElement && <div className="ml-2 shrink-0">{rightElement}</div>}
        </div>

        {error && (
          <span className="text-rose-500 text-xs font-semibold mt-1.5 inline-block pl-0.5">
            {error}
          </span>
        )}

        {helperText && !error && (
          <div className="text-xs text-gray-500 mt-1 pl-0.5">{helperText}</div>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
