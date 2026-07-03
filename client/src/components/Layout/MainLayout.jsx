import { useState, Suspense, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

// Sub-page Loading Fallback for faster perceived load times
const ContentLoader = () => (
  <div className="h-full min-h-[300px] w-full flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
  </div>
);

// Adsterra 468x60 Banner — rendered natively so the ad script works inside React
const AdsterraStickyBanner = () => {
  const bannerRef = useRef(null);
  useEffect(() => {
    if (bannerRef.current && !bannerRef.current.firstChild) {
      const conf = document.createElement('script');
      conf.innerHTML = `atOptions = { 'key':'e4f2d2adff35a81bfa15194698f7d390','format':'iframe','height':60,'width':468,'params':{} }`;
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://www.highperformanceformat.com/e4f2d2adff35a81bfa15194698f7d390/invoke.js';
      bannerRef.current.appendChild(conf);
      bannerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full flex justify-center items-center py-2 bg-white border-t border-gray-100 shrink-0">
      <div
        ref={bannerRef}
        className="w-[468px] h-[60px] flex items-center justify-center overflow-hidden bg-gray-50 border border-dashed border-gray-200 rounded text-[9px] text-gray-300 uppercase tracking-wider font-bold relative"
      >
        <span className="absolute pointer-events-none">Advertisement</span>
      </div>
    </div>
  );
};

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Suspense fallback={<ContentLoader />}>
            <Outlet />
          </Suspense>
        </main>
        {/* Global Adsterra banner — visible on every page */}
        <AdsterraStickyBanner />
      </div>
    </div>
  );
}
