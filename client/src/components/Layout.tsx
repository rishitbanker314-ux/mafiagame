import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  agentId?: string;
  onFileReport?: () => void;
}

export default function Layout({ children, agentId = '042', showNav = true }: LayoutProps) {
  return (
    <div className="bg-surface-dim text-on-surface font-body-md min-h-screen selection:bg-primary selection:text-on-primary">
      <div className="noise-overlay"></div>
      
      {showNav && (
        <>
          {/* Top Bar Component */}
          <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-gutter h-16 bg-background text-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-b-2 border-outline-variant">
            <div className="font-headline-md text-headline-md text-on-surface uppercase tracking-tighter">THE DOSSIER</div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary text-on-primary flex items-center justify-center font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="material-symbols-outlined text-sm">shield</span>
              </div>
              <div className="hidden md:block">
                <div className="font-label-lg text-label-sm leading-tight">AGENT_{agentId}</div>
                <div className="font-label-sm text-[10px] text-outline">STATUS: UNDERCOVER</div>
              </div>
            </div>
          </nav>
        </>
      )}

      {/* Main Content Area */}
      <main className={`${showNav ? 'pt-16' : ''} w-full relative overflow-x-hidden bg-surface-dim vignette min-h-screen`}>
        {/* Background Decoration */}
        <div className="fixed inset-0 z-0 opacity-10 flex items-center justify-center pointer-events-none">
          <div className="text-[100px] md:text-[200px] font-bold text-outline-variant select-none tracking-tighter opacity-20 whitespace-nowrap">TOP SECRET</div>
        </div>
        <div className="relative z-10 w-full h-full p-4 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
