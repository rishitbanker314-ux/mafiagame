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
}: DayViewProps) {
  const me = players.find((p) => p.id === mySessionId);
  const isMeAlive = me?.isAlive ?? false;
  const isDiscussion = phase === 'day_discussion';
  const myAgentId = me ? me.name.substring(0, 3).toUpperCase() : '042';

  const [chatInput, setChatInput] = useState('');
  const [hasSkipped, setHasSkipped] = useState(false);
  const [myVoteTarget, setMyVoteTarget] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Reset state when phase changes
  useEffect(() => {
    setHasSkipped(false);
    setMyVoteTarget(null);
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

  const totalVotes = Object.values(votes).reduce((sum, c) => sum + c, 0);
  const alivePlayersCount = players.filter(p => p.isAlive).length;

  // Format time as M:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Layout agentId={myAgentId} showNav={true}>
      <div className="max-w-container-max mx-auto h-full flex flex-col pt-4 pb-12">

        {/* ── Phase Header with Timer ── */}
        <section className="mb-6 shrink-0">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="border-l-4 border-error pl-6 py-2">
              <h1 className="font-display-lg text-display-lg uppercase tracking-tight leading-none mb-1">
                {isDiscussion ? 'DEBRIEFING' : 'ELIMINATION PROTOCOL'}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <span className={`px-3 py-1 font-label-lg text-label-lg ${isDiscussion ? 'bg-primary text-on-primary' : 'bg-error text-on-error'}`}>
                  {isDiscussion ? 'DISCUSSION' : 'VOTING IN PROGRESS'}
                </span>
                <span className="font-body-md text-outline uppercase tracking-widest italic hidden md:inline">
                  {isDiscussion ? 'EVIDENCE IS EVERYTHING.' : 'THE TRUTH IS DEBATABLE.'}
                </span>
              </div>
            </div>

            {/* Countdown Timer */}
            {timeLeft !== null && timeLeft !== undefined && (
              <div className="flex items-center gap-3 bg-surface-container-high border-2 border-outline-variant p-3 md:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="material-symbols-outlined text-xl text-primary">timer</span>
                <div className="text-center">
                  <div className={`font-mono text-2xl md:text-3xl font-black tracking-wider ${timeLeft <= 10 ? 'text-error animate-pulse' : 'text-on-surface'}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-outline font-label-sm">REMAINING</div>
                </div>
              </div>
            )}
          </div>

          {/* Incident Report (Night Results) — compact strip */}
          {killed.length > 0 && (
            <div className="mt-4 bg-secondary-fixed text-on-secondary-fixed p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center gap-4">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>priority_high</span>
              <span className="font-headline-md uppercase tracking-tighter">CASUALTIES:</span>
              {killed.map((k, i) => (
                <span key={i} className="bg-black text-white px-2 py-1 font-bold text-sm uppercase">
                  {k.playerName}
                </span>
              ))}
            </div>
          )}
          {killed.length === 0 && (
            <div className="mt-4 bg-surface-container-high text-on-surface p-3 border border-outline-variant text-sm italic">
              No casualties reported. The night was quiet.
            </div>
          )}

          {!isMeAlive && (
            <div className="mt-2 text-error font-bold text-xs uppercase tracking-wider">
              ⚠ You have been eliminated. Ghost channel only — no voting.
            </div>
          )}
        </section>

        {/* ── Main Content: Chat + Voting Cards ── */}
        <div className="grid grid-cols-12 gap-gutter flex-1 min-h-0 overflow-hidden">

          {/* Left: Chat / Bulletin Board */}
          <div className="col-span-12 lg:col-span-7 flex flex-col min-h-0">
            <section className="bg-surface-container-low p-4 md:p-6 border-2 border-outline-variant relative flex flex-col flex-1 min-h-0">
              <h2 className="font-headline-md text-headline-md uppercase mb-3 border-b border-dashed border-outline pb-2 flex items-center gap-2 shrink-0">
                <span className="material-symbols-outlined">push_pin</span> 
                AGENTS' DISCUSSION
                {isDiscussion && isMeAlive && (
                  <button
                    onClick={handleSkipDiscussion}
                    disabled={hasSkipped}
                    className={`ml-auto text-xs px-3 py-1 border uppercase font-label-sm tracking-wider transition-all ${
                      hasSkipped
                        ? 'border-outline text-outline cursor-not-allowed bg-surface-container'
                        : 'border-primary text-primary hover:bg-primary hover:text-on-primary'
                    }`}
                  >
                    {hasSkipped ? 'SKIP REQUESTED' : 'SKIP DISCUSSION'}
                  </button>
                )}
              </h2>

              {/* Skip progress indicator */}
              {isDiscussion && skipInfo && skipInfo.skipCount > 0 && (
                <div className="mb-2 text-xs text-outline uppercase tracking-wider shrink-0">
                  SKIP VOTES: {skipInfo.skipCount}/{skipInfo.totalNeeded}
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {chatMessages.length === 0 && (
                  <div className="h-full flex items-center justify-center text-outline text-sm italic uppercase">
                    Awaiting transmissions...
                  </div>
                )}
                {chatMessages.map((msg, i) => {
                  const isMyMsg = msg.senderId === mySessionId;
                  
                  if (msg.isSystem) {
                    return (
                      <div key={msg.id || i} className="text-center my-2">
                        <span className="inline-block px-3 py-1 bg-surface-container-highest text-outline text-xs tracking-wide border border-outline-variant">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  const rotation = isMyMsg ? 'rotate(1deg)' : 'rotate(-1deg)';
                  const alignment = isMyMsg ? 'ml-auto text-right' : '';
                  
                  return (
                    <div key={msg.id || i} className={`pinned-note bg-surface-container-highest p-3 md:p-4 border border-outline shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-[85%] md:w-2/3 ${alignment}`} style={{ transform: rotation }}>
                      <div className={`flex justify-between items-center mb-1 ${isMyMsg ? 'flex-row-reverse' : ''}`}>
                        <span className={`font-label-lg underline text-sm ${isMyMsg ? 'text-tertiary' : 'text-primary'}`}>
                          {msg.senderName.toUpperCase()}
                        </span>
                        {msg.isGhost && <span className="text-[9px] text-outline italic">GHOST</span>}
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
                    className="w-full bg-transparent border-b-2 border-outline focus:border-primary outline-none py-2 px-0 font-body-lg text-on-surface placeholder:opacity-30 pr-28" 
                    placeholder={isMeAlive ? "TYPE YOUR FINDINGS..." : "TRANSMIT GHOST MESSAGE..."} 
                    type="text"
                  />
                  <button 
                    onClick={handleSendChat}
                    disabled={!chatInput.trim()}
                    className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 font-label-lg text-primary hover:text-on-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    TRANSMIT <span className="material-symbols-outlined text-sm">send</span>
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Right: Voting Cards + Agent List */}
          <div className="col-span-12 lg:col-span-5 flex flex-col min-h-0 gap-4">
            
            {/* Voting Status Bar */}
            <div className="bg-surface-container p-3 md:p-4 border-2 border-outline-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-outline font-label-sm text-label-sm uppercase mb-1">Ballots Cast</div>
                  <div className="font-headline-lg text-headline-lg">{totalVotes}/{alivePlayersCount}</div>
                </div>
                <div className="text-right">
                  <div className="text-outline font-label-sm text-label-sm uppercase mb-1">Your Status</div>
                  <div className="font-headline-md text-sm uppercase text-primary">
                    {!isMeAlive ? 'DECEASED' : myVoteTarget ? 'VOTE CAST' : 'AWAITING VOTE'}
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Cards (scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
              {players.filter(p => p.isAlive).map(player => {
                const count = voteCounts[player.id] || 0;
                const isMyVote = myVoteTarget === player.id;
                
                return (
                  <div key={player.id} className="dossier-paper bg-[#e5e2e1] text-[#1c1b1b] p-4 flex items-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative transition-transform">
                    {isMyVote && (
                      <div className="absolute -right-1 -top-1 z-10">
                        <span className="material-symbols-outlined text-error text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>target</span>
                      </div>
                    )}

                    {/* Avatar */}
                    <div className="w-10 h-12 bg-[#d5d0c8] flex items-center justify-center font-bold text-xl text-[#5a5654] border border-[#aaa] shrink-0">
                      {player.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + Tally */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-headline-md text-sm uppercase tracking-tighter truncate">
                        {player.name} {player.id === mySessionId && '(YOU)'}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-label-sm text-[#6b6563]">ACCUSATIONS:</span>
                        <span className="font-mono text-sm font-bold text-red-900">
                          {count > 0 ? count : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Vote Button */}
                    <button 
                      onClick={() => handleVote(player.id)}
                      disabled={!isMeAlive}
                      className={`shrink-0 px-3 py-2 text-xs uppercase tracking-widest font-bold border-2 transition-all ${
                        isMyVote 
                          ? 'border-green-800 text-green-800 bg-green-800/10' 
                          : 'border-red-900 text-red-900 hover:bg-red-900 hover:text-white'
                      } ${!isMeAlive ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isMyVote ? '✓ CAST' : 'VOTE'}
                    </button>
                  </div>
                );
              })}

              {/* Deceased agents */}
              {players.filter(p => !p.isAlive).length > 0 && (
                <div className="border-t border-dashed border-outline-variant pt-3 mt-3">
                  <div className="text-[10px] uppercase text-outline tracking-widest mb-2">DECEASED AGENTS</div>
                  {players.filter(p => !p.isAlive).map(player => (
                    <div key={player.id} className="flex items-center gap-3 opacity-50 py-1">
                      <div className="w-6 h-8 bg-surface-container-highest flex items-center justify-center text-xs font-bold border border-outline-variant">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs uppercase text-outline line-through">{player.name}</span>
                      <span className="text-[9px] text-error uppercase font-bold ml-auto">DECEASED</span>
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
