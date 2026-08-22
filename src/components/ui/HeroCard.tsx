import React from 'react';
import clsx from 'clsx';

interface HeroCardProps {
  subtitle: string;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
  };
  className?: string;
}

const HeroCard = ({ subtitle, title, description, primaryAction, className }: HeroCardProps) => {
  return (
    <div className={clsx("bg-primary rounded-2xl p-5 text-primary-foreground shadow-lg mb-6", className)}>
      <div className="inline-block bg-white/20 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider mb-3">
        {subtitle}
      </div>
      
      <h2 className="text-2xl font-bold mb-1 leading-tight">{title}</h2>
      <p className="text-sm opacity-90 mb-5">{description}</p>
      
      {primaryAction && (
        <button 
          onClick={primaryAction.onClick}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm"
        >
          <primaryAction.icon size={20} />
          {primaryAction.label}
        </button>
      )}
    </div>
  );
};

export default HeroCard;
