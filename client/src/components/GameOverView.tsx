import { useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { motion } from 'framer-motion';
import type { RevealedRole } from '../App';
import Layout from './Layout';

interface GameOverViewProps {
  socket: Socket;
  winner: string | null;
  revealedRoles: RevealedRole[];
  isHost: boolean;
  mySessionId: string;
  players: any[];
}

export default function GameOverView({ socket, winner, revealedRoles, isHost, mySessionId, players }: GameOverViewProps) {
  useEffect(() => {
    // Generate static noise effect
  }, []);

  function handlePlayAgain() {
    socket.emit('reset_game');
  }

  // Determine header text and styles based on winner
  let titleText = 'CASE CLOSED';
  let subText = 'Justice remains in the shadows. The city falls silent.';
  let faction = 'UNKNOWN';

  if (winner === 'mafia') {
    titleText = 'THE MAFIA DOMINATES';
    subText = 'Justice remains in the shadows. The city falls silent as the family takes control.';
    faction = 'MAFIA';
  } else if (winner === 'village') {
    titleText = 'THE VILLAGE SURVIVES';
    subText = 'The conspiracy is rooted out. The remaining citizens can finally sleep.';
    faction = 'VILLAGE';
  } else if (winner === 'jester') {
    titleText = 'CHAOS REIGNS';
    subText = 'The Jester had the last laugh. Sanity is officially a prison.';
    faction = 'JESTER';
  } else if (winner) {
    titleText = `${winner.toUpperCase()} WINS`;
  }

  const me = (players || []).find(p => p.id === mySessionId);
  const myAgentId = me ? me.name.substring(0, 3).toUpperCase() : '042';

  return (
    <Layout agentId={myAgentId} showNav={false}>
      {/* Background Layer: The Desk */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-surface-container-lowest opacity-40"></div>
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] rotate-2 opacity-30 bg-cover bg-center" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAyGshomCqBwJ2941ZC9ePiapdLBtJeOs-9Lu95PP-HO8Fv2yqbwY1HUeuYKDhbuc-r1D-WabyeI8rKM1-238tu2UGkM21dWftronczMd-FtNcjB4vdUgS0Z312Gd2BcNueymWMxjyN6m2x_c-fpSrN4a-kDZlU2wYRuzMBOIgM8UoCc-ewxtNwjPpD8FQaEcBjy1pHsxF4Te5U9_P5dRAYQ1cWp3xGJGONdZEU4ZtA_lJurXHGSHKxloF3UOdC1o8xSTUjXbYzSHU')" }}
        />
      </div>

      <main className="relative z-20 min-h-screen flex flex-col items-center justify-center py-20 px-4 md:px-margin-desktop">
        {/* Massive Headline */}
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-container-max w-full text-center mb-16 transform -rotate-1"
        >
          <h1 className="font-display-lg text-display-lg uppercase tracking-tighter text-on-surface leading-none mb-4">
            {titleText}
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-1 bg-on-surface flex-grow"></div>
            <p className="font-label-lg text-label-lg uppercase tracking-widest px-4 border-2 border-on-surface">EXTRA: FINAL EDITION</p>
            <div className="h-1 bg-on-surface flex-grow"></div>
          </div>
          <p className="font-body-lg text-body-lg italic text-outline mt-4">{subText}</p>
        </motion.div>

        {/* The Dossier Card */}
        <motion.div 
          initial={{ opacity: 0, y: 50, rotate: 0 }}
          animate={{ opacity: 1, y: 0, rotate: 1 }}
          transition={{ duration: 1, delay: 0.3, type: 'spring' }}
          className="max-w-4xl w-full bg-[#e8e2d2] text-[#1c1b1b] p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative border-2 border-outline-variant torn-edge pb-20 mb-12"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/parchment.png')" }}
        >
          {/* Folder Header */}
          <div className="flex justify-between items-start mb-8 border-b-2 border-on-primary-fixed-variant pb-6">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-primary-fixed uppercase tracking-tight leading-none mb-1">PLAYER_DOSSIER</h2>
              <p className="font-label-sm text-label-sm text-on-primary-fixed-variant opacity-70">CASE NO. {new Date().getFullYear()}-{Math.floor(Math.random()*1000)}-B | CONFIDENTIAL</p>
            </div>
            <div className="text-right">
              <p className="font-label-sm text-label-sm text-on-primary-fixed font-bold uppercase">FILE STATUS</p>
              <div className={`stamp text-xl font-bold inline-block border-[4px] px-3 py-1 uppercase mix-blend-multiply opacity-80 ${winner === 'mafia' ? 'border-[#93000a] text-[#93000a]' : 'border-[#4a473b] text-[#4a473b]'}`} style={{ transform: 'rotate(-15deg)' }}>
                CASE CLOSED
              </div>
            </div>
          </div>

          {/* Roles Table */}
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 font-label-lg text-label-lg text-on-primary-fixed uppercase border-b border-on-primary-fixed-variant pb-2">
              <div className="col-span-1 hidden md:block">#</div>
              <div className="col-span-6 md:col-span-4">AGENT IDENTIFICATION</div>
              <div className="col-span-6 md:col-span-4">ASSIGNED ROLE</div>
              <div className="col-span-12 md:col-span-3 text-right hidden md:block">FATE</div>
            </div>

            {(revealedRoles || []).map((player, idx) => (
              <div key={player.playerName}>
                <div className="grid grid-cols-12 gap-4 items-center font-body-md text-on-primary-fixed py-2">
                  <div className="col-span-1 opacity-50 hidden md:block">{(idx + 1).toString().padStart(2, '0')}</div>
                  <div className="col-span-6 md:col-span-4 font-bold uppercase">{player.playerName}</div>
                  <div className="col-span-6 md:col-span-4 italic">
                    {player.roleName} ({player.team})
                  </div>
                  <div className="col-span-12 md:col-span-3 md:text-right mt-2 md:mt-0 flex md:justify-end">
                    <motion.span 
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 0.8 }}
                      transition={{ delay: 1.2 + (idx * 0.15), type: 'spring' }}
                      className={`inline-block border-[4px] px-2 py-0 text-sm font-bold uppercase mix-blend-multiply origin-right ${player.isAlive ? 'border-[#4a473b] text-[#4a473b]' : 'border-[#93000a] text-[#93000a]'}`} 
                      style={{ transform: 'rotate(-15deg)' }}
                    >
                      {player.isAlive ? 'SURVIVED' : 'DECEASED'}
                    </motion.span>
                  </div>
                </div>
                {idx < revealedRoles.length - 1 && (
                  <div className="w-full h-px border-b border-dashed border-[#444748] my-2"></div>
                )}
              </div>
            ))}
          </div>

          {/* Dossier Footer Decoration */}
          <div className="absolute -bottom-6 -right-6 w-32 h-32 rotate-12 pointer-events-none filter contrast-150 brightness-50 mix-blend-multiply">
            <div className="w-full h-full rounded-full bg-black opacity-20 blur-xl"></div>
          </div>

          <div className="mt-12 flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-1 w-full md:w-auto">
              <p className="font-label-sm text-label-sm text-on-primary-fixed opacity-60">AUTHORIZED BY:</p>
              <p className="font-headline-md text-headline-md text-on-primary-fixed italic font-['Libre_Caslon_Text']">Agent_{myAgentId}</p>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto justify-end">
              {isHost ? (
                <button 
                  onClick={handlePlayAgain}
                  className="bg-primary text-on-primary px-8 py-3 font-label-lg text-label-lg uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all active:scale-95"
                >
                  REOPEN_FILE
                </button>
              ) : (
                <p className="font-label-sm italic opacity-60">WAITING FOR HOST TO REOPEN FILE...</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Secondary Assets Scatter */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 1 }}
          className="flex flex-wrap justify-center gap-8 max-w-container-max w-full mt-8 pointer-events-none hidden md:flex"
        >
          <div className="w-48 h-64 bg-[#e8e2d2] p-4 shadow-lg border border-outline-variant -rotate-6 flex flex-col" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/parchment.png')" }}>
            <div className="bg-black/10 w-full h-32 mb-2 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAMtPMW6UeF2j5RYvW3Iztn1UBmPk9jfa3yJpkOi_9CM-LX9h9ueKISEIgPgxD5Ro-C-oxtpv9zYV2KxOIEUJG2DyoQ9ZbVJTP-Z0eU6RCWtm1rhzU50grgHlBJOvA_QyM-pMHQpDtjOERDiBJ3GPrS8UlRkEIUpoUXZeoW2iT3wwtHgekQj0Je9grva5qmzUtw8DiLo60eKsdpN7IYQM9P0JnQqIx1V7A9lROQK7jIA3sTnej4Ja0jAe1cCGD8xf4k5mPYCZJY1NY')" }}></div>
            <p className="font-label-sm text-label-sm text-on-primary-fixed-variant leading-tight">EVIDENCE ITEM #42: {faction} DOMINANCE CONFIRMED. 02:14 AM.</p>
          </div>
          <div className="w-48 h-64 bg-[#e8e2d2] p-4 shadow-lg border border-outline-variant rotate-3 flex flex-col" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/parchment.png')" }}>
            <div className="w-full h-px border-b border-dashed border-[#444748] my-2"></div>
            <div className="w-full h-px border-b border-dashed border-[#444748] my-2"></div>
            <div className="w-full h-px border-b border-dashed border-[#444748] my-2"></div>
            <p className="font-body-md text-[#1c1b1b] mt-2 text-sm">"The city don't sleep for no one. Especially not for those who seek the truth."</p>
            <div className="mt-auto flex justify-center">
              <span className="material-symbols-outlined text-4xl text-on-primary-fixed-variant opacity-30">fingerprint</span>
            </div>
          </div>
        </motion.div>
      </main>
    </Layout>
  );
}
