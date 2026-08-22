import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'ghost' | 'default' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  round?: boolean;
  square?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', block = false, round = false, square = false, loading = false, loadingText, children, disabled, type = 'button', ...props }, ref) => {
    
    const variantClasses: Record<ButtonVariant, string> = {
      primary: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
      secondary: 'bg-amber-500 text-white shadow-sm hover:bg-amber-600',
      success: 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600',
      ghost: 'hover:bg-gray-100 hover:text-gray-900',
      default: 'bg-white text-gray-700 border-2 border-gray-200 shadow-sm hover:bg-gray-50',
      danger: 'bg-red-500 text-white shadow-sm hover:bg-red-600',
    };

    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-11 px-4 py-2 text-base',
      lg: 'h-14 px-8 text-lg',
    };

    const buttonClasses = twMerge(
      clsx(
        'inline-flex items-center justify-center whitespace-nowrap rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95 transition-transform',
        variantClasses[variant],
        sizeClasses[size],
        block && 'w-full',
        round && 'rounded-full',
        square && 'aspect-square p-0',
        className
      )
    );

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={buttonClasses}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {loadingText && <span>{loadingText}</span>}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;