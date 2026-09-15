import React from 'react';
import clsx from 'clsx';
import { ChevronRight, User as UserIcon } from 'lucide-react';
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
  iconType?: 'child' | 'user';
}

const Cell = ({
  title,
  subtitle,
  onClick,
  className,
  showChevron = true,
  photoUrl,
  gender,
  badge,
  isRegistered,
  isOverage,
  iconType = 'child',
}: CellProps) => {
  return (
    <div 
      onClick={onClick}
      className={clsx(
        "flex items-center gap-3 p-3.5 sm:p-4 transition-colors",
        isRegistered 
          ? "bg-slate-50/60 hover:bg-slate-100/80" 
          : isOverage 
            ? "bg-red-50/60 hover:bg-red-100/60 text-red-900" 
            : "bg-white hover:bg-gray-50/80",
        onClick && "cursor-pointer active:bg-gray-100/60",
        className
      )}
    >
      <div className={clsx(
        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden relative",
        !photoUrl && (gender === 'F' || (gender as string)?.toUpperCase() === 'FEMALE' ? "bg-pink-100 text-pink-500" : "bg-blue-100 text-blue-500")
      )}>
        {photoUrl ? (
          <img src={photoUrl} alt={title} className="w-full h-full object-cover" />
        ) : iconType === 'user' ? (
          <UserIcon size={20} />
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
