import { useState } from 'react';
import type { Socket } from 'socket.io-client';
import { motion } from 'framer-motion';

interface JoinViewProps {
  socket: Socket;
  onJoined: (roomCode: string, playerName: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function JoinView({ socket, onJoined }: JoinViewProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleCreate() {
    if (!name.trim()) {
      setError('Enter your name first');
      return;
    }
    setError('');
    setLoading(true);

    const sessionId = localStorage.getItem('sessionToken');
    socket.emit(
      'create_room',
      { playerName: name.trim(), sessionId },
      (res: { success: boolean; roomCode?: string; error?: string }) => {
        setLoading(false);
        if (res.success && res.roomCode) {
          onJoined(res.roomCode, name.trim());
        } else {
          setError(res.error || 'Failed to create room');
        }
      }
    );
  }

  function handlePlayWithBots() {
    if (!name.trim()) {
      setError('Enter your name first');
      return;
    }
    setError('');
    setLoading(true);

    const sessionId = localStorage.getItem('sessionToken');
    socket.emit(
      'create_room',
      { playerName: name.trim(), sessionId },
      (res: { success: boolean; roomCode?: string; error?: string }) => {
        if (res.success && res.roomCode) {
          const roomCode = res.roomCode;
          // Add 3 bots automatically to reach the 4-player minimum for a good game
          let botsAdded = 0;
          for (let i = 0; i < 3; i++) {
            socket.emit('add_bot', null, () => {
              botsAdded++;
              if (botsAdded === 3) {
                setLoading(false);
                onJoined(roomCode, name.trim());
              }
            });
          }
        } else {
          setLoading(false);
          setError(res.error || 'Failed to create room');
        }
      }
    );
  }

  function handleJoin() {
    if (!name.trim()) {
      setError('Enter your name first');
      return;
    }
    if (!code.trim()) {
      setError('Enter a room code');
      return;
    }
    setError('');
    setLoading(true);

    const sessionId = localStorage.getItem('sessionToken');
    socket.emit(
      'join_room',
      { roomCode: code.trim().toUpperCase(), playerName: name.trim(), sessionId },
      (res: { success: boolean; error?: string }) => {
        setLoading(false);
        if (res.success) {
          onJoined(code.trim().toUpperCase(), name.trim());
        } else {
          setError(res.error || 'Failed to join room');
        }
      }
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden bg-background">
      {/* Noise overlay and vignette for the vintage look */}
      <div className="noise-overlay" />
      <div className="absolute inset-0 vignette pointer-events-none" />

      {/* Main Container - Mobile Responsive */}
      <div className="flex-1 flex flex-col justify-center items-center w-full max-w-md mx-auto p-4 z-10 relative">
        <motion.div
          className="w-full flex flex-col bg-surface-container/80 backdrop-blur-md border border-outline-variant/30 p-6 md:p-8 rounded-lg shadow-2xl"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <h1 className="font-display-lg text-4xl md:text-5xl text-on-surface mb-2 uppercase tracking-widest border-b border-outline-variant/30 pb-4 inline-block">
              Mafia
            </h1>
            <p className="font-body-md text-sm md:text-base text-on-surface-variant mt-3 uppercase tracking-[0.2em]">
              Deception & Deduction
            </p>
          </motion.div>

          {/* Name input */}
          <motion.div variants={itemVariants} className="mb-5">
            <label className="block font-label-lg text-on-surface-variant mb-2 uppercase tracking-wider text-xs">
              Alias
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
                &gt;
              </span>
              <input
                className="w-full bg-surface-container-highest border border-outline-variant/50 text-on-surface font-body-md py-3 pl-8 pr-4 focus:outline-none focus:border-on-surface transition-colors rounded placeholder:text-on-surface-variant/30"
                type="text"
                placeholder="Enter your name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
              />
            </div>
          </motion.div>

          {/* Room code input */}
          <motion.div variants={itemVariants} className="mb-8">
            <label className="block font-label-lg text-on-surface-variant mb-2 uppercase tracking-wider text-xs">
              Case File (Room Code)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 material-symbols-outlined text-sm">
                tag
              </span>
              <input
                className="w-full bg-surface-container-highest border border-outline-variant/50 text-on-surface font-body-md py-3 pl-8 pr-4 focus:outline-none focus:border-on-surface transition-colors rounded uppercase tracking-[0.3em] placeholder:text-on-surface-variant/30"
                type="text"
                placeholder="XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={4}
              />
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              variants={itemVariants}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-3 border border-error/50 bg-error-container/20 text-error font-body-md text-sm text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </motion.div>
          )}

          {/* Actions */}
          <motion.div variants={itemVariants} className="flex flex-col gap-4">
            <button
              onClick={handleJoin}
              disabled={loading}
              className="w-full bg-on-surface text-surface py-3 font-label-lg uppercase tracking-widest hover:bg-on-surface-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
              ) : (
                <span className="material-symbols-outlined text-sm">login</span>
              )}
              {loading ? 'Infiltrating...' : 'Join Operation'}
            </button>

            <div className="flex items-center gap-4 my-2 opacity-50">
              <div className="flex-1 h-px bg-outline-variant" />
              <span className="font-label-sm uppercase tracking-widest text-on-surface-variant text-xs">or</span>
              <div className="flex-1 h-px bg-outline-variant" />
            </div>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full border border-on-surface text-on-surface py-3 font-label-lg uppercase tracking-widest hover:bg-surface-container-highest transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              {loading ? 'Establishing...' : 'Establish Syndicate'}
            </button>
            
            <button
              onClick={handlePlayWithBots}
              disabled={loading}
              className="w-full border border-outline-variant text-on-surface-variant py-3 mt-2 font-label-lg uppercase tracking-widest hover:bg-surface-container-highest hover:text-on-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">smart_toy</span>
              {loading ? 'Initializing...' : 'Solo Operation (Bots)'}
            </button>
          </motion.div>

        </motion.div>
        
        {/* Footer Meta */}
        <div className="mt-8 opacity-40 text-center">
          <p className="font-label-sm text-on-surface-variant uppercase tracking-[0.2em]">CLASSIFIED - MAFIA NOIR</p>
          <div className="w-12 h-px bg-outline-variant mx-auto my-2"></div>
        </div>
      </div>
    </div>
  );
}

