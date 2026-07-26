import { useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { Player, Role } from '../App';
import Layout from './Layout';

interface NightViewProps {
  socket: Socket;
  myRole: Role;
  players: Player[];
  mySessionId: string;
  myTeammates?: string[];
  onLeaveGame?: () => void;
}

const ROLE_EMOJIS: Record<string, string> = {
  Doctor: '🩺',
  Vigilante: '🔫',
  Villager: '🏘️',
  Mafia: '🔪',
  Detective: '🔍',
  Jester: '🃏'
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  Doctor: 'Choose a player to protect tonight.',
  Vigilante: 'Choose a player to eliminate.',
  Villager: 'You have no night action — sleep tight.',
  Mafia: 'Choose a target to eliminate.',
  Detective: 'Choose a player to investigate.',
  Jester: 'The night is quiet... too quiet.'
};

export default function NightView({
  socket,
  myRole,
  players,
  mySessionId,
  myTeammates,
  onLeaveGame,
}: NightViewProps) {
  const [submitted, setSubmitted] = useState(false);

  const emoji = ROLE_EMOJIS[myRole.roleName] || '❓';
  const description = ROLE_DESCRIPTIONS[myRole.roleName] || 'Awaiting orders...';

  // Doctor can target anyone including themselves. Others cannot target themselves.
  let targets = myRole.roleName === 'Doctor' ? players : players.filter((p) => p.id !== mySessionId);
  if (myRole.roleName === 'Mafia') {
    const teammates = myRole.mafiaTeammates || [];
    targets = targets.filter(p => !teammates.includes(p.name));
  }

  const hasNightAction = myRole.roleName !== 'Villager' && myRole.roleName !== 'Jester';

  function handleTarget(targetId: string) {
    if (submitted) return;
    setSubmitted(true);

    socket.emit('submit_action', { targetId }, (res: { success: boolean; error?: string }) => {
      if (!res.success) {
        console.error('submit_action failed:', res.error);
        setSubmitted(false);
      }
    });
  }

  const me = players.find(p => p.id === mySessionId);
  const myAgentId = me ? me.name.substring(0, 3).toUpperCase() : '042';

  return (
    <Layout agentId={myAgentId} onLeaveGame={onLeaveGame}>
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-gutter flex-1 min-h-0 lg:overflow-hidden h-full overflow-visible">
        {/* Secure Transmission Overlay */}
        {submitted && (
          <div className="fixed bottom-8 right-8 z-[110] flex items-center gap-3 bg-surface-container p-4 border border-outline-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-3 h-3 bg-error rounded-full shadow-[0_0_8px_rgba(255,180,171,0.8)] animate-pulse"></div>
            <span className="font-body-md text-body-md uppercase tracking-[0.2em] text-error">TRANSMITTING SECURE DATA...</span>
          </div>
        )}

        {/* Left: Player Dossiers Grid */}
        <div className="lg:col-span-8 space-y-gutter flex flex-col min-h-0 flex-1">
          <div className="flex justify-between items-end border-b border-outline-variant pb-2">
            <div>
              <h2 className="font-headline-md text-headline-md uppercase tracking-tight flex items-center gap-2">
                <span className="text-2xl">{emoji}</span> {myRole.roleName}
              </h2>
              <p className="font-label-sm text-outline uppercase">{description}</p>
            </div>
            <p className="font-label-sm text-label-sm uppercase text-outline">TARGETS: {targets.length}</p>
          </div>

          <div className="flex-1 overflow-visible lg:overflow-y-auto custom-scrollbar pr-2 pb-4">
            {!hasNightAction ? (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                <span className="material-symbols-outlined text-6xl mb-4">nightlight</span>
                <p className="font-headline-md text-xl uppercase tracking-widest">RADIO SILENCE ENFORCED</p>
                <p className="font-body-md text-outline mt-2">Awaiting dawn...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {targets.map((player) => (
                  <div key={player.id} className={`p-6 border-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col group transition-transform ${submitted ? 'opacity-50 grayscale pointer-events-none bg-surface-container' : 'hover:-translate-y-1 bg-[#d1d1d1] text-[#1a1a1a] border-[#1a1a1a]'}`}>
                    <div className="flex gap-4 mb-4">
                      <div className="w-24 h-32 bg-surface-container-highest border border-[#1a1a1a] relative flex-shrink-0 flex items-center justify-center">
                        {/* Avatar Placeholder */}
                        <div className="font-display-lg text-6xl text-outline-variant">{player.name.charAt(0).toUpperCase()}</div>
                        <div className="absolute inset-0 border-2 border-black/10 pointer-events-none"></div>
                        {!player.isAlive && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/50">
                            <span className="text-error font-bold border-4 border-error transform -rotate-45 px-2">DECEASED</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-headline-md text-headline-md uppercase leading-none mb-1">{player.name}</h3>
                        <p className="font-label-sm text-label-sm uppercase border-b border-black/20 pb-1 mb-2">
                          {player.isBot ? 'AUTOMATON' : 'UNKNOWN_AFFILIATION'}
                        </p>
                        <p className="text-xs font-body-md leading-relaxed italic opacity-80">
                          {player.isAlive ? 'Status: Active. Location unknown.' : 'Status: Terminated.'}
                        </p>
                      </div>
                    </div>
                    {player.isAlive && (
                      <div className="mt-auto border-t border-black/10 pt-4 flex justify-end">
                        <button 
                          onClick={() => handleTarget(player.id)}
                          disabled={submitted}
                          className="text-error-container font-bold text-headline-md uppercase hover:scale-[1.08] active:scale-95 transition-all duration-300 ease-out shadow-[2px_2px_0px_rgba(0,0,0,0.2)] border-2 border-dashed border-error-container p-2 transform rotate-[-2deg] disabled:hover:scale-100 disabled:active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          SELECT TARGET
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: The Syndicate HUD */}
        <div className="lg:col-span-4 flex flex-col min-h-0 flex-1 shrink-0 bg-surface-container border-l-2 border-outline-variant shadow-[-4px_0px_0px_0px_rgba(0,0,0,1)] p-6 lg:overflow-hidden mt-8 lg:mt-0">
          <div className="flex items-center justify-between mb-6 border-b-2 border-outline-variant pb-4">
            <h2 className="font-headline-md text-headline-md uppercase tracking-tighter text-error">THE SYNDICATE</h2>
            <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
          </div>
          
          <div className="flex-grow space-y-6 overflow-visible lg:overflow-y-auto mb-6 pr-2 custom-scrollbar">
            {myTeammates && myTeammates.length > 0 ? (
              <div className="space-y-4">
                <p className="font-label-sm text-outline uppercase tracking-widest border-b border-outline-variant pb-2">Verified Allies</p>
                {myTeammates.map((teammate, i) => (
                  <div key={i} className="bg-surface-container-highest p-3 border-l-4 border-error">
                    <p className="font-body-md text-body-md leading-snug font-bold uppercase">{teammate}</p>
                    <p className="text-[10px] text-outline mt-1 uppercase">Clearance Level: Red</p>
                  </div>
                ))}
                <div className="mt-8 text-xs text-error italic opacity-80 bg-error/10 p-4 border border-error/20">
                  "Maintain cover at all costs. The Director is watching."
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                <span className="material-symbols-outlined text-4xl mb-2 text-outline">lock</span>
                <p className="font-label-sm uppercase tracking-widest text-center text-outline">
                  UNAUTHORIZED ACCESS<br/>CLEARANCE REQUIRED
                </p>
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 border-t-2 border-outline-variant">
            <div className="flex justify-between mt-2">
              <p className="font-label-sm text-label-sm uppercase text-outline/40">ENCRYPTION: AES-256</p>
              <p className="font-label-sm text-label-sm uppercase text-outline/40 text-error">SECURE</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
