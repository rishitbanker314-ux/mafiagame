import type { Socket } from 'socket.io-client';
import { motion } from 'framer-motion';

interface Player {
  id: string;
  name: string;
  isAlive: boolean;
}

interface LobbyViewProps {
  socket: Socket;
  roomCode: string;
  players: Player[];
  mySocketId: string;
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 }
  },
};

export default function LobbyView({
  socket,
  roomCode,
  players,
  mySocketId,
}: LobbyViewProps) {
  const isHost = players.length > 0 && players[0].id === mySocketId;

  function handleStart() {
    socket.emit('start_game', null, (res: { success: boolean; error?: string }) => {
      if (!res.success) {
        console.error('Failed to start:', res.error);
      }
    });
  }

  function copyCode() {
    navigator.clipboard.writeText(roomCode);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        className="glass-card glow-border w-full max-w-sm p-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Room Code */}
        <div className="text-center mb-8">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            Room Code
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={copyCode}
            className="group inline-flex items-center gap-2 cursor-pointer bg-transparent border-none"
            title="Click to copy"
          >
            <span className="text-4xl font-bold tracking-[0.3em] text-white">
              {roomCode}
            </span>
            <svg
              className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </motion.button>
          <p className="text-xs text-slate-500 mt-1">Share this code with friends</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/5 mb-6" />

        {/* Player List */}
        <div className="mb-6">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
            Players ({players.length})
          </p>
          <motion.div 
            className="space-y-2"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            {players.map((player, idx) => (
              <motion.div
                key={player.id}
                variants={itemVariants}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-700/50"
              >
                {/* Avatar circle */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {player.name.charAt(0).toUpperCase()}
                </div>

                {/* Name */}
                <span className="font-medium text-slate-200 truncate">
                  {player.name}
                </span>

                {/* Host badge */}
                {idx === 0 && (
                  <span className="ml-auto text-xs font-medium text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-full">
                    Host
                  </span>
                )}

                {/* You badge */}
                {player.id === mySocketId && idx !== 0 && (
                  <span className="ml-auto text-xs font-medium text-purple-400/80 bg-purple-400/10 px-2 py-0.5 rounded-full">
                    You
                  </span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Waiting / Start */}
        {isHost ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary w-full"
            onClick={handleStart}
            disabled={players.length < 2}
          >
            {players.length < 2 ? 'Waiting for players...' : 'Start Game'}
          </motion.button>
        ) : (
          <div className="text-center">
            <p className="text-sm text-slate-400 animate-pulse-slow">
              ⏳ Waiting for host to start...
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
