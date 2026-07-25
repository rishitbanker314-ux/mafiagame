import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RoleRevealProps {
  roleName: string;
  onAcknowledge: () => void;
}

export default function RoleReveal({ roleName, onAcknowledge }: RoleRevealProps) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 3000);
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1 } }}
      className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[100] px-4 text-center overflow-hidden"
    >
      {/* Background ambient glow based on role */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at center, ${
            roleName.toLowerCase() === 'mafia' ? 'rgba(220,38,38,0.5)' : 
            roleName.toLowerCase() === 'doctor' ? 'rgba(34,197,94,0.5)' : 
            roleName.toLowerCase() === 'detective' ? 'rgba(59,130,246,0.5)' : 
            roleName.toLowerCase() === 'jester' ? 'rgba(217,70,239,0.5)' : 
            'rgba(148,163,184,0.5)'
          } 0%, transparent 70%)`
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-2xl">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-slate-400 text-sm md:text-lg tracking-[0.3em] uppercase mb-4"
        >
          You are the
        </motion.p>
        
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, delay: 1, ease: 'easeOut' }}
          className="text-5xl md:text-8xl font-black uppercase tracking-widest text-white mb-12 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
        >
          {roleName}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 2.5 }}
          className="text-lg md:text-2xl text-slate-300 italic font-light font-serif mb-16"
        >
          "{flavorQuote}"
        </motion.p>

        <AnimatePresence>
          {showButton && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAcknowledge}
              className="px-8 py-3 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium tracking-wider uppercase transition-colors"
            >
              Continue to Game
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
