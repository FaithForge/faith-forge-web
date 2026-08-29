import React, { useState, useRef, useCallback } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import clsx from 'clsx';

interface PullToRefreshProps {
  onRefresh: () => Promise<any> | void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const PULL_THRESHOLD = 65;
const MAX_PULL = 110;
const DAMPING = 0.45;

/**
 * Reusable Pull-To-Refresh container for mobile lists.
 * Allows users to swipe down at the top of the list to refresh data without reloading the browser page.
 *
 * @param {PullToRefreshProps} props - Refresh handler and child components.
 * @returns {JSX.Element}
 */
const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
  className,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const isPullingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getScrollTop = (): number => {
    // Check main layout scroll or local container scroll
    const mainEl = document.querySelector('main');
    if (mainEl && mainEl.scrollTop > 0) {
      return mainEl.scrollTop;
    }
    if (containerRef.current && containerRef.current.scrollTop > 0) {
      return containerRef.current.scrollTop;
    }
    return window.scrollY || document.documentElement.scrollTop || 0;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    if (getScrollTop() <= 2) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = false;
    } else {
      startYRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || startYRef.current === null) return;

    if (getScrollTop() > 2) {
      if (pullDistance > 0) setPullDistance(0);
      startYRef.current = null;
      isPullingRef.current = false;
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0) {
      isPullingRef.current = true;
      const distance = Math.min(MAX_PULL, diff * DAMPING);
      setPullDistance(distance);
    } else {
      setPullDistance(0);
      isPullingRef.current = false;
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing || !isPullingRef.current) {
      startYRef.current = null;
      setPullDistance(0);
      return;
    }

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(48); // Lock at indicator height during refresh
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }

    startYRef.current = null;
    isPullingRef.current = false;
  };

  const isReadyToRelease = pullDistance >= PULL_THRESHOLD;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={clsx('relative w-full flex-1 flex flex-col min-h-0', className)}
    >
      {/* Pull Indicator Area */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all pointer-events-none shrink-0"
        style={{
          height: isRefreshing ? 48 : pullDistance,
          transition: isPullingRef.current ? 'none' : 'height 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <div className="flex items-center gap-2 py-2 px-3.5 rounded-full bg-white shadow-sm border border-gray-100 text-xs font-bold text-gray-600">
          {isRefreshing ? (
            <>
              <Loader2 size={16} className="text-primary animate-spin" />
              <span>Actualizando lista...</span>
            </>
          ) : isReadyToRelease ? (
            <>
              <ArrowDown size={16} className="text-primary rotate-180 transition-transform duration-200" />
              <span className="text-primary">Soltar para actualizar</span>
            </>
          ) : (
            <>
              <ArrowDown
                size={16}
                className="text-gray-400 transition-transform duration-150"
                style={{ transform: `rotate(${Math.min(180, (pullDistance / PULL_THRESHOLD) * 180)}deg)` }}
              />
              <span className="text-gray-500">Desliza para actualizar</span>
            </>
          )}
        </div>
      </div>

      {/* List Content */}
      <div
        className="flex-1 flex flex-col min-h-0"
        style={{
          transform: isRefreshing ? 'translateY(0)' : `translateY(0px)`,
          transition: isPullingRef.current ? 'none' : 'transform 0.25s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
