import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RoleRevealProps {
  roleName: string;
  onAcknowledge: () => void;
}

export default function RoleReveal({ roleName, onAcknowledge }: RoleRevealProps) {
  const [showStamp, setShowStamp] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStamp(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  let flavorQuote = '';
  switch (roleName.toLowerCase()) {
    case 'mafia':
      flavorQuote = 'The shadows are your only allies. Trust no one else.';
      break;
    case 'doctor':
      flavorQuote = 'In a city of death, your hands hold the only cure.';
      break;
    case 'detective':
      flavorQuote = 'The truth is hidden in plain sight. Uncover it.';
      break;
    case 'jester':
      flavorQuote = 'Sanity is a prison. Let chaos reign.';
      break;
    case 'villager':
      flavorQuote = 'Ignorance was bliss. Now, it is a death sentence.';
      break;
    default:
      flavorQuote = 'Survive the night.';
      break;
  }

  const handleAccept = () => {
    setAccepted(true);
    setTimeout(() => {
      onAcknowledge();
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1 } }}
      className="fixed inset-0 bg-background text-on-surface z-[100] flex flex-col items-center justify-center overflow-hidden font-body-md"
    >
      <div className="grain-overlay opacity-10"></div>
      <div className="vignette"></div>

      <main className="relative min-h-screen w-full flex items-center justify-center p-gutter z-20">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            className="w-full h-full object-cover grayscale brightness-50 opacity-60" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTe49v_NwGS41GQMOCx5IDEgnaBLAQ8dhYJtYw8jBY4oY4K70QapJvA_HTTH5K73AGEBQ41T-pjVlieSKd2d4gfq1a2mn1JIxkH4ZfPYKiAkXEI9IWbkiNwzLh2qRMIaWHxx04mr3nTp5G75ycZUi1gGEPSUC59xUN7Sw4erwfik9PolUjVSN2lKvUsJFPEnihH4uLHIsLESwH-vRCK4N5lm-hqXKDJeYE4FkjVjfpUaDVk8JkJw1EASE5i2LBqJJSa-2umD67lfM"
            alt="Noir background"
          />
        </div>

        <div className="relative z-20 max-w-3xl w-full flex flex-col items-center">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1, type: "spring" }}
            className={`dossier-card torn-edge p-12 w-full text-center space-y-8 bg-surface-container border border-outline-variant shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${accepted ? 'animate-pulse' : ''}`}
          >
            <div className="inline-block border-4 border-error p-4 rotate-[-2deg] mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h1 className="font-display-lg text-2xl sm:text-4xl md:text-[64px] text-error uppercase leading-none font-extrabold tracking-tighter break-words text-center">
                YOUR ASSIGNMENT: {roleName}
              </h1>
            </div>

            <div className="space-y-4 px-8">
              <p className="font-body-lg text-body-lg text-on-surface max-w-xl mx-auto italic">
                "{flavorQuote}"
              </p>
              <div className="h-[1px] w-full border-b border-dashed border-outline-variant my-6"></div>
              <p className="font-body-md text-body-md text-outline uppercase tracking-widest">
                OBJECTIVE: SURVIVE THE NIGHT.
                <br/>
                LOCATION: THE VANGUARD SOCIAL CLUB.
              </p>
            </div>

            <AnimatePresence>
              {showStamp && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="pt-10 flex flex-col items-center"
                >
                  <button 
                    onClick={handleAccept}
                    disabled={accepted}
                    className="group relative h-32 w-32 rounded-full bg-[#690005] border-2 border-[#93000a] flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform active:translate-y-1 active:shadow-none"
                  >
                    <div className="absolute inset-2 border border-[#ffdad6] border-dashed rounded-full opacity-30"></div>
                    <div className="relative z-10 flex flex-col items-center">
                      <span className="material-symbols-outlined text-[40px] text-on-error mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>fingerprint</span>
                      <span className="font-label-sm text-[10px] text-on-error font-bold text-center leading-none">I ACCEPT<br/>MY FATE</span>
                    </div>
                    <div className="absolute inset-0 rounded-full shadow-inner pointer-events-none" style={{ boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)' }}></div>
                  </button>
                  <p className="mt-4 font-label-sm text-outline-variant uppercase">Sign with thumbprint to initiate protocol</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-12 text-outline font-label-sm uppercase tracking-widest relative z-20 items-center text-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>02:14 AM</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">location_on</span>
              <span>DISTRICT 4</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">encrypted</span>
              <span>SECURE LINK</span>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {accepted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            {/* Scan-line background (Mobile Optimized) */}
            <div className="absolute inset-0 bg-black/95">
              {/* Red sweep line */}
              <div className="absolute left-0 right-0 h-[2px]" style={{
                background: 'linear-gradient(90deg, transparent, #dc2626, transparent)',
                animation: 'sweepDown 2s ease-in-out infinite',
                top: '0%',
              }} />
            </div>

            <div className="relative z-10 text-center px-4 w-full overflow-hidden">
              <h2 className="font-display-lg text-xl sm:text-4xl md:text-6xl uppercase tracking-tighter sm:tracking-widest md:tracking-[0.3em]" style={{
                color: '#dc2626',
                textShadow: '0 0 20px rgba(220,38,38,0.4)',
                animation: 'typeReveal 0.8s steps(20, end) forwards',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                borderRight: '3px solid #dc2626',
                margin: '0 auto',
                display: 'inline-block'
              }}>
                PROTOCOL INITIATED
              </h2>
              <p className="mt-4 text-[10px] md:text-xs uppercase tracking-[0.4em] md:tracking-[0.5em] text-gray-400" style={{ animation: 'fadeInUp 0.6s ease-out 0.8s both' }}>
                PREPARING FOR NIGHT PHASE...
              </p>
            </div>
            
            <style>{`
              @keyframes sweepDown {
                0% { top: 0%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
              }
              @keyframes typeReveal {
                from { max-width: 0; }
                to { max-width: 100%; }
              }
              @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(15px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
