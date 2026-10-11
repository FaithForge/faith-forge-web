import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Check, Loader2 } from 'lucide-react';
import { FaChild, FaChildDress } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { IKid, IKidGuardian, KID_RELATION_CODE_MAPPER } from '@/libs/models';
import { useAppSelector } from '@/libs/state/redux/hooks';
import {
  useGetKidGroupAttendanceQuery,
  useGetKidQuery,
} from '@/libs/state/redux/api/kidChurchApi';
import { searchKidsForTransfer } from '@/services/kidService';
import {
  capitalizeWords,
  formatPersonShortName,
  removeAccentsAndFormat,
} from '@/libs/utils/text';
import clsx from 'clsx';
import { PersonSearchInput } from '@/components/ui/PersonSearchInput';

interface KidSelectorProps {
  selectedKid: IKid | null;
  onSelectKid: (kid: IKid | null) => void;
  churchMeetingId?: string;
  date?: string;
  showGuardiansPreview?: boolean;
}

/**
 * Global reusable selector to search and pick a registered child.
 * When churchMeetingId is active, it strictly scopes results to children registered in the service.
 *
 * @param {KidSelectorProps} props - Selection state, handlers, and meeting context.
 * @returns {JSX.Element} Rendered child selector component.
 */
/**
 * Filters registered kids by matching full name (accent-insensitive) or FaithForge code.
 *
 * @param {IKid[]} kids - List of registered kids in the meeting.
 * @param {string} query - Raw search query string.
 * @returns {IKid[]} Matching kids list.
 */
export const filterRegisteredKids = (kids: IKid[], query: string): IKid[] => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return kids;

  const cleanDigits = normalizedQuery.replace(/[^0-9]/g, '');
  const cleanLetters = removeAccentsAndFormat(normalizedQuery).toLowerCase();

  return kids.filter((kid) => {
    const fullName = `${kid.firstName || ''} ${kid.lastName || ''}`;
    const cleanFullName = removeAccentsAndFormat(fullName).toLowerCase();
    const code = String(kid.faithForgeId || '');

    const matchesName = cleanLetters.length > 0 && cleanFullName.includes(cleanLetters);
    const matchesCode = cleanDigits.length > 0 && code.includes(cleanDigits);

    return matchesName || matchesCode;
  });
};

