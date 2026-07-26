import React, { useRef, useEffect, useState } from 'react';
import type { ChatMessage } from '../App';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatBoxProps {
  chatMessages: ChatMessage[];
  mySessionId: string;
  onSendChat: (message: string) => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const ChatBox = React.memo(function ChatBox({ chatMessages, mySessionId, onSendChat }: ChatBoxProps) {
  const [message, setMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    onSendChat(message);
    setMessage('');
  }

  return (
    <motion.div
      variants={itemVariants}
      className="glass-card flex flex-col h-full bg-surface-800/80 p-0 overflow-hidden"
    >
      <div className="p-3 border-b border-white/5 bg-surface-900/50">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <span>💬</span> Town Square
        </h3>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto min-h-0 space-y-3 custom-scrollbar">
        {chatMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm italic">
            No messages yet...
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {chatMessages.map((msg) => {
              const isMe = msg.senderId === mySessionId;
              
              if (msg.isSystem) {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center my-2"
                  >
                    <span className="inline-block px-3 py-1 rounded-full bg-white/5 text-slate-400 text-xs tracking-wide">
                      {msg.text}
                    </span>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className={`text-[10px] uppercase font-bold mb-1 tracking-wider ${
                    msg.isGhost ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {msg.senderName} {msg.isGhost && '(Ghost)'}
                  </span>
                  <div className={`px-4 py-2 rounded-2xl max-w-[85%] ${
                    msg.isGhost
                      ? 'bg-slate-800/50 text-slate-400 border border-slate-700/50'
                      : isMe 
                        ? 'bg-purple-600/80 text-white rounded-br-sm' 
                        : 'bg-surface-700/80 text-slate-200 rounded-bl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-3 bg-surface-900/50 border-t border-white/5">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            className="input-field py-2 text-sm bg-surface-800 focus:bg-surface-700 transition-colors"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!message.trim()}
            className="btn btn-primary px-4 py-2 opacity-90 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the chat messages array length changes or mySessionId changes (which should be rare)
  return prevProps.chatMessages.length === nextProps.chatMessages.length && prevProps.mySessionId === nextProps.mySessionId;
});

export default ChatBox;
