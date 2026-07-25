const Role = require('./Role');

class Mafia extends Role {
  constructor() {
    super('Mafia', { team: 'mafia', priority: 40 });
  }

  canActAtNight() {
    return true;
  }

  nightAction(sourceId, targetId, state) {
    if (!targetId) return;
    
    state.actionQueue.push({
      priority: this.priority,
      type: 'kill',
      sourceId,
      targetId,
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
}

module.exports = Mafia;
