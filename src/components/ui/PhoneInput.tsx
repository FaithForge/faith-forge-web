import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Drawer } from 'vaul';
import { Search, X, ChevronDown, Check } from 'lucide-react';

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

interface PhoneInputProps {
  dialCode: string;
  phone: string;
  onDialCodeChange: (code: string) => void;
  onPhoneChange: (phone: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

import { useModalBackClose } from '@/libs/hooks/useModalBackClose';

const DEFAULT_DIAL_CODE = '+57';

const PhoneInput: React.FC<PhoneInputProps> = ({
  dialCode = DEFAULT_DIAL_CODE,
  phone,
  onDialCodeChange,
  onPhoneChange,
  label = 'TELÉFONO MÓVIL',
  error,
  disabled = false,
  required = false,
  className,
}) => {
  const [open, setOpen] = useState(false);
  useModalBackClose(open, () => setOpen(false));
  const [search, setSearch] = useState('');

  const selectedCountry = useMemo(() => {
    const targetCode = dialCode || DEFAULT_DIAL_CODE;
    return (
      countryDialCodes.find((c) => c.code === targetCode) ||
      countryDialCodes.find((c) => c.code === DEFAULT_DIAL_CODE) ||
      countryDialCodes[0]
    );
  }, [dialCode]);

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return countryDialCodes;
    const q = search.toLowerCase().trim();
    return countryDialCodes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.includes(q) ||
        c.code.replace('+', '').includes(q)
    );
  }, [search]);

  return (
    <div className={twMerge(clsx('w-full', className))}>
      {label && (
        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Contenedor Unificado e Integrado */}
      <div
        className={twMerge(
          clsx(
            'flex items-center w-full rounded-xl border-2 bg-white transition-all overflow-hidden h-[48px] shadow-sm',
            error
              ? 'border-red-500 ring-1 ring-red-500'
              : 'border-gray-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20',
            disabled && 'bg-gray-100 text-gray-500 border-gray-200 opacity-80 cursor-not-allowed'
          )
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
              'flex items-center gap-1.5 px-3 h-full bg-gray-50/80 hover:bg-gray-100/90 border-r border-gray-200 text-text-main transition-colors shrink-0 outline-none active:bg-gray-200/60',
              disabled && 'cursor-not-allowed pointer-events-none'
            )
          )}
        >
          <span className="text-lg leading-none">{selectedCountry.flag}</span>
          <span className="font-bold text-sm text-gray-800 tracking-tight">{selectedCountry.code}</span>
          <ChevronDown size={14} className="text-gray-400 ml-0.5" />
        </button>

        {/* Input Numérico */}
        <input
          type="tel"
          value={phone}
          disabled={disabled}
          placeholder="300 123 4567"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={(e) => onPhoneChange(e.target.value)}
          className="w-full h-full px-3.5 bg-transparent text-text-main placeholder-gray-400 outline-none text-base font-semibold tracking-wide"
        />
      </div>

      {error && <span className="text-red-500 text-xs font-medium mt-1 inline-block">{error}</span>}

      {/* Drawer de Búsqueda de Indicativo */}
      <Drawer.Root handleOnly repositionInputs={false} open={open} onOpenChange={setOpen} nested>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 z-[10000]" />
          <Drawer.Content
            className="bg-gray-50 flex flex-col rounded-t-[24px] fixed bottom-0 left-0 right-0 z-[10001] outline-none max-h-[85dvh]"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {/* Header del Drawer */}
            <div className="w-full bg-white rounded-t-[24px] border-b border-gray-100 shadow-xs z-10 flex flex-col sticky top-0">
              {/* Title Row */}
              <div className="px-4 py-3.5 w-full flex items-center justify-between">
                <div className="w-8 shrink-0" />
                <h3 className="font-bold text-gray-800 text-base uppercase tracking-wide flex-1 text-center truncate px-2">
                  Seleccionar Indicativo
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 active:scale-95 transition-all shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Barra de Búsqueda */}
              <div className="px-4 pb-3 pt-1">
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-10 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-text-main focus:border-primary focus:bg-white transition-colors outline-none text-sm font-medium"
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
                        setOpen(false);
                        setSearch('');
                      }}
                      className={clsx(
                        'w-full flex items-center justify-between px-4 py-3.5 border-b border-gray-50 transition-colors last:border-0 rounded-xl',
                        isSelected
                          ? 'bg-primary/5 text-primary font-bold'
                          : 'text-gray-700 hover:bg-gray-50 font-medium'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl leading-none">{c.flag}</span>
                        <span className="text-sm">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={clsx('text-sm font-semibold', isSelected ? 'text-primary' : 'text-gray-500')}>
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
