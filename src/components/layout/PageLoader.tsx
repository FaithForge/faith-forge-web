import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Lightweight fallback loader displayed while lazy-loaded views are downloaded.
 * Styled with the Iglekids theme and mobile-first layout.
 */
const PageLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full p-6 animate-in fade-in duration-200">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold text-gray-400 tracking-wider uppercase">
        Cargando Iglekids...
      </p>
    </div>
  );
};

export default PageLoader;
