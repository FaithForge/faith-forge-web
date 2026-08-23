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
  badge?: React.ReactNode;
  isRegistered?: boolean;
  isOverage?: boolean;
}

const Cell = ({ title, subtitle, onClick, className, showChevron = true, photoUrl, gender, badge, isRegistered, isOverage }: CellProps) => {
  return (
    <div 
      onClick={onClick}
      className={clsx(
        "flex items-center gap-3 p-3 rounded-xl border shadow-sm transition-colors",
        isRegistered 
          ? "bg-slate-100 border-slate-200" 
          : isOverage 
            ? "bg-red-50 border-red-200 text-red-900" 
            : "bg-surface border-gray-100",
        onClick && (
          isRegistered 
            ? "cursor-pointer active:scale-[0.98] hover:bg-slate-200/80" 
            : isOverage 
              ? "cursor-pointer active:scale-[0.98] hover:bg-red-100" 
              : "cursor-pointer active:scale-[0.98] active:bg-gray-50 hover:bg-gray-50"
        ),
        className
      )}
    >
      <div className={clsx(
        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden relative",
        !photoUrl && (gender === 'F' || (gender as string)?.toUpperCase() === 'FEMALE' ? "bg-pink-100 text-pink-500" : "bg-blue-100 text-blue-500")
      )}>
        {photoUrl ? (
          <img src={photoUrl} alt={title} className="w-full h-full object-cover" />
        ) : gender === 'F' || (gender as string)?.toUpperCase() === 'FEMALE' ? (
          <FaChildDress size={20} />
        ) : (
          <FaChild size={20} />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-text-main truncate text-sm">{title}</h4>
        {subtitle && (
          <p className={clsx("text-[11px] truncate mt-0.5", isOverage ? "text-red-700 font-medium" : "text-text-muted")}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {badge}
        {showChevron && (
          <ChevronRight size={18} className="text-gray-400" />
        )}
      </div>
    </div>
  );
};

export default Cell;
