import { useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { RevealedRole } from '../App';

interface GameOverViewProps {
  socket: Socket;
  winner: string | null;
  revealedRoles: RevealedRole[];
  isHost: boolean;
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.5 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8, x: -20 },
  show: { opacity: 1, scale: 1, x: 0 },
};

export default function GameOverView({ socket, winner, revealedRoles, isHost }: GameOverViewProps) {
  useEffect(() => {
    // Fire confetti when component mounts
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = winner === 'village' 
      ? ['#4ade80', '#22c55e', '#ffffff'] 
      : winner === 'mafia'
      ? ['#ef4444', '#b91c1c', '#000000']
      : winner === 'jester'
      ? ['#d946ef', '#c026d3', '#000000']
      : ['#facc15', '#eab308', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, [winner]);

  function handlePlayAgain() {
    socket.emit('reset_game');
  }

  // Determine header text and styles based on winner
  let themeColor = 'bg-slate-900';
  let titleColor = 'text-white';
  let titleText = 'Game Over';
  let icon = '🏁';

  if (winner === 'mafia') {
    themeColor = 'bg-red-950/40';
    titleColor = 'text-red-500';
    titleText = 'Mafia Wins!';
    icon = '🔪';
  } else if (winner === 'village') {
    themeColor = 'bg-emerald-950/40';
    titleColor = 'text-emerald-500';
    titleText = 'Village Wins!';
    icon = '🛡️';
  } else if (winner === 'jester') {
    themeColor = 'bg-fuchsia-950/40';
    titleColor = 'text-fuchsia-400';
    titleText = 'The Jester Wins!';
    icon = '🃏';
  } else if (winner) {
    titleText = `${winner.charAt(0).toUpperCase() + winner.slice(1)} Wins!`;
    titleColor = 'text-yellow-400';
  }

  const headerText = titleText;
  const headerColor = `${titleColor} drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div 
        className="glass-card glow-border max-w-2xl w-full p-8 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        
        {/* Massive Header */}
        <motion.h1 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className={`text-4xl md:text-6xl font-black uppercase tracking-widest mb-8 ${headerColor} animate-float`}
        >
          {headerText}
        </motion.h1>

        {/* Role Reveal List */}
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.4 }}
          className="bg-surface-800/80 rounded-xl border border-white/10 overflow-hidden mb-8 text-left"
        >
          <div className="p-4 border-b border-white/5 bg-surface-900/50">
            <h2 className="text-lg font-bold text-slate-200">Role Reveal</h2>
          </div>
          
          <motion.div 
            className="divide-y divide-white/5 max-h-[40vh] overflow-y-auto"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            {revealedRoles.map((player) => (
              <motion.div 
                variants={itemVariants}
                key={player.playerName} 
                className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {player.isAlive ? '🟢' : '💀'}
                  </span>
                  <span className={`font-semibold ${player.isAlive ? 'text-white' : 'text-slate-500 line-through'}`}>
                    {player.playerName}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wider ${
                    player.team === 'mafia' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : player.team === 'village'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {player.team}
                  </span>
                  <span className="text-slate-300 font-medium">
                    {player.roleName}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Play Again Button (Host Only) */}
        {isHost ? (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayAgain}
            className="w-full md:w-auto px-8 py-4 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]"
          >
            Play Again
          </motion.button>
        ) : (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-slate-400 animate-pulse-slow"
          >
            Waiting for host to restart the game...
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
