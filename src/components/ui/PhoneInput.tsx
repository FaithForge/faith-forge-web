import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Drawer } from 'vaul';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import {
  maskPhoneNumber,
  cleanPhoneDigits,
  getPhoneCountryConfig,
  getMaxPhoneDigits,
} from '@/libs/utils/phone';

export interface CountryDialCode {
  name: string;
  code: string;
  flag: string;
}

// Comprehensive list of recognized countries and dialing codes
export const countryDialCodes: CountryDialCode[] = [
  // Prioritarios
  { name: 'Colombia', code: '+57', flag: '🇨🇴' },
  { name: 'Venezuela', code: '+58', flag: '🇻🇪' },
  { name: 'Estados Unidos', code: '+1', flag: '🇺🇸' },
  { name: 'España', code: '+34', flag: '🇪🇸' },
  { name: 'México', code: '+52', flag: '🇲🇽' },
  { name: 'Ecuador', code: '+593', flag: '🇪🇨' },
  { name: 'Perú', code: '+51', flag: '🇵🇪' },
  { name: 'Chile', code: '+56', flag: '🇨🇱' },
  { name: 'Argentina', code: '+54', flag: '🇦🇷' },
  { name: 'Panamá', code: '+507', flag: '🇵🇦' },
  { name: 'Costa Rica', code: '+506', flag: '🇨🇷' },
  { name: 'República Dominicana', code: '+1', flag: '🇩🇴' },
  { name: 'Guatemala', code: '+502', flag: '🇬🇹' },
  { name: 'El Salvador', code: '+503', flag: '🇸🇻' },
  { name: 'Honduras', code: '+504', flag: '🇭🇳' },
  { name: 'Nicaragua', code: '+505', flag: '🇳🇮' },
  { name: 'Bolivia', code: '+591', flag: '🇧🇴' },
  { name: 'Paraguay', code: '+595', flag: '🇵🇾' },
  { name: 'Uruguay', code: '+598', flag: '🇺🇾' },
  { name: 'Brasil', code: '+55', flag: '🇧🇷' },
  { name: 'Canadá', code: '+1', flag: '🇨🇦' },
  { name: 'Puerto Rico', code: '+1', flag: '🇵🇷' },
  { name: 'Cuba', code: '+53', flag: '🇨🇺' },
  { name: 'Aruba', code: '+297', flag: '🇦🇼' },
  { name: 'Curazao', code: '+599', flag: '🇨🇼' },
  { name: 'Jamaica', code: '+1', flag: '🇯🇲' },
  { name: 'Trinidad y Tobago', code: '+1', flag: '🇹🇹' },

  // Europe
  { name: 'Alemania', code: '+49', flag: '🇩🇪' },
  { name: 'Austria', code: '+43', flag: '🇦🇹' },
  { name: 'Bélgica', code: '+32', flag: '🇧🇪' },
  { name: 'Dinamarca', code: '+45', flag: '🇩🇰' },
  { name: 'Francia', code: '+33', flag: '🇫🇷' },
  { name: 'Grecia', code: '+30', flag: '🇬🇷' },
  { name: 'Irlanda', code: '+353', flag: '🇮🇪' },
  { name: 'Italia', code: '+39', flag: '🇮🇹' },
  { name: 'Noruega', code: '+47', flag: '🇳🇴' },
  { name: 'Países Bajos', code: '+31', flag: '🇳🇱' },
  { name: 'Polonia', code: '+48', flag: '🇵🇱' },
  { name: 'Portugal', code: '+351', flag: '🇵🇹' },
  { name: 'Reino Unido', code: '+44', flag: '🇬🇧' },
  { name: 'Rusia', code: '+7', flag: '🇷🇺' },
  { name: 'Suecia', code: '+46', flag: '🇸🇪' },
  { name: 'Suiza', code: '+41', flag: '🇨🇭' },
  { name: 'Turquía', code: '+90', flag: '🇹🇷' },
  { name: 'Ucrania', code: '+380', flag: '🇺🇦' },

  // Asia and Middle East
  { name: 'Arabia Saudita', code: '+966', flag: '🇸🇦' },
  { name: 'China', code: '+86', flag: '🇨🇳' },
  { name: 'Corea del Sur', code: '+82', flag: '🇰🇷' },
  { name: 'Emiratos Árabes Unidos', code: '+971', flag: '🇦🇪' },
  { name: 'Filipinas', code: '+63', flag: '🇵🇭' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'Israel', code: '+972', flag: '🇮🇱' },
  { name: 'Japón', code: '+81', flag: '🇯🇵' },
  { name: 'Jordania', code: '+962', flag: '🇯🇴' },
  { name: 'Líbano', code: '+961', flag: '🇱🇧' },
  { name: 'Qatar', code: '+974', flag: '🇶🇦' },
  { name: 'Singapur', code: '+65', flag: '🇸🇬' },

  // Oceania y África
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Nueva Zelanda', code: '+64', flag: '🇳🇿' },
  { name: 'Egipto', code: '+20', flag: '🇪🇬' },
  { name: 'Marruecos', code: '+212', flag: '🇲🇦' },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { name: 'Sudáfrica', code: '+27', flag: '🇿🇦' },
];

