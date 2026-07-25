import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '../App';
import EliminationCanvas from './EliminationCanvas';

interface PlayerCardProps {
  player: Player;
  isMe: boolean;
  voteCount?: number;
  onAction?: (id: string) => void;
  disabled?: boolean;
  itemVariants?: any;
  hasRipple?: boolean;
}

export default function PlayerCard({
  player,
  isMe,
  voteCount = 0,
  onAction,
  disabled = false,
  itemVariants,
  hasRipple = false
}: PlayerCardProps) {
  const [isEliminating, setIsEliminating] = useState(false);
  const [isDead, setIsDead] = useState(!player.isAlive);
  const prevIsAliveRef = useRef(player.isAlive);

  useEffect(() => {
    if (prevIsAliveRef.current && !player.isAlive) {
      setIsEliminating(true);
      setTimeout(() => {
        setIsEliminating(false);
        setIsDead(true);
      }, 1500);
    } else if (!prevIsAliveRef.current && player.isAlive) {
      setIsDead(false);
      setIsEliminating(false);
    }
    
    prevIsAliveRef.current = player.isAlive;
  }, [player.isAlive]);

  const shakeAnimation = isEliminating
    ? { x: [-2, 2, -2, 2, 0], transition: { repeat: Infinity, duration: 0.2 } }
    : {};

  return (
    <motion.button
      id={`player-ref-${player.id}`}
      variants={itemVariants}
      animate={shakeAnimation}
      whileHover={!disabled && !isDead && !isEliminating ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isDead && !isEliminating ? { scale: 0.98 } : {}}
      onClick={() => onAction && onAction(player.id)}
      disabled={disabled || isDead || isEliminating}
      className={`w-full relative overflow-hidden flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-left group disabled:cursor-not-allowed ${
        hasRipple
          ? 'bg-purple-500/20 border-purple-500'
          : 'bg-surface-700/50 hover:bg-purple-500/10 border-transparent hover:border-purple-500/30'
      }`}
      style={isDead ? { filter: 'grayscale(100%) opacity(0.5)' } : {}}
    >
      {isEliminating && (
        <EliminationCanvas onComplete={() => {}} />
      )}

      {/* Ripple overlay for DayView flying votes */}
      <AnimatePresence>
        {hasRipple && (
          <motion.div
            initial={{ opacity: 0.5, scale: 0 }}
            animate={{ opacity: 0, scale: 2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 bg-purple-400 rounded-lg pointer-events-none"
          />
        )}
      </AnimatePresence>
      
      <div className="flex items-center gap-3 relative z-10">
        <div className={`avatar-circle w-2 h-2 rounded-full shrink-0 ${isDead ? 'bg-red-500' : 'bg-green-400'}`} />
        <span className={`font-medium ${isDead ? 'text-slate-400 line-through' : 'text-slate-200 group-hover:text-purple-300'}`}>
          {player.name} {isMe && '(You)'}
        </span>
      </div>

      <div className="flex items-center gap-2 relative z-10">
        {isDead && (
          <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded border border-red-500/30 font-semibold shadow-md">
            💀 DEAD
          </span>
        )}

        {voteCount > 0 && !isDead && (
          <motion.span 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            key={voteCount} 
            className="text-xs font-bold text-white bg-purple-500 px-2 py-1 rounded-full shadow-md"
          >
            {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
          </motion.span>
        )}
      </div>
    </motion.button>
  );
}
