import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppDrawer from '@/components/ui/AppDrawer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { ChurchCampusStateEnum, IChurchCampus, KidAttendanceFlowModeEnum } from '@/libs/models';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import { CreateChurchCampus, UpdateChurchCampus } from '@/libs/state/redux/thunks/church/church.thunk';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { useChurchTerm } from '@/libs/hooks/useTerm';
import { toast } from 'sonner';
import {
  MapPin,
  CheckCircle2,
  XCircle,
  QrCode,
  LogIn,
  ShieldCheck,
  Sparkles,
  FileText,
  Hash,
} from 'lucide-react';
import clsx from 'clsx';

interface CampusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campusToEdit?: IChurchCampus | null;
  onSuccess?: () => void;
}

/**
 * Drawer modal to create or edit a Church Campus with generous spacing and breathing room.
 *
 * @param {CampusModalProps} props - Component properties.
 * @returns {JSX.Element} The rendered modal drawer.
 */
export const CampusModal: React.FC<CampusModalProps> = ({
  open,
  onOpenChange,
  campusToEdit,
  onSuccess,
}) => {
  useModalBackClose(open, () => onOpenChange(false));

  const { t } = useTranslation(['admin', 'common']);
  const campusTerm = useChurchTerm('campus');
  const dispatch = useAppDispatch();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState<number | ''>('');
  const [state, setState] = useState<ChurchCampusStateEnum>(ChurchCampusStateEnum.ACTIVE);
  const [kidAttendanceFlowMode, setKidAttendanceFlowMode] = useState<KidAttendanceFlowModeEnum>(
    KidAttendanceFlowModeEnum.ONLY_CHECK_IN,
  );
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(campusToEdit);

  useEffect(() => {
    if (!open) return;

    if (campusToEdit) {
      setName(campusToEdit.name);
      setDescription(campusToEdit.description || '');
      setPosition(campusToEdit.position ?? '');
      setState(campusToEdit.state ?? ChurchCampusStateEnum.ACTIVE);
      setKidAttendanceFlowMode(
        campusToEdit.kidAttendanceFlowMode ?? KidAttendanceFlowModeEnum.ONLY_CHECK_IN,
      );
    } else {
      setName('');
      setDescription('');
      setPosition('');
      setState(ChurchCampusStateEnum.ACTIVE);
      setKidAttendanceFlowMode(KidAttendanceFlowModeEnum.ONLY_CHECK_IN);
    }
    setNameError('');
  }, [open, campusToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(t('admin:campuses.field_name_required', { campus: campusTerm }));
      return;
    }

    setLoading(true);
    try {
      if (isEditing && campusToEdit) {
        await dispatch(
          UpdateChurchCampus({
            id: campusToEdit.id,
            name: name.trim(),
            description: description.trim() || undefined,
            position: position !== '' ? Number(position) : undefined,
            state,
            kidAttendanceFlowMode,
          }),
        ).unwrap();
        toast.success(t('admin:campuses.updated_success', { campus: campusTerm }));
      } else {
        await dispatch(
          CreateChurchCampus({
            name: name.trim(),
            description: description.trim() || undefined,
            position: position !== '' ? Number(position) : undefined,
            state,
            kidAttendanceFlowMode,
          }),
        ).unwrap();
        toast.success(t('admin:campuses.created_success', { campus: campusTerm }));
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const errMsg =
        typeof err === 'string'
          ? err
          : err?.message || 'Error al procesar la operación en la sede';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const flowOptions = useMemo(
    () => [
      {
        value: KidAttendanceFlowModeEnum.ONLY_CHECK_IN,
        title: t('admin:campuses.flow_modes.ONLY_CHECK_IN'),
        desc: t('admin:campuses.flow_modes.ONLY_CHECK_IN_desc'),
        icon: QrCode,
      },
      {
        value: KidAttendanceFlowModeEnum.CHECK_IN_AND_ENTRY,
        title: t('admin:campuses.flow_modes.CHECK_IN_AND_ENTRY'),
        desc: t('admin:campuses.flow_modes.CHECK_IN_AND_ENTRY_desc'),
        icon: LogIn,
      },
      {
        value: KidAttendanceFlowModeEnum.DIRECT_ENTRY_AND_CHECK_OUT,
        title: t('admin:campuses.flow_modes.DIRECT_ENTRY_AND_CHECK_OUT'),
        desc: t('admin:campuses.flow_modes.DIRECT_ENTRY_AND_CHECK_OUT_desc'),
        icon: ShieldCheck,
      },
      {
        value: KidAttendanceFlowModeEnum.FULL_FLOW,
        title: t('admin:campuses.flow_modes.FULL_FLOW'),
        desc: t('admin:campuses.flow_modes.FULL_FLOW_desc'),
        icon: Sparkles,
      },
    ],
    [t],
  );

  const selectedFlow = useMemo(
    () => flowOptions.find((f) => f.value === kidAttendanceFlowMode) || flowOptions[0],
    [flowOptions, kidAttendanceFlowMode],
  );

  const SelectedFlowIcon = selectedFlow.icon;

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEditing
          ? t('admin:campuses.modal_edit_title', { campus: campusTerm })
          : t('admin:campuses.modal_create_title', { campus: campusTerm })
      }
      icon={<MapPin size={20} className="text-emerald-600" />}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-5 sm:p-6">
        {/* Name Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-700">
            {t('admin:campuses.field_name_label', { campus: campusTerm })}{' '}
            <span className="text-rose-500 font-bold">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError('');
            }}
            placeholder={t('admin:campuses.field_name_placeholder')}
            className="placeholder:text-gray-400"
            disabled={loading}
            error={nameError}
            autoFocus
          />
        </div>

        {/* Description / Address Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <FileText size={13} className="text-gray-400" />
              <span>{t('admin:campuses.field_description_label')}</span>
            </label>
            <span className="text-[11px] text-gray-400 font-normal">
              {t('admin:campuses.field_description_optional')}
            </span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('admin:campuses.field_description_placeholder')}
            rows={3}
            disabled={loading}
            className="w-full text-sm rounded-xl border border-gray-200 bg-white p-3 text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none font-medium"
          />
        </div>

        {/* Position Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Hash size={13} className="text-gray-400" />
              <span>{t('admin:campuses.field_position_label')}</span>
            </label>
            <span className="text-[11px] text-gray-400 font-normal">
              {t('admin:campuses.field_description_optional')}
            </span>
          </div>
          <Input
            type="number"
            min={1}
            value={position}
            onChange={(e) => setPosition(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={t('admin:campuses.field_position_placeholder')}
            className="placeholder:text-gray-400"
            disabled={loading}
          />
          <p className="text-[11px] text-gray-400 leading-normal">
            {t('admin:campuses.field_position_hint')}
          </p>
        </div>

        {/* Kid Attendance Flow Mode with Clean Selector & Explanatory Card */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-700 block">
            {t('admin:campuses.field_flow_label')}
          </label>
          <Select
            value={kidAttendanceFlowMode}
            onChange={(e) => setKidAttendanceFlowMode(e.target.value as KidAttendanceFlowModeEnum)}
            disabled={loading}
            className="border-gray-200 text-sm font-semibold text-gray-800"
          >
            {flowOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.title}
              </option>
            ))}
          </Select>

          {/* Contextual Description Banner */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100/90 flex items-start gap-3 mt-1">
            <div className="w-8 h-8 rounded-xl bg-white border border-indigo-200/80 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <SelectedFlowIcon size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-indigo-950 block">
                {selectedFlow.title}
              </span>
              <p className="text-[11px] text-indigo-800/80 mt-0.5 leading-relaxed">
                {selectedFlow.desc}
              </p>
            </div>
          </div>
        </div>

        {/* State Toggle Switch Card */}
        <div
          onClick={() =>
            !loading &&
            setState((prev) =>
              prev === ChurchCampusStateEnum.ACTIVE
                ? ChurchCampusStateEnum.INACTIVE
                : ChurchCampusStateEnum.ACTIVE,
            )
          }
          className="p-4 rounded-2xl border border-gray-200/80 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 cursor-pointer select-none"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">
                {t('admin:campuses.field_status_label', { campus: campusTerm })}
              </span>
              <span
                className={clsx(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors',
                  state === ChurchCampusStateEnum.ACTIVE
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-200 text-gray-600',
                )}
              >
                {state === ChurchCampusStateEnum.ACTIVE
                  ? t('admin:campuses.status_active')
                  : t('admin:campuses.status_inactive')}
              </span>
            </div>
            <span className="text-[11px] text-gray-500 block mt-0.5 leading-normal">
              {state === ChurchCampusStateEnum.ACTIVE
                ? t('admin:campuses.status_active_desc')
                : t('admin:campuses.status_inactive_desc')}
            </span>
          </div>

          {/* Standard Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={state === ChurchCampusStateEnum.ACTIVE}
            disabled={loading}
            className={clsx(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
              state === ChurchCampusStateEnum.ACTIVE ? 'bg-emerald-600' : 'bg-gray-300',
            )}
          >
            <span
              aria-hidden="true"
              className={clsx(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                state === ChurchCampusStateEnum.ACTIVE ? 'translate-x-5' : 'translate-x-0',
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
            {t('admin:campuses.cancel_btn')}
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="flex-1 text-xs py-2.5 shadow-sm active:scale-98"
          >
            {isEditing
              ? t('admin:campuses.save_btn')
              : t('admin:campuses.create_btn', { campus: campusTerm })}
          </Button>
        </div>
      </form>
    </AppDrawer>
  );
};

export default CampusModal;
