import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  agentId?: string;
  onFileReport?: () => void;
}

export default function Layout({ children, showNav = true, agentId = '042', onFileReport }: LayoutProps) {
  return (
    <div className="bg-surface-dim text-on-surface font-body-md min-h-screen selection:bg-primary selection:text-on-primary">
      <div className="noise-overlay"></div>
      
      {showNav && (
        <>
          {/* Top Bar Component */}
          <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter h-16 bg-background text-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-b-2 border-outline-variant">
            <div className="font-headline-md text-headline-md text-on-surface uppercase tracking-tighter">THE DOSSIER</div>
            <div className="hidden md:flex items-center gap-8 h-full">
              <a className="font-body-md text-body-md uppercase tracking-widest text-on-surface border-b-2 border-on-surface h-full flex items-center px-4 hover:bg-surface-container-high transition-colors active:translate-y-1" href="#">LOBBY</a>
              <a className="font-body-md text-body-md uppercase tracking-widest text-outline h-full flex items-center px-4 hover:bg-surface-container-high transition-colors active:translate-y-1" href="#">INTEL</a>
              <a className="font-body-md text-body-md uppercase tracking-widest text-outline h-full flex items-center px-4 hover:bg-surface-container-high transition-colors active:translate-y-1" href="#">ARCHIVE</a>
            </div>
            <div className="flex gap-4">
              <span className="material-symbols-outlined hover:bg-surface-container-high transition-colors p-2 cursor-pointer active:translate-y-1">radio</span>
              <span className="material-symbols-outlined hover:bg-surface-container-high transition-colors p-2 cursor-pointer active:translate-y-1" style={{ fontVariationSettings: "'FILL' 1" }}>fingerprint</span>
              <span className="material-symbols-outlined hover:bg-surface-container-high transition-colors p-2 cursor-pointer active:translate-y-1">history</span>
            </div>
          </nav>

          {/* Side Nav Component */}
          <aside className="fixed left-0 top-0 h-full flex flex-col z-40 bg-surface-container text-on-surface w-64 border-r-2 border-outline-variant shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] pt-20">
            <div className="p-6 mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary text-on-primary flex items-center justify-center font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <span className="material-symbols-outlined">shield</span>
                </div>
                <div>
                  <div className="font-label-lg text-label-lg leading-tight">AGENT_{agentId}</div>
                  <div className="font-label-sm text-label-sm text-outline">STATUS: UNDERCOVER</div>
                </div>
              </div>
            </div>
            <nav className="flex-1 px-4 space-y-2">
              <a className="flex items-center gap-3 p-3 font-body-lg text-body-lg uppercase tracking-tight bg-primary text-on-primary font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform duration-75 active:scale-95" href="#">
                <span className="material-symbols-outlined">folder_open</span>
                <span>EVIDENCE</span>
              </a>
              <a className="flex items-center gap-3 p-3 font-body-lg text-body-lg uppercase tracking-tight text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-transform duration-75 active:scale-95" href="#">
                <span className="material-symbols-outlined">groups</span>
                <span>SUSPECTS</span>
              </a>
              <a className="flex items-center gap-3 p-3 font-body-lg text-body-lg uppercase tracking-tight text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-transform duration-75 active:scale-95" href="#">
                <span className="material-symbols-outlined">description</span>
                <span>DEATH_REPORTS</span>
              </a>
              <a className="flex items-center gap-3 p-3 font-body-lg text-body-lg uppercase tracking-tight text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-transform duration-75 active:scale-95" href="#">
                <span className="material-symbols-outlined">lock_open</span>
                <span>CIPHERS</span>
              </a>
            </nav>
            <div className="p-6">
              <button onClick={onFileReport} className="w-full py-4 bg-secondary-fixed text-on-secondary-fixed font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-secondary-fixed-dim transition-all active:translate-y-1 active:shadow-none">
                FILE_REPORT
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <main className={`${showNav ? 'ml-64 pt-16' : ''} flex-1 relative overflow-hidden bg-surface-dim vignette min-h-screen`}>
        {/* Background Decoration */}
        <div className="absolute inset-0 z-0 opacity-10 flex items-center justify-center pointer-events-none">
          <div className="text-[200px] font-bold text-outline-variant select-none tracking-tighter opacity-20 whitespace-nowrap">TOP SECRET</div>
        </div>
        <div className="relative z-10 w-full h-full p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
