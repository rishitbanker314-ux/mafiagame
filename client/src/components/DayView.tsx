import { useState, useRef, useEffect } from 'react';
import type { Player, KilledPlayer, ChatMessage, SkipInfo } from '../App';
import type { Socket } from 'socket.io-client';
import Layout from './Layout';

interface DayViewProps {
  socket: Socket;
  players: Player[];
  killed: KilledPlayer[];
  chatMessages: ChatMessage[];
  votes: Record<string, number>;
  mySessionId: string;
  phase: 'day_discussion' | 'day_voting';
  myTeammates?: string[];
  timeLeft?: number | null;
  skipInfo?: SkipInfo | null;
  onLeaveGame?: () => void;
}

export default function DayView({
  socket,
  players,
  killed,
  chatMessages,
  votes,
  mySessionId,
  phase,
  timeLeft,
  skipInfo,
  onLeaveGame,
}: DayViewProps) {
  const me = players.find((p) => p.id === mySessionId);
  const isMeAlive = me?.isAlive ?? false;
  const isDiscussion = phase === 'day_discussion';
  const myAgentId = me ? me.name.substring(0, 3).toUpperCase() : '042';

  const [chatInput, setChatInput] = useState('');
  const [hasSkipped, setHasSkipped] = useState(false);
  const [myVoteTarget, setMyVoteTarget] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Reset state when phase changes + show header animation
  useEffect(() => {
    setHasSkipped(false);
    setMyVoteTarget(null);
    setShowHeader(true);
    const timer = setTimeout(() => setShowHeader(false), 4000);
    return () => clearTimeout(timer);
  }, [phase]);

  function handleSendChat() {
    if (!chatInput.trim()) return;
    socket.emit('send_chat', { message: chatInput }, (res: { success: boolean; error?: string }) => {
      if (!res.success) {
        console.error('Chat error:', res.error);
      }
    });
    setChatInput('');
  }

  function handleVote(targetId: string) {
    if (!isMeAlive) return;
    
    setMyVoteTarget(targetId);
    socket.emit('submit_vote', { targetId }, (res: { success: boolean; error?: string }) => {
      if (!res.success) {
        console.error('Vote error:', res.error);
        setMyVoteTarget(null);
      }
    });
  }

  function handleSkipVote() {
    if (!isMeAlive) return;
    
    setMyVoteTarget('__SKIP__');
    socket.emit('skip_vote', null, (res: { success: boolean; error?: string }) => {
      if (!res.success) {
        console.error('Skip vote error:', res?.error);
        setMyVoteTarget(null);
      }
    });
  }

  function handleSkipDiscussion() {
    if (hasSkipped || !isDiscussion) return;
    socket.emit('skip_discussion', null, (res: { success: boolean; error?: string }) => {
      if (res.success) {
        setHasSkipped(true);
      } else {
        console.error('Skip error:', res?.error);
      }
    });
  }

  // votes from server is already targetId → count
  const voteCounts = votes;
  const skipVoteCount = voteCounts['__SKIP__'] || 0;

  const totalVotes = Object.values(votes).reduce((sum, c) => sum + c, 0);
  const alivePlayersCount = players.filter(p => p.isAlive).length;

  // Format time as M:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const phaseFlavorText = isDiscussion
    ? ['INTELLIGENCE BRIEFING IN PROGRESS', 'ANALYZE. DISCUSS. SUSPECT.', 'TRUST NO ONE.']
    : ['ELIMINATION PROTOCOL INITIATED', 'CAST YOUR BALLOT OR ABSTAIN.', 'MAJORITY RULES.'];

  return (
    <Layout agentId={myAgentId} showNav={true} onLeaveGame={onLeaveGame}>
      {/* ── Cinematic Phase Transition Overlay ── */}
      {showHeader && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center" style={{ animation: 'fadeOut 1s ease-out 3s forwards' }}>
          {/* Scan-line background */}
          <div className="absolute inset-0 bg-black/85" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}>
            {/* Red sweep line */}
            <div className="absolute left-0 right-0 h-[2px]" style={{
              background: isDiscussion 
                ? 'linear-gradient(90deg, transparent, #c4a35a, transparent)' 
                : 'linear-gradient(90deg, transparent, #dc2626, transparent)',
              animation: 'sweepDown 2s ease-in-out infinite',
              top: '0%',
            }} />
          </div>

          {/* Center content */}
          <div className="relative text-center z-10 px-8">
            {/* Decorative top line */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-[1px] w-16 md:w-32" style={{ background: isDiscussion ? 'linear-gradient(90deg, transparent, #c4a35a)' : 'linear-gradient(90deg, transparent, #dc2626)' }} />
              <span className="material-symbols-outlined text-2xl" style={{ color: isDiscussion ? '#c4a35a' : '#dc2626', fontVariationSettings: "'FILL' 1", animation: 'pulse 1.5s ease-in-out infinite' }}>
                {isDiscussion ? 'forum' : 'gavel'}
              </span>
              <div className="h-[1px] w-16 md:w-32" style={{ background: isDiscussion ? 'linear-gradient(270deg, transparent, #c4a35a)' : 'linear-gradient(270deg, transparent, #dc2626)' }} />
            </div>

            {/* Phase Title — typewriter style */}
            <h1 className="font-display-lg text-4xl md:text-6xl uppercase tracking-[0.3em] leading-none mb-4" style={{
              color: isDiscussion ? '#c4a35a' : '#dc2626',
              textShadow: isDiscussion ? '0 0 30px rgba(196,163,90,0.5)' : '0 0 30px rgba(220,38,38,0.5)',
              animation: 'typeReveal 0.8s steps(20, end) forwards',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              borderRight: isDiscussion ? '3px solid #c4a35a' : '3px solid #dc2626',
            }}>
              {isDiscussion ? 'DEBRIEFING' : 'VOTE'}
            </h1>

            {/* Subtitle */}
            <p className="text-[10px] md:text-sm uppercase tracking-widest md:tracking-[0.5em] text-gray-400 mb-8 px-2 break-words" style={{ animation: 'fadeInUp 0.6s ease-out 0.8s both' }}>
              {phaseFlavorText[0]}
            </p>

            {/* Killed report in overlay */}
            {killed.length > 0 && (
              <div className="mt-4" style={{ animation: 'fadeInUp 0.6s ease-out 1.2s both' }}>
                <div className="inline-flex items-center gap-3 border px-6 py-3" style={{ borderColor: '#dc2626' }}>
                  <span className="material-symbols-outlined text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>skull</span>
                  <span className="text-red-400 font-bold uppercase tracking-widest text-sm">
                    {killed.map(k => k.playerName).join(', ')} — ELIMINATED
                  </span>
                </div>
              </div>
            )}
            {killed.length === 0 && (
              <div className="mt-4" style={{ animation: 'fadeInUp 0.6s ease-out 1.2s both' }}>
                <span className="text-xs uppercase tracking-[0.4em] text-gray-500">
                  ☽ THE NIGHT WAS UNEVENTFUL. NO CASUALTIES. ☽
                </span>
              </div>
            )}

            {/* Decorative bottom line */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="h-[1px] w-16 md:w-32" style={{ background: isDiscussion ? 'linear-gradient(90deg, transparent, #c4a35a)' : 'linear-gradient(90deg, transparent, #dc2626)' }} />
              <span className="text-[8px] uppercase tracking-[0.5em]" style={{ color: isDiscussion ? '#c4a35a' : '#dc2626' }}>
                {isDiscussion ? '◆ DAY PHASE ◆' : '◆ JUDGMENT ◆'}
              </span>
              <div className="h-[1px] w-16 md:w-32" style={{ background: isDiscussion ? 'linear-gradient(270deg, transparent, #c4a35a)' : 'linear-gradient(270deg, transparent, #dc2626)' }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Inline CSS for animations ── */}
      <style>{`
        @keyframes sweepDown {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes typeReveal {
          from { max-width: 0; }
          to { max-width: 100%; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div className="max-w-container-max mx-auto h-full flex flex-col pt-4 pb-12">

        {/* ── Compact Phase Bar with Timer ── */}
        <section className="mb-4 shrink-0">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            {/* Phase info */}
            <div className="flex items-center gap-4">
              <div className={`w-1.5 self-stretch ${isDiscussion ? 'bg-primary' : 'bg-error'}`} />
              <div>
                <h1 className="font-display-lg text-lg md:text-2xl uppercase tracking-tight leading-none break-words">
                  {isDiscussion ? 'DEBRIEFING' : 'ELIMINATION PROTOCOL'}
                </h1>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className={`px-2 py-0.5 text-[10px] font-label-lg uppercase tracking-widest ${isDiscussion ? 'bg-primary text-on-primary' : 'bg-error text-on-error'}`}>
                    {isDiscussion ? 'DISCUSSION' : 'VOTE'}
                  </span>
                  <span className="text-outline text-[10px] uppercase tracking-widest italic hidden md:inline">
                    {phaseFlavorText[1]}
                  </span>
                </div>
              </div>
            </div>

            {/* Countdown Timer */}
            {timeLeft !== null && timeLeft !== undefined && (
              <div className={`flex items-center gap-3 border-2 p-2 md:p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${timeLeft <= 10 ? 'border-error bg-error/10' : 'border-outline-variant bg-surface-container-high'}`}>
                <span className={`material-symbols-outlined text-lg ${timeLeft <= 10 ? 'text-error animate-pulse' : 'text-primary'}`}>timer</span>
                <div className="text-center">
                  <div className={`font-mono text-xl md:text-2xl font-black tracking-wider ${timeLeft <= 10 ? 'text-error' : 'text-on-surface'}`}>
                    {formatTime(timeLeft)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Casualties strip */}
          {killed.length > 0 && (
            <div className="mt-3 flex items-center gap-3 px-3 py-2 border-l-4 border-error bg-error/5">
              <span className="material-symbols-outlined text-error text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>skull</span>
              <span className="text-xs uppercase tracking-wider text-error font-bold">CASUALTIES:</span>
              {killed.map((k, i) => (
                <span key={i} className="bg-error text-on-error px-2 py-0.5 text-[10px] font-bold uppercase">{k.playerName}</span>
              ))}
            </div>
          )}

          {!isMeAlive && (
            <div className="mt-2 text-error font-bold text-[10px] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">warning</span>
              You have been eliminated. Ghost channel only — no voting.
            </div>
          )}
        </section>

        {/* ── Main Content: Chat + Voting Cards ── */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-gutter lg:flex-1 lg:min-h-0 lg:overflow-hidden lg:h-full">

          {/* Left: Chat / Bulletin Board */}
          <div className="lg:col-span-7 flex flex-col lg:min-h-0 lg:flex-1 h-[450px] lg:h-auto">
            <section className="bg-surface-container-low p-4 md:p-5 border-2 border-outline-variant relative flex flex-col flex-1 min-h-0">
              <h2 className="font-headline-md text-headline-md uppercase mb-3 border-b border-dashed border-outline pb-2 flex items-center gap-2 shrink-0 text-sm">
                <span className="material-symbols-outlined text-sm">push_pin</span> 
                AGENTS' DISCUSSION
                {isDiscussion && isMeAlive && (
                  <button
                    onClick={handleSkipDiscussion}
                    disabled={hasSkipped}
                    className={`ml-auto text-[10px] px-2 py-1 border uppercase font-label-sm tracking-wider transition-all duration-300 ease-out active:scale-95 disabled:active:scale-100 ${
                      hasSkipped
                        ? 'border-outline text-outline cursor-not-allowed bg-surface-container'
                        : 'border-primary text-primary hover:bg-primary hover:text-on-primary hover:scale-[1.05]'
                    }`}
                  >
                    {hasSkipped ? '✓ SKIP REQUESTED' : 'SKIP DISCUSSION'}
                  </button>
                )}
              </h2>

              {/* Skip progress indicator */}
              {isDiscussion && skipInfo && skipInfo.skipCount > 0 && (
                <div className="mb-2 text-[10px] text-outline uppercase tracking-wider shrink-0">
                  SKIP VOTES: {skipInfo.skipCount}/{skipInfo.totalNeeded}
                </div>
              )}
              
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {chatMessages.length === 0 && (
                  <div className="h-full flex items-center justify-center text-outline text-xs italic uppercase">
                    Awaiting transmissions...
                  </div>
                )}
                {chatMessages.map((msg, i) => {
                  const isMyMsg = msg.senderId === mySessionId;
                  
                  if (msg.isSystem) {
                    return (
                      <div key={msg.id || i} className="text-center my-2 w-full flex justify-center">
                        <span className="inline-block max-w-[95%] px-3 py-1 bg-surface-container-highest text-outline text-[10px] tracking-wide border border-outline-variant break-words whitespace-normal text-center">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  const rotation = isMyMsg ? 'rotate(0.5deg)' : 'rotate(-0.5deg)';
                  const alignment = isMyMsg ? 'ml-auto text-right' : '';
                  
                  return (
                    <div key={msg.id || i} className={`pinned-note bg-surface-container-highest p-3 border border-outline shadow-[2px_2px_0px_0px_rgba(0,0,0,0.6)] w-[85%] md:w-3/4 ${alignment}`} style={{ transform: rotation }}>
                      <div className={`flex justify-between items-center mb-1 ${isMyMsg ? 'flex-row-reverse' : ''}`}>
                        <span className={`font-label-lg underline text-[11px] ${isMyMsg ? 'text-tertiary' : 'text-primary'}`}>
                          {msg.senderName.toUpperCase()}
                        </span>
                        {msg.isGhost && <span className="text-[8px] text-outline italic">GHOST</span>}
                      </div>
                      <p className={`font-body-md text-sm ${msg.isGhost ? 'text-slate-400 italic' : 'text-on-surface'}`}>
                        {msg.text}
                      </p>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="mt-3 pt-3 border-t-2 border-outline-variant shrink-0">
                <div className="relative">
                  <input 
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                    className="w-full bg-transparent border-b-2 border-outline focus:border-primary outline-none py-2 px-0 font-body-lg text-on-surface placeholder:opacity-30 pr-28 text-sm" 
                    placeholder={isMeAlive ? "TYPE YOUR FINDINGS..." : "TRANSMIT GHOST MESSAGE..."} 
                    type="text"
                  />
                  <button 
                    onClick={handleSendChat}
                    disabled={!chatInput.trim()}
                    className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 font-label-lg text-xs text-primary hover:text-on-surface transition-all duration-300 ease-out hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
                  >
                    TRANSMIT <span className="material-symbols-outlined text-sm">send</span>
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Right: Voting Cards + Agent List */}
          <div className="lg:col-span-5 flex flex-col lg:min-h-0 lg:flex-1 h-[400px] lg:h-auto gap-3 mt-4 lg:mt-0">
            
            {/* Voting Status Bar */}
            <div className="bg-surface-container p-3 border-2 border-outline-variant shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-outline font-label-sm text-[10px] uppercase mb-0.5">Ballots Cast</div>
                  <div className="font-headline-lg text-lg">{totalVotes}/{alivePlayersCount}</div>
                </div>
                <div className="text-right">
                  <div className="text-outline font-label-sm text-[10px] uppercase mb-0.5">Your Status</div>
                  <div className="font-headline-md text-xs uppercase text-primary">
                    {!isMeAlive ? 'DECEASED' : myVoteTarget ? (myVoteTarget === '__SKIP__' ? 'SKIP CAST' : 'VOTE CAST') : 'AWAITING VOTE'}
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Cards (scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">

              {/* ── NO ELIMINATION card ── */}
              {isMeAlive && (
                <div 
                  className={`p-3 flex items-center gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] border-2 transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                    myVoteTarget === '__SKIP__'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant bg-surface-container hover:border-primary hover:bg-primary/5'
                  }`}
                  onClick={handleSkipVote}
                >
                  <div className="w-10 h-12 flex items-center justify-center border border-outline-variant bg-surface-container-highest shrink-0">
                    <span className="material-symbols-outlined text-lg text-outline">block</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-headline-md text-xs uppercase tracking-tighter">NO ELIMINATION</h4>
                    <span className="text-[9px] uppercase text-outline tracking-wider">SKIP THIS ROUND</span>
                  </div>
                  {skipVoteCount > 0 && (
                    <span className="font-mono text-xs font-bold text-primary">{skipVoteCount}</span>
                  )}
                  <div className={`shrink-0 px-2 py-1.5 text-[10px] uppercase tracking-widest font-bold border-2 transition-all ${
                    myVoteTarget === '__SKIP__'
                      ? 'border-primary text-primary bg-primary/10'
                      : 'border-outline text-outline'
                  }`}>
                    {myVoteTarget === '__SKIP__' ? '✓ SKIP' : 'SKIP'}
                  </div>
                </div>
              )}

              {/* ── Player voting cards ── */}
              {players.filter(p => p.isAlive).map(player => {
                const count = voteCounts[player.id] || 0;
                const isMyVote = myVoteTarget === player.id;
                
                return (
                  <div key={player.id} className="dossier-paper bg-[#e5e2e1] text-[#1c1b1b] p-3 flex items-center gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative transition-transform">
                    {isMyVote && (
                      <div className="absolute -right-1 -top-1 z-10">
                        <span className="material-symbols-outlined text-error text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>target</span>
                      </div>
                    )}

                    {/* Avatar */}
                    <div className="w-10 h-12 bg-[#d5d0c8] flex items-center justify-center font-bold text-lg text-[#5a5654] border border-[#aaa] shrink-0">
                      {player.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + Tally */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-headline-md text-xs uppercase tracking-tighter truncate">
                        {player.name} {player.id === mySessionId && '(YOU)'}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] uppercase font-label-sm text-[#6b6563]">ACCUSATIONS:</span>
                        <span className="font-mono text-xs font-bold text-red-900">
                          {count > 0 ? count : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Vote Button */}
                    {player.id !== mySessionId ? (
                      <button 
                        onClick={() => handleVote(player.id)}
                        disabled={!isMeAlive}
                        className={`shrink-0 px-2 py-1.5 text-[10px] uppercase tracking-widest font-bold border-2 transition-all duration-300 ease-out hover:scale-[1.05] active:scale-95 disabled:hover:scale-100 disabled:active:scale-100 ${
                          isMyVote 
                            ? 'border-green-800 text-green-800 bg-green-800/10' 
                            : 'border-red-900 text-red-900 hover:bg-red-900 hover:text-white'
                        } ${!isMeAlive ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isMyVote ? '✓ CAST' : 'VOTE'}
                      </button>
                    ) : (
                      <div className="shrink-0 px-2 py-1.5 text-[10px] uppercase tracking-widest font-bold border-2 border-outline-variant text-outline opacity-50">
                        YOU
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Deceased agents */}
              {players.filter(p => !p.isAlive).length > 0 && (
                <div className="border-t border-dashed border-outline-variant pt-2 mt-2">
                  <div className="text-[9px] uppercase text-outline tracking-widest mb-1.5">DECEASED AGENTS</div>
                  {players.filter(p => !p.isAlive).map(player => (
                    <div key={player.id} className="flex items-center gap-3 opacity-50 py-1">
                      <div className="w-6 h-7 bg-surface-container-highest flex items-center justify-center text-[10px] font-bold border border-outline-variant">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[10px] uppercase text-outline line-through">{player.name}</span>
                      <span className="text-[8px] text-error uppercase font-bold ml-auto">DECEASED</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
