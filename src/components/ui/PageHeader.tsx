import React from 'react';
import { ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

interface PageHeaderProps {
  title: string;
  onBack: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

/**
 * Reusable aesthetic centered PageHeader with back button.
 * Matches the centered, sleek style across all sub-views.
 *
 * @param {PageHeaderProps} props - Title, onBack callback, optional rightAction, and custom className.
 * @returns {JSX.Element}
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  onBack,
  rightAction,
  className,
}) => {
  return (
    <div
      className={clsx(
        'bg-primary text-primary-foreground px-4 py-2 sticky top-0 z-30 flex items-center justify-between border-0 shadow-none',
        className
      )}
    >
      <button
        type="button"
        onClick={onBack}
        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all text-primary-foreground shrink-0 outline-none"
        title="Volver"
      >
        <ArrowLeft size={20} />
      </button>

      <h1 className="text-sm sm:text-base font-bold text-center truncate flex-1 px-2 pointer-events-none">
        {title}
      </h1>

      <div className="w-8 flex items-center justify-end shrink-0">
        {rightAction ? rightAction : <div className="w-8 h-8" />}
      </div>
    </div>
  );
};

export default PageHeader;