export const KidSelector: React.FC<KidSelectorProps> = ({
  selectedKid,
  onSelectKid,
  churchMeetingId,
  date,
  showGuardiansPreview = true,
}) => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const token = useAppSelector((state) => state.authSlice.token);

  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [apiSearchResults, setApiSearchResults] = useState<IKid[]>([]);
  const [isApiSearching, setIsApiSearching] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const effectiveDate = useMemo(() => date || dayjs().format('YYYY-MM-DD'), [date]);

  // Query live registered attendance for the active meeting
  const {
    data: rawRegisteredKids,
    isLoading: loadingRegisteredKids,
  } = useGetKidGroupAttendanceQuery(
    {
      date: effectiveDate,
      churchMeetingId,
    },
    {
      skip: !churchMeetingId,
    },
  );

  const registeredKids: IKid[] = useMemo(() => {
    if (!churchMeetingId) return [];
    if (Array.isArray(rawRegisteredKids)) return rawRegisteredKids;
    if (typeof rawRegisteredKids === 'string') {
      try {
        const parsed = JSON.parse(rawRegisteredKids);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [rawRegisteredKids, churchMeetingId]);

  // Ensure the selected child has complete relations and check-in registration
  const shouldFetchFullKid = Boolean(
    selectedKid?.id && (!selectedKid?.relations || selectedKid.relations.length === 0),
  );

  const { data: fullKid, isLoading: loadingFullKid } = useGetKidQuery(
    { id: selectedKid?.id || '', registrationChurchMeetingId: churchMeetingId },
    { skip: !shouldFetchFullKid },
  );

  useEffect(() => {
    if (fullKid && fullKid.id === selectedKid?.id && fullKid !== selectedKid) onSelectKid(fullKid);
  }, [fullKid, selectedKid, onSelectKid]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Local synchronous filter over meeting registered kids
  const localFilteredKids = useMemo(() => {
    if (!churchMeetingId) return [];
    return filterRegisteredKids(registeredKids, searchText);
  }, [churchMeetingId, registeredKids, searchText]);

  // Debounced API search when local results are empty or outside meeting
  useEffect(() => {
    const trimmed = searchText.trim();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    // If local results already exist or query is empty, no need to query API
    if (churchMeetingId && (localFilteredKids.length > 0 || !trimmed)) {
      setApiSearchResults([]);
      setIsApiSearching(false);
      return;
    }

    if (trimmed.length < 2 || !token) {
      setApiSearchResults([]);
      setIsApiSearching(false);
      return;
    }

    setIsApiSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchKidsForTransfer(trimmed, token, churchMeetingId);
        setApiSearchResults(results);
      } catch {
        setApiSearchResults([]);
      } finally {
        setIsApiSearching(false);
      }
    }, 280);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchText, token, churchMeetingId, localFilteredKids.length]);

  const displayKids = useMemo(() => {
    if (churchMeetingId) {
      if (localFilteredKids.length > 0) return localFilteredKids;
      return apiSearchResults;
    }
    return apiSearchResults;
  }, [churchMeetingId, localFilteredKids, apiSearchResults]);

  /**
   * Selects a child and closes the search dropdown.
   *
   * @param {IKid} kid - Selected child entity.
   * @returns {void}
   */
  const handleSelect = (kid: IKid) => {
    onSelectKid(kid);
    setSearchText('');
    setApiSearchResults([]);
    setShowDropdown(false);
  };

  /**
   * Clears the selected child and immediately opens the dropdown list
   * with available registered children.
   *
   * @returns {void}
   */
  const handleClear = () => {
    onSelectKid(null);
    setSearchText('');
    setApiSearchResults([]);
    setShowDropdown(true);
  };

  const isLoading = (Boolean(churchMeetingId) && loadingRegisteredKids) || isApiSearching;

  return (
    <div ref={containerRef} className="space-y-2 relative">
      {selectedKid ? (
        <>
          <PersonSearchInput
            label={t('reports.child_selector.label', { ns: 'kidChurch' })}
            required
            badge="Obligatorio"
            searchValue=""
            onSearchChange={() => {}}
            selectedPerson={{
              name: capitalizeWords(`${selectedKid.firstName} ${selectedKid.lastName}`.trim()),
              code: selectedKid.faithForgeId || undefined,
              photoUrl: selectedKid.photoUrl,
              tag:
                selectedKid.kidGroup?.name ||
                selectedKid.currentKidRegistration?.additionalInfo?.groupName ||
                (selectedKid.age ? `${selectedKid.age} años` : undefined),
              avatarFallback:
                selectedKid.gender === 'F' ? (
                  <FaChildDress size={20} className="text-pink-500" />
                ) : (
                  <FaChild size={20} className="text-blue-500" />
                ),
            }}
            onChangePerson={handleClear}
          />

          {/* Display registered guardians */}
          {showGuardiansPreview && (
            <div className="p-2.5 bg-gray-50 border border-gray-200/60 rounded-xl space-y-1.5">
              <p className="text-[11px] font-bold text-gray-600">
                {t('reports.child_selector.guardians_title', { ns: 'kidChurch' })}
              </p>
              {loadingFullKid && (!selectedKid.relations || selectedKid.relations.length === 0) ? (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 py-1">
                  <Loader2 size={13} className="animate-spin text-primary" />
                  <span>Cargando acudientes...</span>
                </div>
              ) : selectedKid.relations && selectedKid.relations.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedKid.relations.map((g) => {
                    const relationLabel =
                      KID_RELATION_CODE_MAPPER[g.relation] || g.relation || 'Acudiente';
                    const isCheckInGuardian =
                      selectedKid.currentKidRegistration?.guardianId &&
                      g.id === selectedKid.currentKidRegistration.guardianId;

                    return (
                      <span
                        key={g.id}
                        className={clsx(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs',
                          isCheckInGuardian
                            ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                            : 'bg-white border border-gray-200 text-gray-800',
                        )}
                      >
                        <User size={12} className={isCheckInGuardian ? 'text-emerald-600' : 'text-gray-500'} />
                        <span>
                          {formatPersonShortName(`${g.firstName} ${g.lastName}`)} ({relationLabel})
                        </span>
                        {g.phone && (
                          <span className="text-[11px] text-gray-500 font-normal">
                            • {g.phone}
                          </span>
                        )}
                        {isCheckInGuardian && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-200/80 text-emerald-800 rounded font-bold">
                            Registró hoy
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  Sin acudientes registrados
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <PersonSearchInput
          label={t('reports.child_selector.label', { ns: 'kidChurch' })}
          required
          badge="Obligatorio"
          placeholder={t('reports.child_selector.placeholder', { ns: 'kidChurch' })}
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
          {/* Results dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto no-scrollbar bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-1">
              {isLoading && displayKids.length === 0 ? (
                <div className="p-4 flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                  <Loader2 size={15} className="animate-spin text-primary" />
                  <span>{t('reports.child_selector.loading', { ns: 'kidChurch', defaultValue: 'Cargando niños...' })}</span>
                </div>
              ) : displayKids.length === 0 ? (
                <div className="p-3 text-center text-xs text-gray-500 font-medium">
                  {t('reports.child_selector.no_results', { ns: 'kidChurch' })}
                </div>
              ) : (
                displayKids.map((kid) => {
                  const fullName = capitalizeWords(`${kid.firstName} ${kid.lastName}`.trim());
                  const isGirlResult = kid.gender === 'F';
                  const groupName =
                    kid.kidGroup?.name ||
                    kid.currentKidRegistration?.additionalInfo?.groupName;

                  return (
                    <button
                      key={kid.id}
                      type="button"
                      onClick={() => handleSelect(kid)}
                      className="w-full text-left p-2 rounded-xl hover:bg-gray-100 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={clsx(
                            'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                            kid.photoUrl
                              ? 'bg-gray-100'
                              : isGirlResult
                                ? 'bg-pink-100 text-pink-600'
                                : 'bg-blue-100 text-blue-600',
                          )}
                        >
                          {kid.photoUrl ? (
                            <img
                              src={kid.photoUrl}
                              alt={fullName}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : isGirlResult ? (
                            <FaChildDress size={13} />
                          ) : (
                            <FaChild size={13} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{fullName}</p>
                          <p className="text-[10px] text-gray-500">
                            {groupName ? `${groupName} • ` : ''}
                            {kid.age ? `${kid.age} años` : ''}
                            {kid.faithForgeId ? ` • #${kid.faithForgeId}` : ''}
                          </p>
                        </div>
                      </div>
                      <Check size={14} className="text-primary shrink-0" />
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
