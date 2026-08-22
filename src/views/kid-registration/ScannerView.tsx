import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, Info, AlertTriangle } from 'lucide-react';
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { APP_ROUTES } from "@/config/routes";
import clsx from 'clsx';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
// Redux placeholders
// import { useDispatch, useSelector } from 'react-redux';
// import { ScanCodeKidRegistration, CreateKidRegistration, cleanScanQRSearch } from '@/libs/state/redux';

const StepProgress = ({ currentStep }: { currentStep: number }) => {
  return (
    <div className="bg-white px-4 py-4 border-b border-gray-100 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          {currentStep === 1 ? 'Paso 1: Escanear' : currentStep === 2 ? 'Paso 2: Selección' : 'Paso 3: Observaciones'}
        </span>
        <span className="text-xs font-medium text-gray-400">{currentStep} / 3</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${(currentStep / 3) * 100}%` }}
        />
      </div>
    </div>
  );
};

// Mock de la información que volvería de Redux tras escanear
const mockGuardian = { id: 'g1', firstName: 'Juan', lastName: 'Perez' };
const mockKids = [
  { id: 'k1', firstName: 'Pedrito', lastName: 'Perez', faithForgeId: '113390', kidGroup: { name: 'Párvulos' }, staticGroup: true, currentKidRegistration: null },
  { id: 'k2', firstName: 'María', lastName: 'Perez', faithForgeId: '113391', kidGroup: { name: 'Caminadores' }, staticGroup: false, currentKidRegistration: { id: 'reg1' } },
];

const ScannerView = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [scanResult, setScanResult] = useState<string | null>(null);
  
  // States for Step 2
  const [selectedKids, setSelectedKids] = useState<string[]>([]);
  
  // States for Step 3
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [expandedKid, setExpandedKid] = useState<string | null>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<'back' | 'cancel' | null>(null);

  // Interceptar back button
  useEffect(() => {
    if (step > 1) {
      window.history.pushState(null, '', window.location.href);
      const handlePopState = () => {
        setPendingNavigation('back');
        setShowCancelModal(true);
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [step]);

  const handleCancelClick = () => {
    if (step === 1) {
      navigate(APP_ROUTES.kidRegistration.root);
    } else {
      setPendingNavigation('cancel');
      setShowCancelModal(true);
    }
  };

  const handleConfirmCancel = () => {
    if (pendingNavigation === 'back') {
      window.history.back();
    } else {
      navigate(APP_ROUTES.kidRegistration.root);
    }
  };

  const handleCloseModal = (open: boolean) => {
    setShowCancelModal(open);
    if (!open && pendingNavigation === 'back') {
      window.history.pushState(null, '', window.location.href); 
    }
  };

  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    if (detectedCodes.length > 0 && !scanResult) {
      const code = detectedCodes[0].rawValue;
      setScanResult(code);
      // Simulate Redux delay & response
      setTimeout(() => {
        setStep(2);
      }, 500);
    }
  };

  const handleToggleKid = (kidId: string, isRegistered: boolean) => {
    if (isRegistered) return;
    setSelectedKids(prev => 
      prev.includes(kidId) ? prev.filter(id => id !== kidId) : [...prev, kidId]
    );
  };

  const handleConfirmKids = () => {
    if (selectedKids.length === 0) {
      toast.error("Seleccione al menos un niño para registrar");
      return;
    }
    // Expand the first selected kid for convenience
    setExpandedKid(selectedKids[0]);
    setStep(3);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // En un escenario real:
    // for (const kidId of selectedKids) {
    //    dispatch(CreateKidRegistration({ kidId, observation: observations[kidId] }))
    // }
    toast.success("¡Niños registrados con éxito!");
    navigate(APP_ROUTES.kidRegistration.root);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* TopBar Fija */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center shadow-md">
        <button onClick={handleCancelClick} className="flex items-center gap-1 opacity-90 hover:opacity-100">
          <ArrowLeft size={20} />
          <span className="font-medium">Registro por QR</span>
        </button>
      </div>

      <StepProgress currentStep={step} />

      <div className="p-4">
        
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col items-center">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 w-full mb-6">
              <h2 className="text-lg font-bold text-gray-800 text-center mb-2">Escanear Código</h2>
              <p className="text-sm text-gray-500 text-center mb-4">Apunta la cámara al código QR del acudiente para buscar a los niños asociados.</p>
              
              <div className="rounded-xl overflow-hidden bg-black aspect-square relative border-4 border-gray-100 shadow-inner">
                {/* Lector QR - Usando el mismo componente que tenían en el viejo */}
                <Scanner 
                  onScan={handleScan}
                  // paused={false}
                  components={{ finder: true }}
                />
              </div>
            </div>

            <Button 
              onClick={() => navigate('/kid-registration/generar-qr-acudiente')}
              block
              variant="default"
            >
              Generar QR Acudiente
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 text-center">
              <h1 className="text-2xl font-black text-gray-800 tracking-tight">Acudiente</h1>
              <p className="text-xl text-primary font-bold mt-1">{mockGuardian.firstName} {mockGuardian.lastName}</p>
              <p className="text-sm text-gray-500 mt-2">Confirme que sea el acudiente y seleccione los niños a registrar hoy.</p>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {mockKids.map(kid => {
                const isRegistered = !!kid.currentKidRegistration;
                const isSelected = selectedKids.includes(kid.id);
                
                return (
                  <div 
                    key={kid.id}
                    onClick={() => handleToggleKid(kid.id, isRegistered)}
                    className={clsx(
                      "p-4 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center",
                      isRegistered ? "bg-gray-100 border-gray-200 opacity-70" 
                      : isSelected ? "bg-primary/5 border-primary" 
                      : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
                    )}
                  >
                    <div>
                      <h3 className={clsx("font-bold text-lg", isRegistered ? "text-gray-500" : "text-gray-800")}>
                        {kid.firstName} {kid.lastName} {isRegistered && <span className="text-xs text-red-500 ml-1 font-bold">(Registrado)</span>}
                      </h3>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">Código: {kid.faithForgeId} • Salón: {kid.kidGroup.name} {kid.staticGroup && '(Estático)'}</p>
                    </div>
                    {!isRegistered && (
                      <div className={clsx(
                        "w-6 h-6 rounded-full flex items-center justify-center transition-colors border-2",
                        isSelected ? "bg-primary border-primary" : "border-gray-300 bg-white"
                      )}>
                        {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <Button 
              onClick={handleConfirmKids}
              block
              variant="primary"
            >
              Siguiente <ChevronRight size={18} className="ml-2 inline" />
            </Button>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 flex gap-3">
              <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-blue-800 font-medium leading-relaxed">
                Si los niños tienen alguna observación, por favor escríbala abriendo el desplegable correspondiente.
              </p>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {mockKids.filter(k => selectedKids.includes(k.id)).map(kid => {
                const isExpanded = expandedKid === kid.id;
                
                return (
                  <div key={kid.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div 
                      onClick={() => setExpandedKid(isExpanded ? null : kid.id)}
                      className="p-4 flex justify-between items-center cursor-pointer bg-white"
                    >
                      <h3 className="font-bold text-gray-800">
                        {kid.firstName} {kid.lastName}
                        <span className="block text-xs text-gray-500 font-medium mt-0.5">{kid.kidGroup.name} {kid.staticGroup && '(Estático)'}</span>
                      </h3>
                      <ChevronRight size={20} className={clsx("text-gray-400 transition-transform duration-300", isExpanded && "rotate-90")} />
                    </div>
                    
                    <div className={clsx(
                      "px-4 transition-all duration-300 ease-in-out",
                      isExpanded ? "max-h-[200px] pb-4 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                    )}>
                      <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Observaciones</label>
                      <textarea 
                        className="block w-full rounded-xl border-2 border-gray-200 bg-gray-50 text-text-main py-3 px-3 focus:border-primary focus:ring-0 transition-colors outline-none text-sm"
                        rows={3}
                        maxLength={300}
                        placeholder="Ejemplo: lleva bolso, lleva merienda, está enfermo..."
                        value={observations[kid.id] || ''}
                        onChange={(e) => setObservations({...observations, [kid.id]: e.target.value})}
                      ></textarea>
                    </div>
                  </div>
                )
              })}
            </div>

            <Button 
              type="submit"
              block
              variant="success"
            >
              <Check size={20} className="mr-2 inline" /> Registrar Niños
            </Button>
          </form>
        )}
      </div>

      <ConfirmModal
        open={showCancelModal}
        onOpenChange={handleCloseModal}
        title="¿Cancelar el escaneo?"
        description="Se perderá el progreso de los niños seleccionados."
        confirmText="Sí, cancelar"
        cancelText="Continuar escaneando"
        onConfirm={handleConfirmCancel}
        type="danger"
      />
    </div>
  );
};

export default ScannerView;