export interface PhoneInputProps {
  dialCode: string;
  phone: string;
  onDialCodeChange: (code: string) => void;
  onPhoneChange: (phone: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  helperNotice?: React.ReactNode;
  helperText?: React.ReactNode;
  showNotice?: boolean;
}

const DEFAULT_DIAL_CODE = '+57';

/**
 * Standard reusable PhoneInput component with country dial code drawer,
 * formatted masking, clear button, and WhatsApp integration notice.
 *
 * @param {PhoneInputProps} props - Phone value, handlers, and optional config.
 * @returns {JSX.Element} Rendered telephone input card.
 */
const PhoneInput: React.FC<PhoneInputProps> = ({
  dialCode = DEFAULT_DIAL_CODE,
  phone,
  onDialCodeChange,
  onPhoneChange,
  label = 'Teléfono Móvil / WhatsApp',
  error,
  disabled = false,
  required = false,
  className,
  helperNotice,
  helperText,
  showNotice = true,
}) => {
  const [open, setOpen] = useState(false);
  useModalBackClose(open, () => setOpen(false));
  const [search, setSearch] = useState('');

  const targetCode = dialCode || DEFAULT_DIAL_CODE;
  const countryConfig = useMemo(() => getPhoneCountryConfig(targetCode), [targetCode]);
  const displayPhone = useMemo(() => maskPhoneNumber(phone, targetCode), [phone, targetCode]);

  const selectedCountry = useMemo(() => {
    return (
      countryDialCodes.find((c) => c.code === targetCode) ||
      countryDialCodes.find((c) => c.code === DEFAULT_DIAL_CODE) ||
      countryDialCodes[0]
    );
  }, [targetCode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const maxDigits = getMaxPhoneDigits(targetCode);
    const clean = cleanPhoneDigits(raw, targetCode).slice(0, maxDigits);
    onPhoneChange(clean);
  };

  const handleClear = () => {
    if (disabled) return;
    onPhoneChange('');
  };

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return countryDialCodes;
    const q = search.toLowerCase().trim();
    return countryDialCodes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.includes(q) ||
        c.code.replace('+', '').includes(q),
    );
  }, [search]);

  return (
    <div className={twMerge(clsx('w-full group', className))}>
      {label && (
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <label
            className={clsx(
              'block text-xs font-bold uppercase tracking-wide transition-colors',
              disabled ? 'text-gray-400' : 'text-gray-700',
            )}
          >
            {label.replace(/\s*\((?:opcional|Opcional)\)/i, '')}
            {/\((?:opcional|Opcional)\)/i.test(label) && (
              <span className="text-gray-400 font-medium normal-case tracking-normal ml-1">
                (opcional)
              </span>
            )}
          </label>

          {required && (
            <span className="text-rose-600 text-[11px] font-black uppercase tracking-wider shrink-0">
              * OBLIGATORIO
            </span>
          )}
        </div>
      )}

      {/* Contenedor Unificado e Integrado */}
      <div
        className={twMerge(
          clsx(
            'flex items-center w-full rounded-2xl border bg-white p-1.5 sm:p-2 shadow-2xs transition-all gap-2 min-h-[50px]',
            error
              ? 'border-rose-300 ring-2 ring-rose-100 focus-within:border-rose-500 focus-within:ring-rose-200'
              : 'border-gray-200/90 hover:border-gray-300 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10',
            disabled &&
              'bg-gray-100/80 text-gray-500 border-gray-200 opacity-80 cursor-not-allowed',
          ),
        )}
      >
        {/* Selector de Indicativo Integrado */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setSearch('');
            setOpen(true);
          }}
          className={twMerge(
            clsx(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 text-gray-800 transition-colors shrink-0 outline-none cursor-pointer',
              disabled && 'cursor-not-allowed pointer-events-none opacity-60',
            ),
          )}
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span className="font-bold text-sm text-gray-800 tracking-tight">
            {selectedCountry.code}
          </span>
          <ChevronDown size={14} className="text-gray-400 ml-0.5" />
        </button>

        {/* Input Numérico */}
        <input
          type="tel"
          value={displayPhone}
          disabled={disabled}
          placeholder={countryConfig?.placeholder || '300 123 4567'}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={handleInputChange}
          className="w-full bg-transparent border-0 p-0 text-base sm:text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal outline-none focus:outline-none focus:ring-0 tracking-wide"
        />

        {/* Botón de limpiar */}
        {phone && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="mr-1 text-gray-400 hover:text-gray-600 transition-colors shrink-0 cursor-pointer"
            tabIndex={-1}
            aria-label="Limpiar teléfono"
          >
            <div className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-transform active:scale-90">
              <X size={12} strokeWidth={2.5} />
            </div>
          </button>
        )}
      </div>

      {error && (
        <span className="text-rose-500 text-xs font-semibold mt-1.5 inline-block pl-0.5">
          {error}
        </span>
      )}

      {/* Notice / Helper text */}
      {showNotice && (helperNotice || helperText) && !error && (
        <p className="text-xs text-gray-500 mt-1 pl-0.5 leading-snug">
          {helperNotice || helperText}
        </p>
      )}

      {/* Drawer de Búsqueda de Indicativo */}
      <Drawer.Root repositionInputs={false} open={open} onOpenChange={setOpen} nested>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 z-[10000]" />
          <Drawer.Content
            className="bg-gray-50 flex flex-col rounded-t-[24px] fixed bottom-0 left-0 right-0 z-[10001] outline-none max-h-[85dvh]"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {/* Header del Drawer */}
            <div className="w-full bg-white rounded-t-[24px] border-b border-gray-100 shadow-xs z-10 flex flex-col sticky top-0">
              {/* Title Row */}
              <div className="px-4 py-3.5 w-full flex items-center justify-between select-none cursor-grab active:cursor-grabbing touch-pan-y shrink-0">
                <div className="w-8 shrink-0" />
                <Drawer.Title className="font-bold text-gray-800 text-base uppercase tracking-wide flex-1 text-center truncate px-2">
                  Seleccionar Indicativo
                </Drawer.Title>
                <button
                  type="button"
                  data-vaul-no-drag=""
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Barra de Búsqueda */}
              <div data-vaul-no-drag="" className="px-4 pb-3 pt-1">
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-10 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:bg-white transition-colors outline-none text-sm font-medium"
                    placeholder="Buscar país o indicativo (+57, Colombia)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    autoFocus
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                      aria-label="Limpiar búsqueda"
                    >
                      <div className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-transform active:scale-90">
                        <X size={12} strokeWidth={2.5} />
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Lista de Países */}
            <div className="overflow-y-auto flex-1 p-2 pb-safe bg-white min-h-[40vh]">
              {filteredCountries.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-medium text-sm">
                  No se encontraron países
                </div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = c.code === dialCode && c.name === selectedCountry.name;
                  return (
                    <button
                      key={`${c.name}-${c.code}`}
                      type="button"
                      onClick={() => {
                        onDialCodeChange(c.code);
                        const newMax = getMaxPhoneDigits(c.code);
                        const reCleaned = cleanPhoneDigits(phone, c.code).slice(0, newMax);
                        if (reCleaned !== phone) {
                          onPhoneChange(reCleaned);
                        }
                        setOpen(false);
                        setSearch('');
                      }}
                      className={clsx(
                        'w-full flex items-center justify-between px-4 py-3.5 border-b border-gray-50 transition-colors last:border-0 rounded-xl cursor-pointer',
                        isSelected
                          ? 'bg-primary/5 text-primary font-bold'
                          : 'text-gray-700 hover:bg-gray-50 font-medium',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl leading-none">{c.flag}</span>
                        <span className="text-sm">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            'text-sm font-semibold',
                            isSelected ? 'text-primary' : 'text-gray-500',
                          )}
                        >
                          {c.code}
                        </span>
                        {isSelected && <Check size={16} className="text-primary" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
};

export default PhoneInput;
