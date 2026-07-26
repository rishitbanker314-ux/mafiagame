/**
 * Doctor — A village-aligned role that protects a target during the night.
 *
 * team:     'village'
 * priority: 20
 * nightAction: pushes a 'protect' action to the queue.
 *              When resolved, sets isProtected = true on the target.
 */
const Role = require('./Role');

class Doctor extends Role {
  constructor() {
    super('Doctor', { team: 'village', priority: 20 });
  }

  /**
   * Push a protect action onto the game's action queue.
   * The action's execute() closure sets isProtected on the target,
   * keeping all protect logic inside this role — not in the engine.
  nightAction(sourceId, targetId, state) {
    state.actionQueue.push({
      type: 'protect',
      sourceId,
      targetId,
      priority: this.priority,
      execute(s) {
        s.players[targetId].isProtected = true;
        return { type: 'protect', targetId };
      },
    });
    return { type: 'protect', sourceId, targetId };
  }

  canActAtNight() {
    return true;
  }

  getBotNightTarget(botId, state) {
    // Doctor can protect anyone, including themselves
    const alivePlayers = Object.values(state.players).filter(p => p.isAlive);
    if (alivePlayers.length === 0) return null;
    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    return target.id;
  }
}

module.exports = Doctor;
