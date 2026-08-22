import React from 'react';
import clsx from 'clsx';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

interface AlertProps {
  type: 'error' | 'success' | 'info' | 'warning';
  title?: string;
  message: string;
  className?: string;
}

const iconMap = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
};

const colorMap = {
  error: 'bg-red-100 text-red-800 border-red-200',
  success: 'bg-green-100 text-green-800 border-green-200',
  info: 'bg-cyan-100 text-cyan-800 border-cyan-200', // Similar al cyan de la impresora en la imagen
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const Alert = ({ type, title, message, className }: AlertProps) => {
  const Icon = iconMap[type];

  return (
    <div className={clsx('flex items-start gap-3 p-3 rounded-xl border text-sm', colorMap[type], className)}>
      <Icon size={18} className="shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <h4 className="font-bold mb-0.5">{title}</h4>}
        <p className="opacity-90 leading-tight">{message}</p>
      </div>
    </div>
  );
};

export default Alert;
