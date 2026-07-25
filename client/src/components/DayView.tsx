import { useState, useRef, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

interface Player {
  id: string;
  name: string;
  isAlive: boolean;
}

interface KilledPlayer {
  playerId: string;
  playerName: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  isGhost: boolean;
}

interface DayViewProps {
  socket: Socket;
  players: Player[];
  killed: KilledPlayer[];
  chatMessages: ChatMessage[];
  votes: Record<string, number>;
  mySocketId: string;
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function DayView({
  socket,
  players,
  killed,
  chatMessages,
  votes,
  mySocketId,
}: DayViewProps) {
  const [message, setMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const me = players.find((p) => p.id === mySocketId);
  
  const alivePlayers = players.filter((p) => p.isAlive);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    socket.emit('send_chat', { message: message.trim() });
    setMessage('');
  }

  function handleVote(targetId: string) {
    if (!me?.isAlive) return;
    socket.emit('submit_vote', { targetId });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div 
        className="glass-card glow-border w-full max-w-2xl flex flex-col md:flex-row h-[85vh] overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        
        {/* Left column: Info & Voting */}
        <div className="w-full md:w-1/2 p-6 flex flex-col border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto">
          {/* Day header */}
          <div className="text-center mb-6 shrink-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              ☀️ Day Phase
            </p>
            <h2 className="text-2xl font-bold text-white">The Town Awakes</h2>
          </div>

          {/* Night results */}
          <AnimatePresence mode="wait">
            {killed.length > 0 ? (
              <motion.div 
                key="killed"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/15 shrink-0"
              >
                <p className="text-sm font-medium text-red-400 mb-2">
                  💀 Eliminated last night:
                </p>
                {killed.map((k) => (
                  <p key={k.playerId} className="text-white font-semibold">
                    {k.playerName}
                  </p>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="safe"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/15 shrink-0"
              >
                <p className="text-sm font-medium text-green-400">
                  🛡️ Nobody was eliminated last night!
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-px bg-white/5 mb-6 shrink-0" />

          {/* Voting Panel */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Voting Panel
              </p>
              <p className="text-xs text-slate-500">
                &gt; 50% needed
              </p>
            </div>
            
            {!me?.isAlive && (
              <p className="text-xs text-red-400 mb-3 bg-red-500/10 p-2 rounded text-center">
                You are dead. You cannot vote.
              </p>
            )}

            <motion.div 
              className="space-y-2"
              variants={listVariants}
              initial="hidden"
              animate="show"
            >
              {alivePlayers.map((player) => {
                const voteCount = votes[player.id] || 0;
                return (
                  <motion.button
                    key={player.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleVote(player.id)}
                    disabled={!me?.isAlive}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-surface-700/50 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/30 transition-all text-left group disabled:opacity-50 disabled:hover:bg-surface-700/50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                      <span className="text-slate-200 font-medium group-hover:text-purple-300">
                        {player.name}
                      </span>
                    </div>
                    {voteCount > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        key={voteCount} 
                        className="text-xs font-bold text-white bg-purple-500 px-2 py-1 rounded-full"
                      >
                        {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Right column: Chat Box */}
        <div className="w-full md:w-1/2 flex flex-col bg-surface-800/50">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 shrink-0 flex items-center justify-between bg-surface-800/80">
            <h3 className="font-semibold text-slate-200">Town Square</h3>
            {!me?.isAlive && (
              <span className="text-xs font-medium text-teal-300 bg-teal-500/20 px-2 py-1 rounded-full animate-pulse-slow">
                👻 Ghost Chat Active
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No messages yet. Discuss who is suspicious!
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMe = msg.senderId === mySocketId;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex flex-col max-w-[85%] ${
                      isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 mb-1 ml-1 uppercase">
                      {msg.senderName} {msg.isGhost && '(Ghost)'}
                    </span>
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm ${
                        msg.isGhost
                          ? 'bg-teal-900/40 text-teal-100 border border-teal-500/30'
                          : isMe
                          ? 'bg-purple-600 text-white'
                          : 'bg-surface-600 text-slate-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSendChat}
            className="p-4 border-t border-white/10 shrink-0 bg-surface-800/80"
          >
            <div className="relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  me?.isAlive ? "Type a message..." : "Type a ghost message..."
                }
                className="w-full bg-surface-900 border border-white/10 rounded-full pl-4 pr-12 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                maxLength={200}
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 w-8 flex items-center justify-center rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-colors text-white"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
