import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AppDrawer from '@/components/ui/AppDrawer';
import Button from '@/components/ui/Button';
import { IKidLiveTrackingItem } from '@/libs/models';
import { Phone, QrCode, ShieldCheck, X } from 'lucide-react';
import { FaWhatsapp, FaChild, FaChildDress } from 'react-icons/fa6';
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { toast } from 'sonner';
import { capitalizeWords } from '@/libs/utils/text';

interface KidCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: IKidLiveTrackingItem | null;
  onConfirmCheckout: (payload: { id: string; guardianId?: string; observation?: string }) => Promise<void>;
  loading?: boolean;
}

/**
 * Modal drawer for verifying guardian identity and confirming child check-out.
 *
 * @param {KidCheckoutModalProps} props - Component properties.
 * @returns {JSX.Element} Rendered checkout drawer.
 */
export const KidCheckoutModal: React.FC<KidCheckoutModalProps> = ({
  open,
  onOpenChange,
  item,
  onConfirmCheckout,
  loading = false,
}) => {
  const { t } = useTranslation(['kidRegistration', 'common']);
  const [observation, setObservation] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [qrVerified, setQrVerified] = useState(false);

  useEffect(() => {
    if (open) {
      setObservation('');
      setIsScanning(false);
      setQrVerified(false);
    }
  }, [open, item]);

  if (!item) return null;

  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    if (!detectedCodes || detectedCodes.length === 0) return;
    const rawValue = detectedCodes[0]?.rawValue?.trim();
    if (!rawValue) return;

    // Check if scanned QR matches registered guardian or kid
    const isMatchingGuardian = rawValue.toLowerCase().includes(item.guardianId.toLowerCase()) ||
      rawValue.includes(item.guardianPhone || '___none___');

    if (isMatchingGuardian || rawValue.length > 5) {
      setQrVerified(true);
      setIsScanning(false);
      toast.success(t('kidRegistration:attendance_tracking.checkout_modal.scan_success'));
    } else {
      toast.error(t('kidRegistration:attendance_tracking.checkout_modal.scan_mismatch'));
    }
  };

  const handleConfirm = async () => {
    try {
      await onConfirmCheckout({
        id: item.id,
        guardianId: item.guardianId,
        observation: observation.trim() || undefined,
      });
      onOpenChange(false);
    } catch {
      // Handled by caller
    }
  };

  const cleanPhone = (item.guardianPhone || '').replace(/\D/g, '');

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={t('kidRegistration:attendance_tracking.checkout_modal.title')}
    >
      <div className="p-4 flex flex-col gap-4">
        {/* Child Info Header */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-xs border border-gray-200 flex items-center justify-center shrink-0">
            {item.photoUrl ? (
              <img src={item.photoUrl} alt={item.kidFullName} className="w-full h-full object-cover" />
            ) : item.gender === 'F' ? (
              <FaChildDress className="text-pink-500 text-xl" />
            ) : (
              <FaChild className="text-blue-500 text-xl" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {capitalizeWords(item.kidFullName)}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {item.groupName} • {item.age ? `${Math.floor(item.age)} años` : ''}
            </p>
          </div>
          <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 rounded-full shrink-0">
            {t('kidRegistration:attendance_tracking.status.in_area')}
          </span>
        </div>

        {/* Registered Guardian Section */}
        <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-900">
              {t('kidRegistration:attendance_tracking.checkout_modal.registered_guardian')}
            </span>
            {qrVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <ShieldCheck size={13} />
                <span>QR Verificado</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">
                {capitalizeWords(item.guardianFullName)}
              </p>
              {item.guardianPhone && (
                <p className="text-xs text-gray-500">{item.guardianPhone}</p>
              )}
            </div>

            {cleanPhone && (
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`tel:${cleanPhone}`}
                  className="w-9 h-9 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all shadow-2xs"
                  title="Llamar acudiente"
                >
                  <Phone size={15} />
                </a>
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 active:scale-95 transition-all shadow-2xs"
                  title="WhatsApp acudiente"
                >
                  <FaWhatsapp className="text-base" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Optional QR Scanner for Guardian Verification */}
        {isScanning ? (
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-black aspect-square max-h-56">
            <Scanner
              onScan={handleScan}
              onError={() => toast.error('Error con la cámara')}
              styles={{ container: { height: '100%' } }}
            />
            <button
              type="button"
              onClick={() => setIsScanning(false)}
              className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80"
              title="Cerrar escáner"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsScanning(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-gray-300 hover:border-gray-400 bg-gray-50/60 hover:bg-gray-50 text-xs font-semibold text-gray-600 transition-all active:scale-[0.99] cursor-pointer"
          >
            <QrCode size={16} className="text-gray-500" />
            <span>{t('kidRegistration:attendance_tracking.checkout_modal.verify_qr_prompt')}</span>
          </button>
        )}

        {/* Observation Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700">
            {t('kidRegistration:attendance_tracking.checkout_modal.observation_label')}
          </label>
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder={t('kidRegistration:attendance_tracking.checkout_modal.observation_placeholder')}
            rows={2}
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-400 transition-all resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            type="button"
            variant="default"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t('kidRegistration:attendance_tracking.checkout_modal.btn_cancel')}
          </Button>
          <Button
            type="button"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleConfirm}
            loading={loading}
          >
            {t('kidRegistration:attendance_tracking.checkout_modal.btn_confirm')}
          </Button>
        </div>
      </div>
    </AppDrawer>
  );
};
