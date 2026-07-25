import type { Socket } from 'socket.io-client';
import type { RevealedRole } from '../App';

interface GameOverViewProps {
  socket: Socket;
  winner: string | null;
  revealedRoles: RevealedRole[];
  isHost: boolean;
}

export default function GameOverView({ socket, winner, revealedRoles, isHost }: GameOverViewProps) {
  function handlePlayAgain() {
    socket.emit('reset_game');
  }

  // Determine header text and styles based on winner
  let headerText = 'Game Over';
  let headerColor = 'text-white';
  
  if (winner === 'village') {
    headerText = 'The Village Survived!';
    headerColor = 'text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]';
  } else if (winner === 'mafia') {
    headerText = 'The Mafia Took Over!';
    headerColor = 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]';
  } else if (winner) {
    headerText = `${winner.charAt(0).toUpperCase() + winner.slice(1)} Wins!`;
    headerColor = 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]';
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="glass-card glow-border max-w-2xl w-full p-8 text-center animate-fade-in-up">
        
        {/* Massive Header */}
        <h1 className={`text-4xl md:text-6xl font-black uppercase tracking-widest mb-8 ${headerColor} animate-float`}>
          {headerText}
        </h1>

        {/* Role Reveal List */}
        <div className="bg-surface-800/80 rounded-xl border border-white/10 overflow-hidden mb-8 text-left">
          <div className="p-4 border-b border-white/5 bg-surface-900/50">
            <h2 className="text-lg font-bold text-slate-200">Role Reveal</h2>
          </div>
          
          <div className="divide-y divide-white/5 max-h-[40vh] overflow-y-auto">
            {revealedRoles.map((player) => (
              <div 
                key={player.playerName} 
                className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {player.isAlive ? '🟢' : '💀'}
                  </span>
                  <span className={`font-semibold ${player.isAlive ? 'text-white' : 'text-slate-500 line-through'}`}>
                    {player.playerName}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wider ${
                    player.team === 'mafia' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : player.team === 'village'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {player.team}
                  </span>
                  <span className="text-slate-300 font-medium">
                    {player.roleName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Play Again Button (Host Only) */}
        {isHost ? (
          <button
            onClick={handlePlayAgain}
            className="w-full md:w-auto px-8 py-4 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold tracking-wider uppercase transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]"
          >
            Play Again
          </button>
        ) : (
          <p className="text-slate-400 animate-pulse-slow">
            Waiting for host to restart the game...
          </p>
        )}
      </div>
    </div>
  );
}
