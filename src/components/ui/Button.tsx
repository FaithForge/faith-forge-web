import React from 'react';
import { buttonThemeVars } from '@/libs/utils/theme';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'ghost' | 'default';

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

/**
 * Renders a consistent DaisyUI button with shared sizing, loading, and color variants.
 *
 * @param {ButtonProps} props - Button configuration and native button props.
 * @returns {JSX.Element} - A button element with the shared visual treatment.
 */
const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size,
  block = false,
  round = false,
  square = false,
  loading = false,
  loadingText,
  disabled,
  type = 'button',
  style,
  ...props
}) => {
  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };

  const variantTheme = buttonThemeVars[variant];

  const mergedStyle: React.CSSProperties = {
    ...style,
    '--ff-btn-bg': variantTheme.backgroundColor,
    '--ff-btn-border': variantTheme.borderColor,
    '--ff-btn-text': variantTheme.textColor,
    '--ff-btn-hover-bg': variantTheme.hoverBackgroundColor,
    '--ff-btn-hover-border': variantTheme.hoverBorderColor,
    '--ff-btn-height': size === 'sm' ? '32px' : size === 'lg' ? '50px' : '44px',
    '--ff-btn-font-size': size === 'sm' ? '14px' : size === 'lg' ? '16px' : '16px',
    '--ff-btn-line-height': '1.2',
    '--ff-btn-radius': round ? '9999px' : square ? '0' : '4px',
  } as React.CSSProperties;

  const buttonClasses = [
    'ff-btn',
    size ? sizeClasses[size] : '',
    block ? 'ff-btn--block' : '',
    round ? 'ff-btn--round' : '',
    square ? 'ff-btn--square' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} disabled={disabled || loading} className={buttonClasses} style={mergedStyle} {...props}>
      <span className="ff-btn__content">{loading ? loadingText ?? children : children}</span>
    </button>
  );
};

export default Button;