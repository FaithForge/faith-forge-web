import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCode } from 'react-qrcode-logo';
import { 
  ArrowLeft, 
  Search, 
  Download, 
  Printer, 
  Loader2, 
  QrCode, 
  MessageCircle,
  User,
  Phone,
  FileText,
  Check,
  X
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { 
  GetKidGuardian, 
  UploadQRCodeImage 
} from '@/libs/state/redux/thunks/kid-church/kid-guardian.thunk';
import { cleanCurrentKidGuardian } from '@/libs/state/redux/slices/kid-church/kid-guardian.slice';
import { capitalizeWords } from '@/libs/utils/text';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/ui/PageHeader';
import { APP_ROUTES } from '@/config/routes';

const GenerateGuardianQRView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [nationalIdQuery, setNationalIdQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string | undefined>(undefined);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | undefined>(undefined);

  const { current: guardian, loading: guardianLoading, error: guardianError } = useAppSelector(
    (state) => state.kidGuardianSlice,
  );

  useEffect(() => {
    dispatch(cleanCurrentKidGuardian());
  }, [dispatch]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = nationalIdQuery.trim();
    if (!cleanId) {
      toast.error('Ingresa el número de documento del acudiente');
      return;
    }
    setHasSearched(true);
    setWhatsappUrl(undefined);
    setQrCodeUrl(undefined);
    dispatch(GetKidGuardian(cleanId));
  };

  useEffect(() => {
    const generateWhatsappUrl = async () => {
      if (guardian && guardian.id) {
        setIsGeneratingUrl(true);
        try {
          // Wait one animation cycle for the hidden canvas to fully render
          await new Promise((resolve) => setTimeout(resolve, 300));
          const canvas: HTMLCanvasElement | null = document.getElementById(
            'qr-code-generate-kid-guardian'
          ) as HTMLCanvasElement;

          if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            const blob = await (await fetch(dataUrl)).blob();

            const formData = new FormData();
            formData.append('file', blob, `qr-${guardian.id}.png`);
            formData.append('qrCodeValue', guardian.id);

            const photoUrl = (await dispatch(UploadQRCodeImage({ formData })).unwrap()) as string;

            const dialDigits = (guardian.dialCodePhone || '+57').replace('+', '');
            const phoneDigits = (guardian.phone || '').replace(/\D/g, '');
            const fullName = `${capitalizeWords(guardian.firstName)} ${capitalizeWords(guardian.lastName)}`;

            // Full message for WhatsApp Share button
            const fullMessage = `¡Hola *${fullName}*!
Desde Iglekids te enviamos este enlace para descargar tu código QR personal, el cual podrás mostrar cada vez que registres a tu(s) niño(s) para agilizar el proceso:

*URL de imagen:* ${photoUrl}
        
Este código es personal, solo lo puede presentar el acudiente registrado.`;

            const fullUrl = `https://api.whatsapp.com/send?phone=${dialDigits}${phoneDigits}&text=${encodeURIComponent(
              fullMessage
            )}`;
            setWhatsappUrl(fullUrl);

            // Short optimized message for on-screen QR code (drastically reduces QR density para lectura instantánea)
            const qrShortMessage = `¡Hola *${fullName}*! Tu código QR de Iglekids:\n${photoUrl}`;
            const qrScanUrl = `https://wa.me/${dialDigits}${phoneDigits}?text=${encodeURIComponent(qrShortMessage)}`;
            setQrCodeUrl(qrScanUrl);
          }
        } catch (err: any) {
          console.error('Error al generar QR para WhatsApp:', err);
        } finally {
          setIsGeneratingUrl(false);
        }
      }
    };

    generateWhatsappUrl();
  }, [guardian, dispatch]);

  const downloadCode = () => {
    const canvas: HTMLCanvasElement | null = document.getElementById(
      'qr-code-generate-kid-guardian'
    ) as HTMLCanvasElement;
    if (canvas && guardian) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `QR_${guardian.firstName}_${guardian.lastName}_${guardian.id}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success('Código QR descargado con éxito');
    }
  };

  const openWhatsapp = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank');
    } else {
      toast.error('Aún se está generando el enlace de WhatsApp');
    }
  };

  const handleFinish = () => {
    dispatch(cleanCurrentKidGuardian());
    navigate(APP_ROUTES.kidRegistration.root);
  };

  const isLoading = guardianLoading || isGeneratingUrl;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 pb-28 sm:pb-32">
      <PageHeader title="Generar Código QR" onBack={() => navigate(-1)} />

      <div className="p-4 max-w-md mx-auto flex flex-col gap-4 animate-in fade-in duration-300">
        {/* Buscador de Documento */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Cédula o Documento del Acudiente
          </label>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={nationalIdQuery}
                onChange={(e) => setNationalIdQuery(e.target.value)}
                placeholder="Ej: 1047480449"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className={clsx(
                  "block w-full pl-3.5 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-text-main focus:border-primary outline-none text-base font-semibold shadow-sm transition-colors",
                  nationalIdQuery ? "pr-10" : "pr-3"
                )}
              />
              {nationalIdQuery && (
                <button
                  type="button"
                  onClick={() => setNationalIdQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label="Limpiar cédula"
                >
                  <div className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-transform active:scale-90">
                    <X size={12} strokeWidth={2.5} />
                  </div>
                </button>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              loading={guardianLoading}
              className="px-4 shrink-0 rounded-xl"
            >
              <Search size={18} className="mr-1.5 inline" />
              Buscar
            </Button>
          </form>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-8 gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Loader2 className="animate-spin text-primary" size={36} />
            <p className="text-sm font-medium text-gray-500">
              {guardianLoading ? 'Buscando acudiente...' : 'Generando enlace QR...'}
            </p>
          </div>
        )}

        {/* Guardian View and QR code */}
        {!guardianLoading && guardian && (
          <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Guardian Data Card */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <User size={20} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-base font-bold text-gray-800 truncate">
                    {capitalizeWords(guardian.firstName)} {capitalizeWords(guardian.lastName)}
                  </h3>
                  <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <FileText size={12} />
                    {guardian.nationalIdType || 'CC'}: {guardian.nationalId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                <Phone size={14} className="text-gray-400" />
                <span>Teléfono:</span>
                <span className="text-gray-800">
                  {guardian.dialCodePhone || '+57'} {guardian.phone}
                </span>
              </div>
            </div>

            {/* Código QR Interactivo */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-white rounded-2xl border-2 border-gray-200 shadow-sm flex items-center justify-center">
                {qrCodeUrl ? (
                  <QRCode
                    value={qrCodeUrl}
                    size={300}
                    qrStyle="squares"
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                    ecLevel="L"
                    quietZone={10}
                    id="qr-code-generate-kid-guardian-whatsapp"
                  />
                ) : (
                  <div className="w-[300px] h-[300px] flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary" size={36} />
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 font-medium px-2 leading-relaxed">
                Pide al acudiente que escanee este código con su celular para abrir su mensaje de WhatsApp, o compárteselo directamente abajo.
              </p>
            </div>

            {/* Acciones */}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={openWhatsapp}
                disabled={!whatsappUrl || isGeneratingUrl}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                <MessageCircle size={18} />
                Compartir por WhatsApp
              </button>

              <Button onClick={downloadCode} block variant="default">
                <Download size={18} className="mr-2 inline" />
                Descargar QR
              </Button>

              <Button block disabled variant="ghost" className="opacity-50">
                <Printer size={18} className="mr-2 inline" />
                Imprimir (Próximamente)
              </Button>

              <div className="pt-2 border-t border-gray-100 mt-1">
                <Button onClick={handleFinish} block variant="primary">
                  <Check size={18} className="mr-2 inline" />
                  Finalizar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Estado Vacío o Error */}
        {!guardianLoading && !guardian && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center gap-3 mt-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
              {hasSearched ? <QrCode size={28} /> : <Search size={28} />}
            </div>
            <div>
              <h4 className="font-bold text-gray-700 text-base">
                {hasSearched ? 'Acudiente no encontrado' : 'Buscar acudiente'}
              </h4>
              <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
                {hasSearched
                  ? 'No se encontró ningún acudiente con la cédula ingresada. Verifica el número e intenta nuevamente.'
                  : 'Ingresa la cédula o número de documento del acudiente para generar su código QR personal.'}
              </p>
            </div>
          </div>
        )}

        {/* Canvas QR oculto para descargar y subir a S3 con logo */}
        {guardian && guardian.id && (
          <div className="absolute -left-[9999px] -top-[9999px] pointer-events-none">
            <QRCode
              value={guardian.id}
              size={512}
              qrStyle="dots"
              eyeRadius={12}
              fgColor="#000000"
              bgColor="#FFFFFF"
              logoImage="/logo-iglekids.png"
              logoHeight={140}
              logoWidth={220}
              logoOpacity={0.7}
              id="qr-code-generate-kid-guardian"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateGuardianQRView;
