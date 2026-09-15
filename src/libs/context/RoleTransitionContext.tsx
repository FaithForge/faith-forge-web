import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, LucideIcon } from 'lucide-react';

export interface RoleTransitionInfo {
  roleTitle: string;
  moduleName?: string;
  groupName?: string | null;
  themeClass?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string; size?: number }>;
}

interface RoleTransitionContextType {
  startTransition: (info: RoleTransitionInfo, onMidway?: () => void) => void;
  isTransitioning: boolean;
}

const RoleTransitionContext = createContext<RoleTransitionContextType>({
  startTransition: () => {},
  isTransitioning: false,
});

export const useRoleTransition = () => useContext(RoleTransitionContext);

export const RoleTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transitionInfo, setTransitionInfo] = useState<RoleTransitionInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const midwayRef = useRef<NodeJS.Timeout | null>(null);

  const startTransition = useCallback((info: RoleTransitionInfo, onMidway?: () => void) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (midwayRef.current) clearTimeout(midwayRef.current);

    setTransitionInfo(info);
    setIsVisible(true);

    // Apply the theme immediately so the background and primary colors transform
    if (info.themeClass && typeof document !== 'undefined') {
      document.body.className = `${info.themeClass} antialiased`;
    }

    // Mid-point: execute route change or state switch behind the overlay
    midwayRef.current = setTimeout(() => {
      onMidway?.();
    }, 360);

    // End point: fade out the transition screen
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setTransitionInfo(null);
      }, 280);
    }, 820);
  }, []);

  const IconComponent = transitionInfo?.icon || Sparkles;

  return (
    <RoleTransitionContext.Provider value={{ startTransition, isTransitioning: isVisible }}>
      {children}
      <AnimatePresence>
        {isVisible && transitionInfo && (
          <motion.div
            key="role-transition-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-md px-6 select-none pointer-events-auto"
          >
            <motion.div
              key="role-transition-card"
              initial={{ scale: 0.88, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: -10 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="w-full max-w-[320px] bg-white rounded-3xl p-6 shadow-2xl border border-white/80 flex flex-col items-center text-center overflow-hidden relative"
            >
              {/* Top ambient color glow from theme primary */}
              <div className="absolute -top-14 inset-x-0 h-28 bg-primary/20 blur-2xl pointer-events-none rounded-full" />

              {/* Animated pulsing icon in primary theme color */}
              <motion.div
                initial={{ scale: 0.6, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 240 }}
                className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3.5 shadow-xs border border-primary/15 relative shrink-0"
              >
                <IconComponent size={30} className="stroke-[2.2]" />
                <motion.div
                  animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-2xl border-2 border-primary"
                />
              </motion.div>

              {/* Pill badge */}
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider mb-1.5 border border-primary/15">
                <Sparkles size={11} className="shrink-0" />
                <span>Cambiando a</span>
              </div>

              {/* Role Title */}
              <h3 className="text-base font-black text-gray-900 tracking-tight leading-snug">
                {transitionInfo.roleTitle}
              </h3>

              {/* Module & Group Subtitle */}
              {(transitionInfo.moduleName || transitionInfo.groupName) && (
                <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
                  {transitionInfo.moduleName && (
                    <span className="text-xs font-bold text-gray-500">
                      {transitionInfo.moduleName}
                    </span>
                  )}
                  {transitionInfo.moduleName && transitionInfo.groupName && (
                    <span className="text-gray-300 text-xs">•</span>
                  )}
                  {transitionInfo.groupName && (
                    <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/15">
                      {transitionInfo.groupName}
                    </span>
                  )}
                </div>
              )}

              {/* Animated loading bar */}
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-5 overflow-hidden">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 0.85, ease: 'easeInOut' }}
                  className="w-1/2 h-full bg-primary rounded-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </RoleTransitionContext.Provider>
  );
};
