import { useState } from 'react';
import type { Socket } from 'socket.io-client';
import { motion } from 'framer-motion';
import type { Player, RoleInfo } from '../App';
import PlayerCard from './PlayerCard';

interface NightViewProps {
  socket: Socket;
  myRole: RoleInfo;
  players: Player[];
  mySocketId: string;
}

const ROLE_EMOJIS: Record<string, string> = {
  Doctor: '🩺',
  Vigilante: '🔫',
  Villager: '🏘️',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  Doctor: 'Choose a player to protect tonight',
  Vigilante: 'Choose a player to eliminate',
  Villager: 'You have no night action — sleep tight',
};

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

export default function NightView({
  socket,
  myRole,
  players,
  mySessionId,
}: NightViewProps) {
  const [submitted, setSubmitted] = useState(false);

  const emoji = ROLE_EMOJIS[myRole.roleName] || '❓';
  const description =
    ROLE_DESCRIPTIONS[myRole.roleName] || 'Awaiting orders...';

  // Other players (exclude self)
  const targets = players.filter(
    (p) => p.id !== mySessionId
  );

  // Villager has no night action
  const hasNightAction = myRole.roleName !== 'Villager';

  function handleTarget(targetId: string) {
    if (submitted) return;

    setSubmitted(true);

    socket.emit(
      'submit_action',
      { targetId },
      (res: { success: boolean; error?: string }) => {
        if (!res.success) {
          console.error('submit_action failed:', res.error);
          // Allow retry on error
          setSubmitted(false);
        }
      }
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        className="glass-card glow-border w-full max-w-sm p-8 border-red-500/20"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Night header */}
        <div className="text-center mb-2">
          <p className="text-xs font-medium text-red-400 uppercase tracking-wider">
            🌙 Night Phase
          </p>
        </div>

        {/* Role display */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{emoji}</div>
          <h2 className="text-3xl font-bold text-white mb-1">
            {myRole.roleName}
          </h2>
          <p className="text-sm text-slate-400">{description}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-red-500/10 mb-6" />

        {/* Target list or waiting message */}
        {!hasNightAction ? (
          <div className="text-center py-8">
            <p className="text-slate-400 animate-pulse-slow">
              😴 The village sleeps...
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Waiting for night to end
            </p>
          </div>
        ) : submitted ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse-slow" />
              <span className="text-sm text-red-300 font-medium">
                Action submitted
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Waiting for other players...
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              Choose Target
            </p>
            <motion.div 
              className="space-y-2"
              variants={listVariants}
              initial="hidden"
              animate="show"
            >
              {targets.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isMe={false}
                  onAction={handleTarget}
                  disabled={submitted}
                  itemVariants={itemVariants}
                />
              ))}
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
