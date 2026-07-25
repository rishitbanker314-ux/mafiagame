import { useState } from 'react';
import type { Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
  isAlive: boolean;
}

interface RoleInfo {
  roleName: string;
  team: string;
}

interface NightViewProps {
  socket: Socket;
  myRole: RoleInfo;
  players: Player[];
  mySocketId: string;
}

const ROLE_EMOJIS: Record<string, string> = {
  Doctor: '🩺',
  Vigilante: '🔫',
  Villager: '🏘️',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  Doctor: 'Choose a player to protect tonight',
  Vigilante: 'Choose a player to eliminate',
  Villager: 'You have no night action — sleep tight',
};

export default function NightView({
  socket,
  myRole,
  players,
  mySocketId,
}: NightViewProps) {
  const [submitted, setSubmitted] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const emoji = ROLE_EMOJIS[myRole.roleName] || '❓';
  const description =
    ROLE_DESCRIPTIONS[myRole.roleName] || 'Awaiting orders...';

  // Other alive players (exclude self)
  const targets = players.filter(
    (p) => p.id !== mySocketId && p.isAlive
  );

  // Villager has no night action
  const hasNightAction = myRole.roleName !== 'Villager';

  function handleTarget(targetId: string) {
    if (submitted) return;

    setSelectedTarget(targetId);
    setSubmitted(true);

    socket.emit(
      'submit_action',
      { targetId },
      (res: { success: boolean; error?: string }) => {
        if (!res.success) {
          console.error('submit_action failed:', res.error);
          // Allow retry on error
          setSubmitted(false);
          setSelectedTarget(null);
        }
      }
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card glow-border w-full max-w-sm p-8 animate-fade-in">
        {/* Night header */}
        <div className="text-center mb-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            🌙 Night Phase
          </p>
        </div>

        {/* Role display */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{emoji}</div>
          <h2 className="text-3xl font-bold text-white mb-1">
            {myRole.roleName}
          </h2>
          <p className="text-sm text-slate-400">{description}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/5 mb-6" />

        {/* Target list or waiting message */}
        {!hasNightAction ? (
          <div className="text-center py-8">
            <p className="text-slate-400 animate-pulse-slow">
              😴 The village sleeps...
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Waiting for night to end
            </p>
          </div>
        ) : submitted ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-3">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-slow" />
              <span className="text-sm text-purple-300 font-medium">
                Action submitted
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Waiting for other players...
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              Choose Target
            </p>
            <div className="space-y-2 stagger-children">
              {targets.map((player) => (
                <button
                  key={player.id}
                  className="btn-target"
                  onClick={() => handleTarget(player.id)}
                  disabled={submitted}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{player.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
