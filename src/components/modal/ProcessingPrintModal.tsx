import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, Loader2, Bluetooth, CheckCircle2 } from 'lucide-react';

interface ProcessingPrintModalProps {
  open: boolean;
  isBluetooth?: boolean;
  stepText?: string;
}

/**
 * Modal overlay to provide visual feedback during kid registration and printing operations.
 */
const ProcessingPrintModal: React.FC<ProcessingPrintModalProps> = ({
  open,
  isBluetooth = false,
  stepText = 'Procesando registro...',
}) => {
  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 flex flex-col items-center text-center z-10"
        >
          {/* Animated Icon */}
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {isBluetooth ? (
                <Bluetooth size={36} className="animate-pulse text-primary" />
              ) : (
                <Printer size={36} className="animate-pulse text-primary" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm">
              <Loader2 size={20} className="animate-spin text-primary" />
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {isBluetooth ? 'Imprimiendo por Bluetooth' : 'Procesando Registro'}
          </h3>

          <p className="text-sm text-gray-500 mb-4 px-2">
            {isBluetooth
              ? 'Enviando comandos e imprimiendo etiqueta en la impresora térmica...'
              : 'Guardando registro y enviando orden de impresión...'}
          </p>

          {/* Status badge */}
          <div className="w-full bg-gray-50 rounded-2xl p-3 border border-gray-100 flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-primary shrink-0" />
            <span className="text-xs font-semibold text-gray-700 truncate">
              {stepText}
            </span>
          </div>

          <p className="text-[11px] text-gray-400 mt-4">
            Por favor espera un momento sin cerrar la ventana.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProcessingPrintModal;
