import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppDrawer from '@/components/ui/AppDrawer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SelectSearch from '@/components/ui/SelectSearch';
import { ChurchPrinterStateEnum, IChurchPrinter } from '@/libs/models';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { CreateChurchPrinter, UpdateChurchPrinter } from '@/libs/state/redux/thunks/church/church.thunk';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { useChurchTerm } from '@/libs/hooks/useTerm';
import { toast } from 'sonner';
import { Printer, MapPin } from 'lucide-react';
import clsx from 'clsx';

interface PrinterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  printerToEdit?: IChurchPrinter | null;
  churchCampusId?: string;
  onSuccess?: () => void;
}

/**
 * Drawer modal to create or edit a Church Thermal Printer.
 *
 * @param {PrinterModalProps} props - Component properties.
 * @returns {JSX.Element} The rendered modal drawer.
 */
export const PrinterModal: React.FC<PrinterModalProps> = ({
  open,
  onOpenChange,
  printerToEdit,
  churchCampusId,
  onSuccess,
}) => {
  useModalBackClose(open, () => onOpenChange(false));

  const { t } = useTranslation(['admin', 'common']);
  const campusTerm = useChurchTerm('campus');
  const dispatch = useAppDispatch();
  const campuses = useAppSelector((state) => state.churchCampusSlice.data);

  const [name, setName] = useState('');
  const [selectedCampusId, setSelectedCampusId] = useState('');
  const [state, setState] = useState<ChurchPrinterStateEnum>(ChurchPrinterStateEnum.ACTIVE);
  const [nameError, setNameError] = useState('');
  const [campusError, setCampusError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(printerToEdit);

  useEffect(() => {
    if (!open) return;

    if (printerToEdit) {
      setName(printerToEdit.name);
      setSelectedCampusId(printerToEdit.churchCampusId || churchCampusId || '');
      setState(printerToEdit.state ?? ChurchPrinterStateEnum.ACTIVE);
    } else {
      setName('');
      setSelectedCampusId(churchCampusId || (campuses.length > 0 ? campuses[0].id : ''));
      setState(ChurchPrinterStateEnum.ACTIVE);
    }
    setNameError('');
    setCampusError('');
  }, [open, printerToEdit, churchCampusId, campuses]);

  const campusOptions = campuses.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!name.trim()) {
      setNameError(t('admin:printers.field_name_required'));
      hasError = true;
    }
    if (!selectedCampusId) {
      setCampusError(t('admin:printers.field_campus_required', { campus: campusTerm }));
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      if (isEditing && printerToEdit) {
        await dispatch(
          UpdateChurchPrinter({
            id: printerToEdit.id,
            name: name.trim(),
            churchCampusId: selectedCampusId,
            state,
          }),
        ).unwrap();
        toast.success(t('admin:printers.updated_success'));
      } else {
        await dispatch(
          CreateChurchPrinter({
            name: name.trim(),
            churchCampusId: selectedCampusId,
            state,
          }),
        ).unwrap();
        toast.success(t('admin:printers.created_success'));
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const errMsg =
        typeof err === 'string' ? err : err?.message || t('admin:printers.delete_error');
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEditing
          ? t('admin:printers.modal_edit_title')
          : t('admin:printers.modal_create_title')
      }
      icon={<Printer size={20} className="text-cyan-600" />}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-5 sm:p-6">
        {/* Campus Selection */}
        <div className="flex flex-col gap-1.5">
          <SelectSearch
            label={t('admin:printers.field_campus_label', { campus: campusTerm })}
            placeholder={t('admin:printers.field_campus_placeholder', { campus: campusTerm })}
            options={campusOptions}
            value={selectedCampusId}
            onChange={(val) => {
              setSelectedCampusId(val);
              if (campusError) setCampusError('');
            }}
            disabled={loading}
            required
            error={campusError}
          />
        </div>

        {/* Name Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-700">
            {t('admin:printers.field_name_label')}{' '}
            <span className="text-rose-500 font-bold">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError('');
            }}
            placeholder={t('admin:printers.field_name_placeholder')}
            className="placeholder:text-gray-400"
            disabled={loading}
            error={nameError}
            autoFocus
          />
          <p className="text-[11px] text-gray-400 leading-normal">
            {t('admin:printers.field_name_hint')}
          </p>
        </div>

        {/* State Toggle Switch Card */}
        <div
          onClick={() =>
            !loading &&
            setState((prev) =>
              prev === ChurchPrinterStateEnum.ACTIVE
                ? ChurchPrinterStateEnum.INACTIVE
                : ChurchPrinterStateEnum.ACTIVE,
            )
          }
          className="p-4 rounded-2xl border border-gray-200/80 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 cursor-pointer select-none"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">
                {t('admin:printers.field_status_label')}
              </span>
              <span
                className={clsx(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors',
                  state === ChurchPrinterStateEnum.ACTIVE
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-200 text-gray-600',
                )}
              >
                {state === ChurchPrinterStateEnum.ACTIVE
                  ? t('admin:printers.status_active')
                  : t('admin:printers.status_inactive')}
              </span>
            </div>
            <span className="text-[11px] text-gray-500 block mt-0.5 leading-normal">
              {state === ChurchPrinterStateEnum.ACTIVE
                ? t('admin:printers.status_active_desc')
                : t('admin:printers.status_inactive_desc')}
            </span>
          </div>

          {/* Standard Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={state === ChurchPrinterStateEnum.ACTIVE}
            disabled={loading}
            className={clsx(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
              state === ChurchPrinterStateEnum.ACTIVE ? 'bg-emerald-600' : 'bg-gray-300',
            )}
          >
            <span
              aria-hidden="true"
              className={clsx(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                state === ChurchPrinterStateEnum.ACTIVE ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </button>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 text-xs py-2.5"
          >
            {t('admin:printers.cancel_btn')}
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="flex-1 text-xs py-2.5 shadow-sm active:scale-98"
          >
            {isEditing ? t('admin:printers.save_btn') : t('admin:printers.create_btn')}
          </Button>
        </div>
      </form>
    </AppDrawer>
  );
};

export default PrinterModal;
