import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Search, X, RotateCcw, Loader2, User } from 'lucide-react';

export interface SelectedPersonItem {
  id?: string;
  name: string;
  code?: string | number;
  photoUrl?: string | null;
  tag?: string;
  tagColor?: 'emerald' | 'primary' | 'blue' | 'amber';
  avatarFallback?: React.ReactNode;
}

export interface PersonSearchInputProps {
  label?: string;
  required?: boolean;
  badge?: string;
  placeholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onClearSearch?: () => void;
  isLoading?: boolean;
  selectedPerson: SelectedPersonItem | null;
  onChangePerson?: () => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  onFocus?: () => void;
  children?: React.ReactNode;
}

/**
 * Standard reusable person/child search input component matching the design specifications.
 * Seamlessly transitions between an active search input card and an enriched selected person card
 * with photo avatar, code badge, category tag with dot indicator, and reload/change action.
 *
 * @param {PersonSearchInputProps} props - Component properties and callbacks.
 * @returns {JSX.Element} Rendered search input or selected person preview card.
 */
export const PersonSearchInput: React.FC<PersonSearchInputProps> = ({
  label,
  required,
  badge = 'Obligatorio',
  placeholder = 'Buscar por nombre o código...',
  searchValue,
  onSearchChange,
  onClearSearch,
  isLoading = false,
  selectedPerson,
  onChangePerson,
  error,
  disabled = false,
  className,
  onFocus,
  children,
}) => {
  return (
    <div className={twMerge(clsx('w-full group space-y-1.5', className))}>
      {/* Header with label and requirement pill badge */}
      {(label || badge) && (
        <div className="flex items-center justify-between gap-2 mb-1.5">
          {label ? (
            <label
              className={clsx(
                'block text-xs font-bold uppercase tracking-wide transition-colors',
                disabled ? 'text-gray-400' : 'text-gray-700',
              )}
            >
              {label}
              {required && (
                <span className={disabled ? 'text-gray-300' : 'text-rose-500 font-black'}>
                  {' '}
                  *
                </span>
              )}
            </label>
          ) : (
            <div />
          )}

          {badge && (
            <span
              className={clsx(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors shrink-0',
                required
                  ? 'bg-primary/5 text-primary border-primary/15'
                  : 'bg-gray-100 text-gray-600 border-gray-200',
              )}
            >
              {badge}
            </span>
          )}
        </div>
      )}

      {/* When a person is selected, display the enriched card */}
      {selectedPerson ? (
        <div
          className={twMerge(
            clsx(
              'p-3 sm:p-3.5 bg-white border rounded-2xl shadow-2xs flex items-center justify-between gap-3 transition-all',
              error
                ? 'border-rose-300 ring-2 ring-rose-100'
                : 'border-gray-200/90 hover:border-primary/40',
              disabled && 'opacity-70 pointer-events-none',
            ),
          )}
        >
          {/* Avatar and metadata */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Circular Avatar */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-gray-100 shrink-0 bg-primary/10 flex items-center justify-center">
              {selectedPerson.photoUrl ? (
                <img
                  src={selectedPerson.photoUrl}
                  alt={selectedPerson.name}
                  className="w-full h-full object-cover"
                />
              ) : selectedPerson.avatarFallback ? (
                selectedPerson.avatarFallback
              ) : (
                <User size={20} className="text-primary" />
              )}
            </div>

            {/* Name + Code + Tag */}
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                  {selectedPerson.name}
                </p>
                {selectedPerson.code && (
                  <span className="bg-gray-100 text-gray-700 font-bold text-[11px] px-2 py-0.5 rounded-md shrink-0">
                    #{String(selectedPerson.code).replace(/^#/, '')}
                  </span>
                )}
              </div>

              {selectedPerson.tag && (
                <div className="flex items-center">
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                      selectedPerson.tagColor === 'primary'
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
                    )}
                  >
                    <span
                      className={clsx(
                        'w-2 h-2 rounded-full shrink-0',
                        selectedPerson.tagColor === 'primary' ? 'bg-primary' : 'bg-emerald-500',
                      )}
                    />
                    <span>{selectedPerson.tag}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Change/Reload button on the right */}
          {onChangePerson && !disabled && (
            <button
              type="button"
              onClick={onChangePerson}
              className="w-10 h-10 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              aria-label="Cambiar selección"
              title="Cambiar selección"
            >
              <RotateCcw size={17} strokeWidth={2.2} />
            </button>
          )}
        </div>
      ) : (
        /* Search Input Card when searching */
        <div className="relative">
          <div
            className={twMerge(
              clsx(
                'relative flex items-center w-full rounded-2xl border bg-white px-3 py-2.5 sm:py-3 shadow-2xs transition-all gap-2.5',
                error
                  ? 'border-rose-300 ring-2 ring-rose-100 focus-within:border-rose-500 focus-within:ring-rose-200'
                  : 'border-gray-200/90 hover:border-gray-300 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10',
                disabled &&
                  'bg-gray-100/80 text-gray-500 border-gray-200 opacity-80 cursor-not-allowed',
              ),
            )}
          >
            <Search
              size={19}
              className="text-gray-400 group-focus-within:text-primary transition-colors shrink-0"
            />

            <input
              type="text"
              value={searchValue}
              disabled={disabled}
              placeholder={placeholder}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={onFocus}
              onClick={onFocus}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="block w-full bg-transparent border-0 p-0 text-base sm:text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal outline-none focus:outline-none focus:ring-0 shadow-none"
            />

            {isLoading && (
              <Loader2 size={18} className="animate-spin text-primary shrink-0" />
            )}

            {searchValue && !isLoading && !disabled && (
              <button
                type="button"
                onClick={onClearSearch}
                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 cursor-pointer"
                tabIndex={-1}
                aria-label="Limpiar búsqueda"
              >
                <div className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-transform active:scale-90">
                  <X size={12} strokeWidth={2.5} />
                </div>
              </button>
            )}
          </div>

          {/* Search results dropdown container if provided */}
          {children}
        </div>
      )}

      {error && (
        <span className="text-rose-500 text-xs font-semibold mt-1 inline-block pl-0.5">
          {error}
        </span>
      )}
    </div>
  );
};

export default PersonSearchInput;
