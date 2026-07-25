import { useState } from 'react';
import type { Socket } from 'socket.io-client';

interface JoinViewProps {
  socket: Socket;
  onJoined: (roomCode: string, playerName: string) => void;
}

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

    socket.emit(
      'create_room',
      { playerName: name.trim() },
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

    socket.emit(
      'join_room',
      { roomCode: code.trim().toUpperCase(), playerName: name.trim() },
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
      <div className="glass-card glow-border w-full max-w-sm p-8 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎭</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">
            Mafia
          </h1>
          <p className="text-sm text-slate-400 mt-1">Deception & Deduction</p>
        </div>

        {/* Name input */}
        <div className="mb-4">
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
        </div>

        {/* Room code input */}
        <div className="mb-6">
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
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 text-sm text-red-400 text-center animate-fade-in">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            className="btn btn-primary w-full"
            onClick={handleJoin}
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            className="btn btn-secondary w-full"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create New Room'}
          </button>
        </div>
      </div>
    </div>
  );
}
