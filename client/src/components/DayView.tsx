import { useState, useRef, useEffect } from 'react';
import type { Player, KilledPlayer, ChatMessage } from '../App';
import type { Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
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
}

export default function DayView({
  socket,
  players,
  killed,
  chatMessages,
  votes,
  mySessionId,
  phase,
  myTeammates,
}: DayViewProps) {
  const me = players.find((p) => p.id === mySessionId);
  const isMeAlive = me?.isAlive ?? false;
  const isDiscussion = phase === 'day_discussion';
  const myAgentId = me ? me.name.substring(0, 3).toUpperCase() : '042';

  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
    if (phase !== 'day_voting' || !isMeAlive) return;
    
    socket.emit('submit_vote', { targetId }, (res: { success: boolean; error?: string }) => {
      if (!res.success) {
        console.error('Vote error:', res.error);
      }
    });
  }

  // Count votes
  const voteCounts: Record<string, number> = {};
  Object.values(votes).forEach(targetId => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  const getTallyMarks = (count: number) => {
    if (!count) return '';
    let marks = '';
    for (let i = 1; i <= count; i++) {
      if (i % 5 === 0) {
        marks += ' <span class="tracking-[-8px]">/</span> ';
      } else {
        marks += '/';
      }
    }
    return <span dangerouslySetInnerHTML={{ __html: marks }} />;
  };

  const totalVotes = Object.keys(votes).length;
  const alivePlayersCount = players.filter(p => p.isAlive).length;

  return (
    <Layout agentId={myAgentId} showNav={true}>
      <div className="max-w-container-max mx-auto h-full flex flex-col pt-4 pb-12">
        {isDiscussion ? (
          <div className="grid grid-cols-12 gap-gutter h-full">
            {/* Central Column: Incident Report & Discussion */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-8 h-full">
              {/* Incident Report */}
              <section className="relative bg-secondary-fixed text-on-secondary-fixed p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] torn-edge overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <span className="material-symbols-outlined text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>priority_high</span>
                </div>
                <div className="flex items-center gap-4 mb-4 border-b-2 border-on-secondary-container/30 pb-4">
                  <span className="material-symbols-outlined text-3xl">terminal</span>
                  <h1 className="font-headline-lg text-headline-lg uppercase tracking-tighter">INCIDENT REPORT</h1>
                </div>
                <div className="font-body-lg text-body-lg leading-relaxed">
                  {killed.length > 0 ? (
                    <>
                      <p className="mb-4">
                        Investigation team arrived at dawn. Casualties detected:
                      </p>
                      {killed.map((k, i) => (
                        <p key={i} className="font-bold">
                          Agent <span className="bg-black text-white px-1">"{k.playerName.toUpperCase()}"</span> was eliminated.
                        </p>
                      ))}
                      <div className="border-y border-dashed border-on-secondary-fixed/40 py-2 my-4 font-bold uppercase text-center tracking-widest text-sm">
                        ---------------- STATUS: DECEASED ----------------
                      </div>
                    </>
                  ) : (
                    <p className="mb-4">
                      No casualties reported. All agents accounted for.
                      <br/>
                      The night was quiet.
                    </p>
                  )}
                  {!isMeAlive && (
                    <p className="italic text-error font-bold mt-4">
                      WARNING: You have been eliminated. You may transmit on the ghost channel, but cannot vote.
                    </p>
                  )}
                </div>
              </section>

              {/* Bulletin Board Chat Area */}
              <section className="bg-surface-container-low p-6 border-2 border-outline-variant relative flex flex-col flex-1 min-h-[400px]">
                <h2 className="font-headline-md text-headline-md uppercase mb-4 border-b border-dashed border-outline pb-2 flex items-center gap-2 shrink-0">
                  <span className="material-symbols-outlined">push_pin</span> 
                  AGENTS' DISCUSSION
                </h2>
                
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {chatMessages.map((msg, i) => {
                    const isMyMsg = msg.playerId === mySessionId;
                    const rotation = isMyMsg ? 'rotate(1deg)' : 'rotate(-1deg)';
                    const alignment = isMyMsg ? 'ml-auto text-right' : '';
                    
                    return (
                      <div key={i} className={`pinned-note bg-surface-container-highest p-4 border border-outline shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-3/4 md:w-2/3 ${alignment}`} style={{ transform: rotation }}>
                        <div className={`flex justify-between items-center mb-2 ${isMyMsg ? 'flex-row-reverse' : ''}`}>
                          <span className={`font-label-lg underline ${isMyMsg ? 'text-tertiary' : 'text-primary'}`}>
                            {msg.senderName.toUpperCase()}
                          </span>
                          <span className="text-[10px] opacity-50">{msg.timestamp}</span>
                        </div>
                        <p className={`font-body-md ${msg.isGhost ? 'text-slate-400 italic' : ''}`}>
                          {msg.message}
                        </p>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="mt-4 pt-4 border-t-2 border-outline-variant shrink-0">
                  <div className="relative">
                    <input 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                      className="w-full bg-transparent border-b-2 border-outline focus:border-primary outline-none py-2 px-0 font-body-lg text-on-surface placeholder:opacity-30" 
                      placeholder={isMeAlive ? "TYPE YOUR FINDINGS..." : "TRANSMIT GHOST MESSAGE..."} 
                      type="text"
                    />
                    <button 
                      onClick={handleSendChat}
                      className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 font-label-lg text-primary hover:text-on-surface transition-colors"
                    >
                      TRANSMIT <span className="material-symbols-outlined text-sm">send</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Surviving Agents */}
            <div className="col-span-12 lg:col-span-4 h-full">
              <aside className="bg-surface-container-high p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full flex flex-col">
                <div className="text-center border-b-4 border-black mb-6 pb-2 shrink-0">
                  <h3 className="font-display-lg text-3xl uppercase leading-none tracking-tighter">BUREAU ACTIVE</h3>
                  <p className="font-label-sm italic">Status Surveillance Report</p>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
                  {players.map(p => (
                    <div key={p.id} className="flex gap-4 group">
                      <div className={`w-16 h-20 bg-surface-container-lowest border border-outline-variant grayscale p-1 transition-all flex items-center justify-center ${!p.isAlive ? 'border-error' : ''}`}>
                        <div className="font-display-lg text-4xl text-outline-variant">{p.name.charAt(0).toUpperCase()}</div>
                      </div>
                      <div className="flex-1 border-b border-dashed border-outline-variant pb-2">
                        <h4 className={`font-headline-md text-lg uppercase leading-tight ${!p.isAlive ? 'text-error' : 'text-on-surface'}`}>
                          {p.name} {p.id === mySessionId && '(YOU)'}
                        </h4>
                        <p className="font-label-sm text-xs opacity-60 mb-1">
                          {p.isBot ? 'AUTOMATON' : 'FIELD AGENT'}
                        </p>
                        <span className={`inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest border ${p.isAlive ? 'bg-green-900/30 text-green-400 border-green-900' : 'bg-error-container text-on-error-container border-error'}`}>
                          {p.isAlive ? 'STABLE' : 'DECEASED'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 bg-black/40 p-4 border border-outline-variant italic text-sm text-center shrink-0">
                  <p className="mb-2 opacity-50">"The ink never lies, but the printer might."</p>
                  <div className="text-[10px] font-label-sm uppercase opacity-40">BUREAU CLASSIFIED</div>
                </div>
              </aside>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Voting Phase Header */}
            <section className="mb-8 max-w-container-max mx-auto w-full shrink-0">
              <div className="border-l-4 border-error pl-6 py-2">
                <h1 className="font-display-lg text-display-lg uppercase tracking-tight leading-none mb-2 text-error">ELIMINATION PROTOCOL</h1>
                <div className="flex items-center gap-4">
                  <span className="bg-error text-on-error px-3 py-1 font-label-lg text-label-lg">VOTING IN PROGRESS</span>
                  <span className="font-body-md text-outline uppercase tracking-widest italic">THE TRUTH IS DEBATABLE.</span>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-container p-6 border-2 border-outline-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-outline font-label-sm text-label-sm uppercase mb-1">Total Ballots</div>
                  <div className="font-headline-lg text-headline-lg">{totalVotes}/{alivePlayersCount}</div>
                </div>
                <div className="bg-surface-container p-6 border-2 border-outline-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-outline font-label-sm text-label-sm uppercase mb-1">Status</div>
                  <div className="font-headline-lg text-headline-lg uppercase text-primary">
                    {isMeAlive ? (votes[mySessionId] ? 'VOTE CAST' : 'AWAITING VOTE') : 'DECEASED (NO VOTE)'}
                  </div>
                </div>
              </div>
            </section>

            {/* Bento Grid Voting Area */}
            <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 w-full pb-8 flex-1 overflow-y-auto custom-scrollbar pr-4">
              {players.filter(p => p.isAlive).map(player => {
                const count = voteCounts[player.id] || 0;
                const isMyVote = votes[mySessionId] === player.id;
                
                return (
                  <div key={player.id} className="col-span-12 md:col-span-6 lg:col-span-4 dossier-paper bg-[#e5e2e1] text-[#1c1b1b] p-6 flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative transition-transform">
                    {isMyVote && (
                      <div className="absolute -right-2 -top-2 z-10">
                        <span className="material-symbols-outlined text-error text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>target</span>
                      </div>
                    )}
                    <div className="mb-4">
                      <h3 className="font-headline-md text-headline-md uppercase tracking-tighter">{player.name} {player.id === mySessionId && '(YOU)'}</h3>
                      <p className="font-body-md text-sm italic opacity-80 border-b border-black/20 border-dashed pb-2">
                        {player.isBot ? "Automaton suspect." : "Field agent suspect."}
                      </p>
                    </div>
                    
                    <div className="mb-6 flex justify-between items-end">
                      <div>
                        <span className="text-xs uppercase font-label-sm">ACCUSATIONS:</span>
                        <div className="font-mono text-2xl leading-none text-red-900 mt-1 font-bold">
                          {getTallyMarks(count) || '-'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs uppercase font-label-sm">COUNT</span>
                        <div className="font-headline-md text-headline-md">{count < 10 ? `0${count}` : count}</div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleVote(player.id)}
                      disabled={!isMeAlive}
                      className={`stamp-button mt-auto w-full border-4 py-3 uppercase tracking-widest font-headline-md transition-all transform ${isMyVote ? 'border-green-800 text-green-800 bg-green-800/10 rotate-[-1deg]' : 'border-red-900 text-red-900 shadow-[4px_4px_0px_0px_rgba(127,29,29,0.3)] hover:bg-red-900 hover:text-white rotate-[1deg]'} ${!isMeAlive ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isMyVote ? 'VOTE CAST' : 'VOTE TO ELIMINATE'}
                    </button>
                  </div>
                );
              })}
            </div>
            
            {/* Reduced Chat for Voting Phase */}
            <div className="max-w-container-max mx-auto w-full shrink-0 bg-surface-container border-2 border-outline-variant p-4 mt-4 h-48 flex flex-col">
              <h3 className="font-label-lg uppercase mb-2 text-primary tracking-widest border-b border-outline-variant pb-1 flex justify-between">
                <span>Live Protocol Log</span>
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2 mb-2">
                {chatMessages.map((msg, i) => (
                  <div key={i} className="flex gap-3 font-body-md text-sm">
                    <span className="text-outline">{msg.timestamp}</span>
                    <span className={msg.isGhost ? 'text-slate-400 italic' : ''}>
                      <span className="font-bold">{msg.senderName}</span>: {msg.message}
                    </span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="relative shrink-0">
                <input 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                  className="w-full bg-background border border-outline-variant focus:border-primary outline-none py-1 px-2 font-body-sm text-on-surface" 
                  placeholder={isMeAlive ? "Transmit message..." : "Transmit ghost message..."} 
                  type="text"
                />
              </div>
            </div>

          </div>
        )}
      </div>
    </Layout>
  );
}
