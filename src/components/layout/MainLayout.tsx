import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import TopBar from './TopBar';

const MainLayout = () => {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname]);

  return (
    <div className="flex flex-col h-screen bg-background text-text-main overflow-hidden relative">
      <div className="shrink-0 z-50 shadow-sm relative">
        <TopBar />
      </div>

      {/* Main scrollable area */}
      <main ref={mainRef} className="flex-1 overflow-y-auto pb-[80px]">
        <Outlet />
      </main>

      {/* Fixed bottom navigation */}
      <BottomNav />
    </div>
  );
};

export default MainLayout;
