import type { Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameSettings } from '../App';

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
  settings?: GameSettings;
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
  mySessionId,
  settings,
}: LobbyViewProps) {
  const isHost = players.length > 0 && players[0].id === mySessionId;

  function handleStart() {
    socket.emit('start_game', null, (res: { success: boolean; error?: string }) => {
      if (!res.success) {
        console.error('Failed to start:', res.error);
      }
    });
  }

  function updateSetting(key: keyof GameSettings, value: any) {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    socket.emit('update_settings', newSettings);
  }

  const tooManyMafia = settings && players.length > 0 && settings.mafiaCount >= players.length / 2;

  function handleAddBot() {
    socket.emit('add_bot', null, (res: { success: boolean; error?: string }) => {
      if (!res.success) {
        console.error('Failed to add bot:', res.error);
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

                {/* Bot badge */}
                {player.isBot && (
                  <span className="ml-auto text-xs font-medium text-blue-400/80 bg-blue-400/10 px-2 py-0.5 rounded-full">
                    Bot
                  </span>
                )}

                {/* You badge */}
                {player.id === mySessionId && idx !== 0 && (
                  <span className="ml-auto text-xs font-medium text-purple-400/80 bg-purple-400/10 px-2 py-0.5 rounded-full">
                    You
                  </span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Game Settings Panel */}
        {settings && (
          <div className="mb-6 p-4 rounded-xl bg-surface-800/50 border border-white/5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
              Game Settings
              {!isHost && <span className="text-slate-500 text-[10px]">(Read Only)</span>}
            </p>
            
            <div className="space-y-4">
              {/* Mafia Counter */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Mafias</span>
                <div className="flex items-center gap-3">
                  {isHost && (
                    <button 
                      onClick={() => updateSetting('mafiaCount', Math.max(1, settings.mafiaCount - 1))}
                      className="w-6 h-6 rounded-full bg-surface-700 hover:bg-surface-600 flex items-center justify-center text-slate-300 transition-colors"
                    >-</button>
                  )}
                  <div className="w-4 h-6 relative overflow-hidden flex items-center justify-center">
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={settings.mafiaCount}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="text-sm font-bold text-red-400 absolute"
                      >
                        {settings.mafiaCount}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  {isHost && (
                    <button 
                      onClick={() => updateSetting('mafiaCount', settings.mafiaCount + 1)}
                      className="w-6 h-6 rounded-full bg-surface-700 hover:bg-surface-600 flex items-center justify-center text-slate-300 transition-colors"
                    >+</button>
                  )}
                </div>
              </div>

              {/* Special Roles */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Include Doctor</span>
                <button 
                  onClick={() => isHost && updateSetting('hasDoctor', !settings.hasDoctor)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${settings.hasDoctor ? 'bg-green-500' : 'bg-surface-700'}`}
                  disabled={!isHost}
                >
                  <motion.div 
                    layout
                    className="w-4 h-4 rounded-full bg-white absolute top-0.5"
                    animate={{ left: settings.hasDoctor ? '22px' : '2px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Include Detective</span>
                <button 
                  onClick={() => isHost && updateSetting('hasDetective', !settings.hasDetective)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${settings.hasDetective ? 'bg-blue-500' : 'bg-surface-700'}`}
                  disabled={!isHost}
                >
                  <motion.div 
                    layout
                    className="w-4 h-4 rounded-full bg-white absolute top-0.5"
                    animate={{ left: settings.hasDetective ? '22px' : '2px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Waiting / Start */}
        {isHost ? (
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn w-full bg-surface-700 hover:bg-surface-600 text-slate-200 border border-white/10"
              onClick={handleAddBot}
            >
              + Add Bot
            </motion.button>
            <div className="space-y-2">
              <motion.button
                whileHover={{ scale: tooManyMafia || players.length < 2 ? 1 : 1.02 }}
                whileTap={{ scale: tooManyMafia || players.length < 2 ? 1 : 0.98 }}
                className={`btn w-full ${tooManyMafia || players.length < 2 ? 'opacity-50 cursor-not-allowed bg-surface-600 text-slate-400' : 'btn-primary'}`}
                onClick={handleStart}
                disabled={players.length < 2 || tooManyMafia}
              >
                {players.length < 2 ? 'Waiting for players...' : 'Start Game'}
              </motion.button>
              {tooManyMafia && (
                <p className="text-xs text-red-400 text-center animate-pulse">
                  Too many Mafias for current player count!
                </p>
              )}
            </div>
          </div>
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
