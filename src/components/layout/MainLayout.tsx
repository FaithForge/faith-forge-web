import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import TopBar from './TopBar';
import { NavigationGuardProvider } from '@/libs/context/NavigationGuardContext';
import { useAppSelector } from '@/libs/state/redux/hooks';

const MainLayout = () => {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  const currentMeeting = useAppSelector(state => state.churchMeetingSlice.current);
  const currentPrinter = useAppSelector(state => state.churchPrinterSlice.current);
  const isConfigured = !!currentMeeting && !!currentPrinter;

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname]);

  return (
    <NavigationGuardProvider>
      <div className="flex flex-col h-screen bg-background text-text-main overflow-hidden relative">
        <div className="shrink-0 z-[120] relative pointer-events-auto">
          <TopBar />
        </div>

        {/* Main scrollable area */}
        <main ref={mainRef} className="flex-1 overflow-y-auto pb-[80px] relative">
          <Outlet />
        </main>

        {/* Fixed bottom navigation */}
        <BottomNav />
      </div>
    </NavigationGuardProvider>
  );
};

export default MainLayout;
