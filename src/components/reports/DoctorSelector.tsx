import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Check, Loader2, Stethoscope } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { PersonSearchInput } from '@/components/ui/PersonSearchInput';
import { capitalizeWords, removeAccentsAndFormat } from '@/libs/utils/text';

export interface DoctorOption {
  id: string;
  fullName: string;
  photoUrl?: string | null;
  areaName?: string;
  code?: string | number;
}

export interface DoctorSelectorProps {
  selectedDoctorId: string;
  onSelectDoctor: (doctorId: string) => void;
  doctors: DoctorOption[];
  isLoading?: boolean;
}

/**
 * Filters available doctors by matching full name, area name, or code.
 *
 * @param {DoctorOption[]} doctors - Full list of doctor options.
 * @param {string} query - Raw search query string.
 * @returns {DoctorOption[]} Filtered doctors list.
 */
export const filterDoctors = (doctors: DoctorOption[], query: string): DoctorOption[] => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return doctors;

  const cleanDigits = normalizedQuery.replace(/[^0-9]/g, '');
  const cleanLetters = removeAccentsAndFormat(normalizedQuery).toLowerCase();

  return doctors.filter((doc) => {
    const cleanName = removeAccentsAndFormat(doc.fullName || '').toLowerCase();
    const cleanArea = removeAccentsAndFormat(doc.areaName || '').toLowerCase();
    const code = String(doc.code || '');

    const matchesName = cleanLetters.length > 0 && cleanName.includes(cleanLetters);
    const matchesArea = cleanLetters.length > 0 && cleanArea.includes(cleanLetters);
    const matchesCode = cleanDigits.length > 0 && code.includes(cleanDigits);

    return matchesName || matchesArea || matchesCode;
  });
};

/**
 * Reusable person-search selector for attending doctors and medical volunteers.
 *
 * @param {DoctorSelectorProps} props - Doctor list, selected ID, and callbacks.
 * @returns {JSX.Element} Rendered search input or selected doctor card.
 */
export const DoctorSelector: React.FC<DoctorSelectorProps> = ({
  selectedDoctorId,
  onSelectDoctor,
  doctors,
  isLoading = false,
}) => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDoctor = useMemo(
    () => doctors.find((doc) => doc.id === selectedDoctorId) || null,
    [doctors, selectedDoctorId],
  );

  const filteredDoctors = useMemo(
    () => filterDoctors(doctors, searchText),
    [doctors, searchText],
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    onSelectDoctor('');
    setSearchText('');
    setShowDropdown(true);
  };

  const handleSelect = (doc: DoctorOption) => {
    onSelectDoctor(doc.id);
    setSearchText('');
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="space-y-2 relative">
      {selectedDoctor ? (
        <PersonSearchInput
          label={t('reports.child_fields.doctor_label', {
            ns: 'kidChurch',
            defaultValue: '¿Qué médico lo atendió?',
          })}
          required
          badge={t('common.required', { ns: 'common', defaultValue: 'Obligatorio' })}
          searchValue=""
          onSearchChange={() => {}}
          selectedPerson={{
            name: capitalizeWords(selectedDoctor.fullName),
            code: selectedDoctor.code,
            photoUrl: selectedDoctor.photoUrl,
            tag: selectedDoctor.areaName,
            tagColor: 'primary',
            avatarFallback: <Stethoscope size={18} className="text-primary" />,
          }}
          onChangePerson={handleClear}
        />
      ) : (
        <PersonSearchInput
          label={t('reports.child_fields.doctor_label', {
            ns: 'kidChurch',
            defaultValue: '¿Qué médico lo atendió?',
          })}
          required
          badge={t('common.required', { ns: 'common', defaultValue: 'Obligatorio' })}
          placeholder={t('reports.child_fields.doctor_placeholder', {
            ns: 'kidChurch',
            defaultValue: 'Buscar médico por nombre...',
          })}
          searchValue={searchText}
          isLoading={isLoading}
          selectedPerson={null}
          onSearchChange={(val) => {
            setSearchText(val);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onClearSearch={() => {
            setSearchText('');
            setShowDropdown(true);
          }}
        >
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto no-scrollbar bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-1">
              {isLoading && filteredDoctors.length === 0 ? (
                <div className="p-4 flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                  <Loader2 size={15} className="animate-spin text-primary" />
                  <span>
                    {t('reports.child_fields.doctor_loading', {
                      ns: 'kidChurch',
                      defaultValue: 'Cargando médicos...',
                    })}
                  </span>
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="p-3 text-center text-xs text-gray-500 font-medium">
                  {t('reports.child_fields.doctor_no_results', {
                    ns: 'kidChurch',
                    defaultValue: 'No se encontraron médicos',
                  })}
                </div>
              ) : (
                filteredDoctors.map((doc) => {
                  const isSelected = doc.id === selectedDoctorId;
                  const fullName = capitalizeWords(doc.fullName);

                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => handleSelect(doc)}
                      className={clsx(
                        'w-full text-left p-2 rounded-xl flex items-center justify-between gap-2 transition-colors cursor-pointer',
                        isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-gray-100',
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          {doc.photoUrl ? (
                            <img
                              src={doc.photoUrl}
                              alt={fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Stethoscope size={15} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {fullName}
                          </p>
                          {doc.areaName && (
                            <p className="text-[10px] text-gray-500 truncate">
                              {doc.areaName}
                            </p>
                          )}
                        </div>
                      </div>
                      <Check
                        size={14}
                        className={clsx(
                          'shrink-0',
                          isSelected ? 'text-primary' : 'text-transparent',
                        )}
                      />
                    </button>
                  );
                })
              )}
            </div>
          )}
        </PersonSearchInput>
      )}
    </div>
  );
};
