import React, { forwardRef } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CheckCircle2 } from 'lucide-react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: React.ReactNode;
  rightHint?: string;
  fullWidth?: boolean;
  wrapperClassName?: string;
  showCount?: boolean;
  validationNotice?: React.ReactNode;
  showQualityBadge?: boolean;
}

/**
 * Standard reusable textarea component aligned with the design system primitives.
 * Features rounded-2xl modern card styling, theme-adaptive focus glow, right header hints,
 * quality indicators, and character counting.
 *
 * @param {TextareaProps} props - Component properties and standard textarea attributes.
 * @param {React.Ref<HTMLTextAreaElement>} ref - Forwarded reference to the textarea element.
 * @returns {JSX.Element} Rendered textarea component.
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      fullWidth = true,
      label,
      error,
      helperText,
      rightHint,
      required,
      wrapperClassName,
      rows = 4,
      showCount = false,
      maxLength,
      validationNotice,
      showQualityBadge,
      autoComplete = 'off',
      autoCorrect = 'off',
      autoCapitalize = 'off',
      spellCheck = false,
      ...props
    },
    ref,
  ) => {
    const charCount = props.value !== undefined ? String(props.value).length : 0;
    const isQualityApproved =
      showQualityBadge !== undefined
        ? showQualityBadge
        : charCount >= 20;

    return (
      <div className={twMerge(clsx(fullWidth && 'w-full', wrapperClassName))}>
        {(label || rightHint) && (
          <div className="flex items-center justify-between gap-2 mb-1.5">
            {label ? (
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
            ) : (
              <div />
            )}

            {rightHint && (
              <span className="text-xs text-gray-500 font-medium tracking-tight shrink-0">
                {rightHint}
              </span>
            )}
          </div>
        )}

        <div
          className={twMerge(
            clsx(
              'relative w-full rounded-2xl border bg-white p-3.5 shadow-2xs transition-all',
              error
                ? 'border-rose-300 ring-2 ring-rose-100 focus-within:border-rose-500 focus-within:ring-rose-200'
                : 'border-gray-200/90 hover:border-gray-300 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10',
              props.disabled &&
                'bg-gray-100/80 text-gray-500 border-gray-200 opacity-80 cursor-not-allowed',
            ),
          )}
        >
          <textarea
            ref={ref}
            rows={rows}
            required={required}
            maxLength={maxLength}
            autoComplete={autoComplete}
            autoCorrect={autoCorrect}
            autoCapitalize={autoCapitalize}
            spellCheck={spellCheck}
            className={twMerge(
              clsx(
                'block w-full bg-transparent border-0 p-0 text-base sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal outline-none focus:outline-none focus:ring-0 resize-none leading-relaxed',
                'disabled:cursor-not-allowed disabled:text-gray-500',
                className,
              ),
            )}
            {...props}
          />
        </div>

        {/* Footer info: quality notice + character count */}
        <div className="flex items-center justify-between gap-2 mt-2 px-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {error ? (
              <span className="text-rose-500 text-xs font-semibold">{error}</span>
            ) : validationNotice ? (
              <div className="text-xs">{validationNotice}</div>
            ) : isQualityApproved ? (
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium animate-in fade-in">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Redacción clara y comprensible</span>
              </div>
            ) : helperText ? (
              <div className="text-xs text-gray-500">{helperText}</div>
            ) : null}
          </div>

          {(showCount || maxLength !== undefined) && (
            <span className="text-xs text-gray-500 font-semibold shrink-0 font-mono">
              {charCount} {maxLength ? `/ ${maxLength}` : ''} caracteres
            </span>
          )}
        </div>
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export default Textarea;
