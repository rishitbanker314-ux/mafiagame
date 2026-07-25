/**
 * Detective — A village-aligned role that investigates a player at night to learn their team.
 *
 * team:     'village'
 * priority: 10 // Resolves before Mafia kills and Doctor protects
 * nightAction: pushes an 'investigate' action to the queue.
 */
const Role = require('./Role');

class Detective extends Role {
  constructor() {
    super('Detective', { team: 'village', priority: 10 });
    this.inspectedPlayers = new Set();
  }

  nightAction(sourceId, targetId, state) {
    if (!targetId) return null;
    
    // Remember that we inspected this target
    this.inspectedPlayers.add(targetId);

    state.actionQueue.push({
      type: 'investigate',
      sourceId,
      targetId,
      priority: this.priority,
      execute(s) {
        const target = s.players[targetId];
        const team = target.role ? target.role.team : 'neutral';
        return { type: 'investigate', targetId, team };
      },
    });
    return { type: 'investigate', sourceId, targetId };
  }

  canActAtNight() {
    return true;
  }

  getBotNightTarget(botId, state) {
    // Detective inspects a random alive player they haven't inspected yet
    const validTargets = Object.values(state.players).filter(
      p => p.isAlive && p.id !== botId && !this.inspectedPlayers.has(p.id)
    );
    if (validTargets.length === 0) {
      // If all alive players inspected, inspect a random alive player
      const fallback = Object.values(state.players).filter(p => p.isAlive && p.id !== botId);
      if (fallback.length === 0) return null;
      return fallback[Math.floor(Math.random() * fallback.length)].id;
    }
    const target = validTargets[Math.floor(Math.random() * validTargets.length)];
    return target.id;
  }
}

module.exports = Detective;
