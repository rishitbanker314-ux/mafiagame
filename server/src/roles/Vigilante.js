/**
 * Vigilante — A village-aligned role that can kill one target at night.
 *
 * team:     'village'
 * priority: 30
 * bullets:  1 (starts with a single use)
 * nightAction: if bullets > 0, decrements bullets and pushes a 'kill'
 *              action to the queue. When resolved, kills the target
 *              unless they are protected.
 */
const Role = require('./Role');

class Vigilante extends Role {
  constructor() {
    super('Vigilante', { team: 'village', priority: 30 });
    this.bullets = 1;
  }

  /**
   * Push a kill action onto the game's action queue if bullets remain.
   * The action's execute() closure checks isProtected before killing,
   * keeping all kill logic inside this role — not in the engine.
   */
  nightAction(sourceId, targetId, state) {
    if (this.bullets > 0) {
      this.bullets--;
      state.actionQueue.push({
        type: 'kill',
        sourceId,
        targetId,
        priority: this.priority,
        execute(s) {
          if (!s.players[targetId].isProtected) {
            s.players[targetId].isAlive = false;
          }
          return {
            type: 'kill',
            targetId,
            blocked: s.players[targetId].isProtected,
          };
        },
      });
      return { type: 'kill', sourceId, targetId };
    }
    return null;
  }

  canActAtNight() {
    return this.bullets > 0;
  }

  getBotNightTarget(botId, state) {
    // Vigilante randomly shoots a player (except themselves). Maybe they only shoot sometimes?
    // Let's give them a 50% chance to shoot each night they have bullets
    if (Math.random() < 0.5) return null;
    const validTargets = Object.values(state.players).filter(p => p.isAlive && p.id !== botId);
    if (validTargets.length === 0) return null;
    const target = validTargets[Math.floor(Math.random() * validTargets.length)];
    return target.id;
  }
}

module.exports = Vigilante;
