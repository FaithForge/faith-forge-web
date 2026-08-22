import React from 'react';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';
import { FaChild, FaChildDress } from 'react-icons/fa6';

interface CellProps {
  title: string;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
  showChevron?: boolean;
  photoUrl?: string;
  gender?: 'M' | 'F' | string;
}

const Cell = ({ title, subtitle, onClick, className, showChevron = true, photoUrl, gender }: CellProps) => {
  return (
    <div 
      onClick={onClick}
      className={clsx(
        "flex items-center gap-3 bg-surface p-3 rounded-xl border border-gray-100 shadow-sm transition-colors",
        onClick && "cursor-pointer active:scale-[0.98] active:bg-gray-50",
        className
      )}
    >
      <div className={clsx(
        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden",
        !photoUrl && (gender === 'F' ? "bg-pink-100 text-pink-500" : "bg-blue-100 text-blue-500")
      )}>
        {photoUrl ? (
          <img src={photoUrl} alt={title} className="w-full h-full object-cover" />
        ) : gender === 'F' ? (
          <FaChildDress size={20} />
        ) : (
          <FaChild size={20} />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-text-main truncate text-sm">{title}</h4>
        {subtitle && (
          <p className="text-text-muted text-[11px] truncate mt-0.5">{subtitle}</p>
        )}
      </div>

      {showChevron && (
        <ChevronRight size={18} className="text-gray-400 shrink-0" />
      )}
    </div>
  );
};

export default Cell;
