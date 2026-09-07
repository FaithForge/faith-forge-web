import React from 'react';
import clsx from 'clsx';
import { AlertTriangle } from 'lucide-react';
import { formatPhoneDisplay, validatePhoneNumber, isPhoneValid } from '@/libs/utils/phone';

export interface PhoneDisplayProps {
  phone?: string;
  dialCode?: string;
  showWarning?: boolean;
  warningText?: string;
  className?: string;
  phoneClassName?: string;
  warningClassName?: string;
  emptyFallback?: string;
}

/**
 * Renders a phone number formatted with its country mask and dial code.
 * If the phone number is invalid according to country rules (e.g. legacy database records),
 * displays a non-intrusive warning badge so users are notified that it needs updating.
 *
 * @param {PhoneDisplayProps} props - Component properties.
 * @returns {React.ReactElement | null} Rendered element.
 */
export const PhoneDisplay: React.FC<PhoneDisplayProps> = ({
  phone,
  dialCode = '+57',
  showWarning = true,
  warningText = 'Teléfono errado',
  className,
  phoneClassName,
  warningClassName,
  emptyFallback = '-',
}) => {
  if (!phone || !phone.trim()) {
    return <span className={className}>{emptyFallback}</span>;
  }

  const formatted = formatPhoneDisplay(phone, dialCode);
  const validation = validatePhoneNumber(phone, dialCode);
  const isInvalid = !validation.isValid;

  return (
    <div className={clsx('inline-flex items-center gap-1.5 flex-wrap', className)}>
      <span className={clsx('font-medium tracking-tight', phoneClassName)}>
        {formatted}
      </span>

      {showWarning && isInvalid && (
        <span
          className={clsx(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200/80 shrink-0',
            warningClassName
          )}
          title={validation.error || 'Formato de teléfono errado para este país'}
        >
          <AlertTriangle size={11} className="text-amber-600 shrink-0" />
          <span>{warningText}</span>
        </span>
      )}
    </div>
  );
};

export default PhoneDisplay;
