import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { AlertTriangle } from 'lucide-react';
import { customizeStatusBar, hideSplashScreen, addNetworkListener } from '../../utils/capacitorHelper';

export default function MainLayout() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Set status bar styling and hide native splash screen
    customizeStatusBar();
    hideSplashScreen();

    // Setup network status changes listener
    const removeListener = addNetworkListener((connected) => {
      setIsOffline(!connected);
    });

    return () => {
      removeListener();
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans flex-col">
      {isOffline && (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2 z-50 shadow-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          You are currently offline. Some features may not work properly.
        </div>
      )}
      <div className="flex flex-1 h-full overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
