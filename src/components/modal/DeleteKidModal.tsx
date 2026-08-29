import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Trash2, ArrowRightLeft, Search, X, Check, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import Button from '@/components/ui/Button';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { IKid } from '@/libs/models';
import { capitalizeWords, formatPersonShortName } from '@/libs/utils/text';
import { searchKidsForTransfer } from '@/services/kidService';
import { useAppSelector } from '@/libs/state/redux/hooks';

interface DeleteKidModalProps {
  open: boolean;
  onClose: () => void;
  kid: Partial<IKid> | IKid | null | undefined;
  onConfirm: (targetKidId?: string) => Promise<void> | void;
}

/**
 * Modal to confirm child deletion, with an optional workflow to migrate
 * guardians and attendance records to another child prior to removal.
 *
 * @param {DeleteKidModalProps} props - Component properties.
 * @returns {JSX.Element} Rendered modal dialog.
 */
export const DeleteKidModal: React.FC<DeleteKidModalProps> = ({
  open,
  onClose,
  kid,
  onConfirm,
}) => {
  useModalBackClose(open, onClose);

  const token = useAppSelector((state) => state.authSlice.token);
  const currentMeeting = useAppSelector((state) => state.churchMeetingSlice.current);

  const [shouldTransfer, setShouldTransfer] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<IKid[]>([]);
  const [selectedTargetKid, setSelectedTargetKid] = useState<IKid | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (open) {
      setShouldTransfer(false);
      setSearchText('');
      setSearchResults([]);
      setSelectedTargetKid(null);
      setIsSearching(false);
      setIsSubmitting(false);
    }
  }, [open]);

  // Debounced search for target kids
  useEffect(() => {
    if (!open || !shouldTransfer) return;

    const trimmed = searchText.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchKidsForTransfer(trimmed, token, currentMeeting?.id);
        // Exclude the kid being deleted
        const filtered = results.filter((k) => k.id !== kid?.id);
        setSearchResults(filtered);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchText, shouldTransfer, open, token, currentMeeting?.id, kid?.id]);

  /**
   * Handles confirming deletion and optional migration.
   */
  const handleConfirm = async () => {
    if (shouldTransfer && !selectedTargetKid) return;

    setIsSubmitting(true);
    try {
      await onConfirm(shouldTransfer ? selectedTargetKid?.id : undefined);
      onClose();
    } catch {
      // Handled upstream in parent caller
    } finally {
      setIsSubmitting(false);
    }
  };

  const kidFullName = kid ? capitalizeWords(`${kid.firstName} ${kid.lastName}`.trim()) : 'este niño';

  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && !isSubmitting && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl p-5 sm:p-6 w-[92vw] max-w-md z-[1000] max-h-[90vh] flex flex-col animate-in zoom-in-95 fade-in duration-200 outline-none">
          {/* Header */}
          <div className="flex flex-col items-center text-center shrink-0">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-inner bg-red-100 text-red-600">
              <Trash2 size={26} strokeWidth={2.3} />
            </div>

            <Dialog.Title className="text-xl font-black text-gray-800 mb-1.5 tracking-tight">
              ¿Eliminar niño?
            </Dialog.Title>

            <Dialog.Description className="text-gray-500 text-xs sm:text-sm leading-relaxed px-1">
              Estás a punto de eliminar a <span className="font-semibold text-gray-700">{kidFullName}</span>.
              Esta acción no se puede deshacer.
            </Dialog.Description>
          </div>

          {/* Transfer Option & Search Section */}
          <div className="my-4 overflow-y-auto flex-1 pr-0.5 space-y-3">
            {/* Toggle Card */}
            <div
              onClick={() => {
                const next = !shouldTransfer;
                setShouldTransfer(next);
                if (!next) {
                  setSelectedTargetKid(null);
                  setSearchText('');
                  setSearchResults([]);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShouldTransfer((prev) => !prev);
                }
              }}
              className={clsx(
                'w-full p-3.5 rounded-2xl border transition-all text-left flex items-start gap-3 cursor-pointer select-none',
                shouldTransfer
                  ? 'border-amber-300 bg-amber-50/80 shadow-xs'
                  : 'border-gray-200 bg-gray-50/70 hover:bg-gray-50'
              )}
            >
              <div
                className={clsx(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                  shouldTransfer ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'
                )}
              >
                <ArrowRightLeft size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-gray-800">
                    Transferir información a otro niño
                  </span>
                  <div
                    className={clsx(
                      'w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ml-2',
                      shouldTransfer
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'border-gray-300 bg-white'
                    )}
                  >
                    {shouldTransfer && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 leading-snug">
                  Migra acudientes y registros de asistencia al niño seleccionado antes de eliminar.
                </p>
              </div>
            </div>

            {/* If transfer is enabled */}
            {shouldTransfer && (
              <div className="space-y-2.5 animate-in fade-in zoom-in-95 duration-150 pt-1">
                {/* Selected kid card */}
                {selectedTargetKid ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {selectedTargetKid.photoUrl ? (
                        <img
                          src={selectedTargetKid.photoUrl}
                          alt={selectedTargetKid.firstName}
                          className="w-10 h-10 rounded-full object-cover border border-emerald-300 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {selectedTargetKid.firstName?.charAt(0)}
                          {selectedTargetKid.lastName?.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">
                          Niño Destino
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                          {capitalizeWords(`${selectedTargetKid.firstName} ${selectedTargetKid.lastName}`)}
                        </h4>
                        <span className="text-[11px] text-gray-500 font-medium">
                          Código: #{selectedTargetKid.faithForgeId}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTargetKid(null)}
                      className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200/80 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Search Input */}
                    <div className="relative">
                      <Search
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      <input
                        type="text"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Buscar por nombre o código..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm outline-none focus:border-amber-400 focus:bg-white transition-all text-gray-800 placeholder:text-gray-400"
                        autoFocus
                      />
                      {searchText && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchText('');
                            setSearchResults([]);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>

                    {/* Results / Feedback */}
                    {isSearching && (
                      <div className="flex items-center justify-center gap-2 py-4 text-gray-400 text-xs">
                        <Loader2 size={16} className="animate-spin text-amber-500" />
                        <span>Buscando niños...</span>
                      </div>
                    )}

                    {!isSearching && searchText.trim() && searchResults.length === 0 && (
                      <div className="text-center py-4 text-gray-400 text-xs">
                        No se encontraron niños con ese nombre o código.
                      </div>
                    )}

                    {!isSearching && searchResults.length > 0 && (
                      <div className="max-h-44 overflow-y-auto space-y-1.5 border border-gray-100 rounded-xl p-1 bg-gray-50/50">
                        {searchResults.map((target) => (
                          <div
                            key={target.id}
                            onClick={() => {
                              setSelectedTargetKid(target);
                              setSearchText('');
                              setSearchResults([]);
                            }}
                            role="button"
                            tabIndex={0}
                            className="flex items-center justify-between gap-2 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-200 text-left"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {target.photoUrl ? (
                                <img
                                  src={target.photoUrl}
                                  alt={target.firstName}
                                  className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[11px] shrink-0">
                                  {target.firstName?.charAt(0)}
                                  {target.lastName?.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">
                                  {formatPersonShortName(target.firstName, target.lastName)}
                                </p>
                                <p className="text-[11px] text-gray-500 font-medium">
                                  Código: #{target.faithForgeId}
                                  {target.kidGroup?.name ? ` • ${target.kidGroup.name}` : ''}
                                </p>
                              </div>
                            </div>

                            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-md shrink-0">
                              Elegir
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {!searchText.trim() && (
                      <p className="text-[11px] text-gray-400 text-center py-1">
                        Escribe el nombre o el código del niño que recibirá la información.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="w-full flex flex-col gap-2 shrink-0 pt-2 border-t border-gray-100">
            <Button
              onClick={handleConfirm}
              block
              disabled={isSubmitting || (shouldTransfer && !selectedTargetKid)}
              style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#ffffff' }}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Procesando...</span>
                </div>
              ) : shouldTransfer ? (
                'Eliminar y transferir'
              ) : (
                'Eliminar niño'
              )}
            </Button>

            <Button
              onClick={onClose}
              block
              variant="ghost"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>

          {/* Close X */}
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors outline-none"
          >
            <X size={18} />
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default DeleteKidModal;
