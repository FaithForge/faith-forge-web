import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { MessageSquarePlus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { useAddChurchReportNoteMutation } from '@/libs/state/redux/api/churchApi';

interface AddChurchReportNoteModalProps {
  open: boolean;
  onClose: () => void;
  reportId: string;
  churchMeetingId?: string;
  date?: string;
  onSuccess?: () => void;
}

/**
 * Modal dialog to append a follow-up progress note to an active report.
 *
 * @param {AddChurchReportNoteModalProps} props - Open state, report ID, meeting context, and callbacks.
 * @returns {JSX.Element | null} Rendered note modal dialog.
 */
export const AddChurchReportNoteModal: React.FC<AddChurchReportNoteModalProps> = ({
  open,
  onClose,
  reportId,
  churchMeetingId,
  date,
  onSuccess,
}) => {
  useModalBackClose(open, onClose);
  const { t } = useTranslation(['kidChurch', 'common']);

  const [addNote, { isLoading }] = useAddChurchReportNoteMutation();
  const [note, setNote] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!note.trim()) {
      toast.error(t('reports.actions.toast_error', { ns: 'kidChurch' }));
      return;
    }

    try {
      await addNote({
        id: reportId,
        note: note.trim(),
        churchMeetingId: churchMeetingId || undefined,
        date: date || undefined,
      }).unwrap();

      toast.success(t('reports.actions.toast_note_added', { ns: 'kidChurch' }));
      setNote('');
      onSuccess?.();
      onClose();
    } catch {
      toast.error(t('reports.actions.toast_error', { ns: 'kidChurch' }));
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && !isLoading && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl p-5 sm:p-6 w-[92vw] max-w-md z-[1000] flex flex-col animate-in zoom-in-95 fade-in duration-200 outline-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <MessageSquarePlus size={22} />
              </div>
              <div>
                <Dialog.Title className="text-base font-black text-gray-900 tracking-tight">
                  {t('reports.actions.add_note', { ns: 'kidChurch' })}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-gray-500">
                  {t('reports.actions.note_label', { ns: 'kidChurch' })}
                </Dialog.Description>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Textarea
              label={t('reports.actions.note_label', { ns: 'kidChurch' })}
              required
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('reports.actions.note_placeholder', { ns: 'kidChurch' })}
            />

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
              >
                {t('reports.actions.cancel', { ns: 'kidChurch' })}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isLoading}
              >
                {isLoading
                  ? t('reports.actions.saving', { ns: 'kidChurch' })
                  : t('reports.actions.save', { ns: 'kidChurch' })}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
