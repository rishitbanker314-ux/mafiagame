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
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        className="glass-card glow-border w-full max-w-sm p-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="text-5xl mb-3">🎭</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">
            Mafia
          </h1>
          <p className="text-sm text-slate-400 mt-1">Deception & Deduction</p>
        </motion.div>

        {/* Name input */}
        <motion.div variants={itemVariants} className="mb-4">
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
            Your Name
          </label>
          <input
            className="input-field"
            type="text"
            placeholder="Enter your name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoFocus
          />
        </motion.div>

        {/* Room code input */}
        <motion.div variants={itemVariants} className="mb-6">
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
            Room Code
          </label>
          <input
            className="input-field uppercase tracking-[0.3em] text-center text-lg"
            type="text"
            placeholder="ABCD"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={4}
          />
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div variants={itemVariants} className="mb-4 text-sm text-red-400 text-center">
            {error}
          </motion.div>
        )}

        {/* Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary w-full relative flex justify-center items-center"
            onClick={handleJoin}
            disabled={loading}
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin absolute left-4" />}
            {loading ? 'Joining...' : 'Join Room'}
          </motion.button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-secondary w-full relative flex justify-center items-center"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin absolute left-4" />}
            {loading ? 'Creating...' : 'Create New Room'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn w-full relative flex justify-center items-center bg-surface-700 hover:bg-surface-600 text-slate-200 border border-white/10 mt-1"
            onClick={handlePlayWithBots}
            disabled={loading}
          >
            {loading ? 'Setting up...' : '🤖 Play with Bots (Singleplayer)'}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}

