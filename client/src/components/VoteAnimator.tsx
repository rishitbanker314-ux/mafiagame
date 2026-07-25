import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import socket from '../socket';
import VoteToken from './VoteToken';

interface ActiveVote {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  targetId: string;
}

export default function VoteAnimator({ children }: { children: React.ReactNode }) {
  const [activeVotes, setActiveVotes] = useState<ActiveVote[]>([]);

  useEffect(() => {
    function onVoteUpdate(data: { voterId?: string; targetId?: string; votes: Record<string, number> }) {
      if (data.voterId && data.targetId) {
        const voterEl = document.getElementById(`player-ref-${data.voterId}`);
        const targetEl = document.getElementById(`player-ref-${data.targetId}`);
        
        if (voterEl && targetEl) {
          const voterRect = voterEl.getBoundingClientRect();
          const targetRect = targetEl.getBoundingClientRect();

          // Target the small circle icon inside the button if possible, else the whole button center
          const voterIcon = voterEl.querySelector('.avatar-circle');
          const targetIcon = targetEl.querySelector('.avatar-circle');

          const vRect = voterIcon ? voterIcon.getBoundingClientRect() : voterRect;
          const tRect = targetIcon ? targetIcon.getBoundingClientRect() : targetRect;

          const startX = vRect.left + vRect.width / 2 - 8;
          const startY = vRect.top + vRect.height / 2 - 8;
          const endX = tRect.left + tRect.width / 2 - 8;
          const endY = tRect.top + tRect.height / 2 - 8;

          const newVote = {
            id: Math.random().toString(36).substr(2, 9),
            startX,
            startY,
            endX,
            endY,
            targetId: data.targetId
          };

          setActiveVotes(prev => [...prev, newVote]);
        }
      }
    }

    socket.on('vote_update', onVoteUpdate);
    return () => {
      socket.off('vote_update', onVoteUpdate);
    };
  }, []);

  function handleComplete(id: string) {
    const vote = activeVotes.find(v => v.id === id);
    if (vote) {
      // Fire custom event to let the target element ripple
      const event = new CustomEvent('voteHit', { detail: { targetId: vote.targetId } });
      window.dispatchEvent(event);
    }
    setActiveVotes(prev => prev.filter(v => v.id !== id));
  }

  return (
    <>
      {children}
      <AnimatePresence>
        {activeVotes.map(vote => (
          <VoteToken
            key={vote.id}
            id={vote.id}
            startX={vote.startX}
            startY={vote.startY}
            endX={vote.endX}
            endY={vote.endY}
            onComplete={handleComplete}
          />
        ))}
      </AnimatePresence>
    </>
  );
}
