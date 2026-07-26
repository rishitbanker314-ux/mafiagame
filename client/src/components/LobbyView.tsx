import type { Socket } from 'socket.io-client';

import type { GameSettings } from '../App';
import Layout from './Layout';
import { useState, useEffect } from 'react';

interface Player {
  id: string;
  name: string;
  isAlive: boolean;
  isBot?: boolean;
}

interface LobbyViewProps {
  socket: Socket;
  roomCode: string;
  players: Player[];
  mySessionId: string;
  settings?: GameSettings;
  onLeaveGame?: () => void;
}

export default function LobbyView({
  socket,
  roomCode,
  players,
  mySessionId,
  settings,
  onLeaveGame,
}: LobbyViewProps) {
  const isHost = players.length > 0 && players[0].id === mySessionId;
  const [stampText, setStampText] = useState('');

  useEffect(() => {
    // Typewriter effect for room code
    let i = 0;
    const interval = setInterval(() => {
      if (i <= roomCode.length) {
        setStampText(roomCode.substring(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [roomCode]);

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

  function handleAddBot() {
    socket.emit('add_bot', null, (res: { success: boolean; error?: string }) => {
      if (!res.success) {
        console.error('Failed to add bot:', res.error);
      }
    });
  }

  const tooManyMafia = settings && players.length > 0 && settings.mafiaCount >= players.length / 2;

  // Derive agent id (first 3 chars of name or session id)
  const me = players.find(p => p.id === mySessionId);
  const myAgentId = me ? me.name.substring(0, 3).toUpperCase() : '042';

  return (
    <Layout agentId={myAgentId} onLeaveGame={onLeaveGame}>
      <div className="flex flex-col md:grid md:grid-cols-12 gap-gutter min-h-0 flex-1 md:h-full pb-8 md:pb-0 overflow-y-auto md:overflow-visible custom-scrollbar">
        {/* Left: Operatives List */}
        <div className="col-span-12 md:col-span-3 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b-2 border-outline-variant pb-2">
            <h2 className="font-headline-md text-headline-md text-primary uppercase">OPERATIVES</h2>
            <span className="font-label-sm text-outline">
              {players.length < 10 ? `0${players.length}` : players.length} / 12
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
            {players.map((player, idx) => {
              const isMe = player.id === mySessionId;
              const isPlayerHost = idx === 0;

              return (
                <div key={player.id} className={`p-4 border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors ${isMe ? 'bg-primary-container border-primary shadow-[4px_4px_0px_0px_rgba(199,198,197,0.3)]' : 'bg-surface-container border-outline-variant hover:bg-surface-container-high'}`}>
                  <div className="flex gap-4 items-center">
                    <div className={`w-12 h-16 bg-surface-variant flex-shrink-0 border grain-filter flex items-center justify-center font-bold text-2xl ${isMe ? 'border-primary' : 'border-outline'}`}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold uppercase font-label-lg ${isMe ? 'text-primary' : 'text-on-surface'}`}>
                        {player.name} {isMe && '(YOU)'}
                      </div>
                      <div className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${isMe ? 'text-on-primary-container' : 'text-outline'}`}>
                        {isPlayerHost ? 'DIRECTOR' : player.isBot ? 'AUTOMATON' : 'FIELD AGENT'}
                      </div>
                    </div>
                    {isMe ? (
                      <span className="material-symbols-outlined text-on-surface-variant">radio</span>
                    ) : (
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Encrypted Channel (Stamping Area) */}
        <div className="col-span-12 md:col-span-6 flex flex-col items-center justify-center px-8 relative mt-8 md:mt-0">
          <div className="w-full max-w-md paper-texture p-12 text-background shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] relative ink-bleed torn-edge transform -rotate-1">
            <div className="border-b-2 border-background pb-4 mb-8 flex justify-between items-end">
              <div className="uppercase font-bold tracking-tighter text-2xl">MEMORANDUM</div>
              <div className="font-label-sm opacity-70">DATE: 14 NOV 1952</div>
            </div>
            
            <div className="space-y-4 mb-12">
              <div className="flex gap-4">
                <span className="font-bold">TO:</span>
                <span>ALL FIELD AGENTS</span>
              </div>
              <div className="flex gap-4">
                <span className="font-bold">SUBJ:</span>
                <span>CHANNEL AUTHENTICATION</span>
              </div>
            </div>
            
            <div className="dashed-divider mb-8" style={{ borderColor: '#131313' }}></div>
            
            <div className="flex flex-col items-center gap-4 py-8 relative">
              <div className="text-xs uppercase font-bold tracking-widest opacity-60">ENCRYPTED CHANNEL CODE</div>
              <div className="text-6xl font-display-lg tracking-[0.2em] font-black text-center ink-stamp p-4 scale-110 min-h-[100px] flex items-center justify-center">
                {stampText}
              </div>
              
              <div className="absolute -bottom-4 -right-4 transform rotate-12 border-4 border-error text-error p-2 font-black uppercase text-xl opacity-80 mix-blend-multiply border-double pointer-events-none">
                CLASSIFIED
              </div>
            </div>
            
            <div className="mt-12 text-[10px] leading-tight opacity-70 italic">
              Unauthorized reproduction of this document is strictly prohibited by order of the Director. Maintain radio silence until the briefing commences.
            </div>
            
            <div className="absolute bottom-4 left-4 w-3 h-5 bg-background animate-pulse"></div>
          </div>
          
          <div className="mt-12 flex gap-4 md:gap-8 w-full justify-center flex-wrap">
            {isHost && (
              <button 
                onClick={handleAddBot}
                className="px-8 py-4 border-2 border-primary text-primary font-bold uppercase hover:bg-primary hover:text-on-primary transition-all duration-300 ease-out hover:scale-[1.02] active:scale-95 shadow-[4px_4px_0px_0px_rgba(199,198,197,0.4)] active:shadow-none"
              >
                ADD AUTOMATON
              </button>
            )}
            {isHost ? (
              <button 
                onClick={handleStart}
                disabled={players.length < 2 || tooManyMafia}
                className={`px-12 py-4 font-bold uppercase transition-all duration-300 ease-out hover:scale-[1.02] active:scale-95 disabled:hover:scale-100 disabled:active:scale-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none ${players.length < 2 || tooManyMafia ? 'bg-surface-variant text-outline cursor-not-allowed' : 'bg-primary text-on-primary hover:bg-on-surface-variant'}`}
              >
                {players.length < 2 ? 'AWAITING AGENTS' : 'COMMENCE MISSION'}
              </button>
            ) : (
              <div className="px-12 py-4 bg-surface-variant text-outline font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                AWAITING DIRECTOR...
              </div>
            )}
          </div>
          {tooManyMafia && (
            <div className="mt-4 text-xs font-bold text-error uppercase animate-pulse">
              WARNING: TOO MANY HOSTILES DETECTED FOR CURRENT SQUAD SIZE
            </div>
          )}
        </div>

        {/* Right: Game Settings */}
        <div className="col-span-12 md:col-span-3 flex flex-col gap-6 mt-8 md:mt-0">
          <div className="flex items-center justify-between border-b-2 border-outline-variant pb-2">
            <h2 className="font-headline-md text-headline-md text-primary uppercase">PARAMETERS</h2>
            <span className="material-symbols-outlined text-outline">tune</span>
          </div>
          
          {settings ? (
            <div className="space-y-8">
              {/* Mafia Count (Mapped to a custom difficulty slider style or just buttons) */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="font-label-lg uppercase tracking-widest text-outline text-xs">HOSTILE_PRESENCE (MAFIA)</label>
                  <span className="font-mono text-xs text-primary">{settings.mafiaCount}</span>
                </div>
                <div className="flex items-center gap-4">
                  {isHost && (
                    <button onClick={() => updateSetting('mafiaCount', Math.max(1, settings.mafiaCount - 1))} className="px-3 py-1 bg-surface-container border-2 border-outline-variant text-primary hover:bg-surface-variant font-bold transition-all duration-200 active:scale-90">-</button>
                  )}
                  <div className="relative h-6 flex items-center flex-1">
                    <div className="absolute w-full h-[2px] bg-outline-variant"></div>
                    <div className="absolute h-[2px] bg-primary" style={{ width: `${(settings.mafiaCount / 5) * 100}%` }}></div>
                    <div className="absolute w-4 h-6 bg-secondary-fixed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border border-on-secondary-fixed-variant" style={{ left: `calc(${(settings.mafiaCount / 5) * 100}% - 8px)` }}></div>
                  </div>
                  {isHost && (
                    <button onClick={() => updateSetting('mafiaCount', settings.mafiaCount + 1)} className="px-3 py-1 bg-surface-container border-2 border-outline-variant text-primary hover:bg-surface-variant font-bold transition-all duration-200 active:scale-90">+</button>
                  )}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-6">
                <div 
                  className={`flex justify-between items-center group ${isHost ? 'cursor-pointer' : 'opacity-70'}`}
                  onClick={() => isHost && updateSetting('hasDoctor', !settings.hasDoctor)}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-on-surface text-sm uppercase">MEDICAL_SUPPORT</span>
                    <span className="text-[10px] text-outline uppercase">DOCTOR ROLE</span>
                  </div>
                  <div className="w-12 h-6 border-2 border-outline-variant p-1 bg-surface-container relative flex items-center">
                    <div className={`w-4 h-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all absolute ${settings.hasDoctor ? 'bg-primary right-1' : 'bg-surface-variant left-1'}`}></div>
                  </div>
                </div>
                
                <div 
                  className={`flex justify-between items-center group ${isHost ? 'cursor-pointer' : 'opacity-70'}`}
                  onClick={() => isHost && updateSetting('hasDetective', !settings.hasDetective)}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-on-surface text-sm uppercase">INVESTIGATOR</span>
                    <span className="text-[10px] text-outline uppercase">DETECTIVE ROLE</span>
                  </div>
                  <div className="w-12 h-6 border-2 border-outline-variant p-1 bg-surface-container relative flex items-center">
                    <div className={`w-4 h-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all absolute ${settings.hasDetective ? 'bg-primary right-1' : 'bg-surface-variant left-1'}`}></div>
                  </div>
                </div>

                <div 
                  className={`flex justify-between items-center group ${isHost ? 'cursor-pointer' : 'opacity-70'}`}
                  onClick={() => isHost && updateSetting('hasJester', !settings.hasJester)}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-on-surface text-sm uppercase">CHAOS_AGENT</span>
                    <span className="text-[10px] text-outline uppercase">JESTER ROLE</span>
                  </div>
                  <div className="w-12 h-6 border-2 border-outline-variant p-1 bg-surface-container relative flex items-center">
                    <div className={`w-4 h-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all absolute ${settings.hasJester ? 'bg-error right-1' : 'bg-surface-variant left-1'}`}></div>
                  </div>
                </div>
              </div>

              <div className="dashed-divider"></div>

              {/* Discussion Time */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="font-label-lg uppercase tracking-widest text-outline text-xs">DISCUSSION_TIME</label>
                  <span className="font-mono text-xs text-primary">{settings.discussionTime}s</span>
                </div>
                <div className="flex items-center gap-4">
                  {isHost && (
                    <button onClick={() => updateSetting('discussionTime', Math.max(15, (settings.discussionTime || 60) - 15))} className="px-3 py-1 bg-surface-container border-2 border-outline-variant text-primary hover:bg-surface-variant font-bold transition-all duration-200 active:scale-90">-</button>
                  )}
                  <div className="relative h-6 flex items-center flex-1">
                    <div className="absolute w-full h-[2px] bg-outline-variant"></div>
                    <div className="absolute h-[2px] bg-primary" style={{ width: `${((settings.discussionTime || 60) / 180) * 100}%` }}></div>
                    <div className="absolute w-4 h-6 bg-secondary-fixed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border border-on-secondary-fixed-variant" style={{ left: `calc(${((settings.discussionTime || 60) / 180) * 100}% - 8px)` }}></div>
                  </div>
                  {isHost && (
                    <button onClick={() => updateSetting('discussionTime', Math.min(180, (settings.discussionTime || 60) + 15))} className="px-3 py-1 bg-surface-container border-2 border-outline-variant text-primary hover:bg-surface-variant font-bold transition-all duration-200 active:scale-90">+</button>
                  )}
                </div>
                <div className="flex justify-between text-[9px] text-outline uppercase">
                  <span>15s</span>
                  <span>180s</span>
                </div>
              </div>

              <div className="dashed-divider"></div>
              
              <div className="bg-surface-container-high p-4 border border-outline-variant">
                <div className="flex gap-2 text-primary mb-2">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  <span className="font-label-sm uppercase">INTEL_LEAK_WARNING</span>
                </div>
                <p className="text-[10px] text-outline uppercase leading-normal">
                  All session data is stored locally. Encryption keys will expire in 04:59.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-outline text-sm animate-pulse uppercase">Syncing parameters...</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
