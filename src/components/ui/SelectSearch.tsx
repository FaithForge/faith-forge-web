import React, { useState, useMemo } from 'react';
import { Drawer } from 'vaul';
import { Search, X, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SelectorOption } from '@/libs/common-types/global';

interface SelectSearchProps {
  label: string;
  options: SelectorOption[]; // Array of { id, name }
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  valueKey?: 'id' | 'name';
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
}

const SelectSearch = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Buscar...',
  error,
  required,
  valueKey = 'id',
  className,
  disabled = false,
  searchable
}: SelectSearchProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Solo mostrar barra de búsqueda si se indica explícitamente o si hay más de 5 opciones
  const isSearchable = searchable !== undefined ? searchable : options.length > 5;

  const filteredOptions = useMemo(() => {
    if (!isSearchable || !search.trim()) return options;
    return options.filter(opt => opt.name.toLowerCase().includes(search.toLowerCase()));
  }, [options, search, isSearchable]);

  const selectedOption = options.find(opt => String(opt.id) === String(value) || opt.name === value);
  const displayText = selectedOption ? selectedOption.name : 'Seleccionar...';

  return (
    <div className={twMerge(clsx("w-full", className))}>
      {label && (
        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* Trigger Button */}
      <div className={clsx("relative w-full", disabled ? "cursor-not-allowed pointer-events-none" : "cursor-pointer")}>
        <input
          type="text"
          readOnly
          disabled={disabled}
          placeholder={placeholder}
          value={selectedOption ? selectedOption.name : ''}
          className={clsx(
            "w-full rounded-xl border-2 py-2.5 pl-3 pr-10 transition-colors outline-none text-base shadow-sm",
            error ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-primary",
            disabled ? "cursor-not-allowed bg-gray-100 text-gray-500 border-gray-200 opacity-80" : "cursor-pointer bg-white text-text-main"
          )}
          onFocus={(e) => {
            e.target.blur();
            if (!disabled) setOpen(true);
          }}
          onClick={() => !disabled && setOpen(true)}
        />
        <ChevronDown size={20} className={clsx("absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none", disabled ? "text-gray-300" : "text-gray-400")} />
      </div>

      {error && <span className="text-red-500 text-xs font-medium mt-1 inline-block">{error}</span>}

      <Drawer.Root open={open} onOpenChange={setOpen} nested>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[200]" />
          <Drawer.Content 
            className="bg-gray-50 flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-[201] outline-none max-h-[85vh]"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <div className={clsx(
              "p-4 bg-white rounded-t-[20px] border-b border-gray-100 shadow-sm z-10 flex flex-col",
              isSearchable ? "gap-4" : "gap-1"
            )}>
              <div className="flex items-center justify-between">
                <div className="w-8" />
                <div className="flex flex-col items-center">
                  <div className="w-12 h-1.5 rounded-full bg-gray-300 mb-2" />
                  <h3 className="font-bold text-gray-800 text-lg uppercase tracking-wide">
                    {label}
                  </h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setOpen(false)} 
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Bar sólo cuando es necesario */}
              {isSearchable && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-text-main focus:border-primary focus:ring-0 transition-colors outline-none text-base"
                    placeholder={placeholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                </div>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 p-2 pb-safe bg-white min-h-[30vh]">
              {filteredOptions.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-medium">
                  No se encontraron resultados
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = String(opt.id) === String(value) || opt.name === value;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onChange?.(String(opt[valueKey]));
                        setOpen(false);
                        setSearch(''); // reset search on select
                      }}
                      className={clsx(
                        "w-full text-left px-4 py-4 border-b border-gray-50 transition-colors last:border-0",
                        isSelected ? "bg-primary/5 text-primary font-bold" : "text-gray-700 hover:bg-gray-50 font-medium"
                      )}
                    >
                      {opt.name}
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

export default SelectSearch;
