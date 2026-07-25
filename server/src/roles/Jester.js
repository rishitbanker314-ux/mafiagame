const Role = require('./Role');

class Jester extends Role {
  constructor() {
    // 10 is low priority, team is neutral
    super('Jester', 10, 'neutral');
  }

  canActAtNight() {
    return false; // Jester has no night action
  }

  nightAction(sourceId, targetId, state) {
    return null;
  }

  onVotedOut(state) {
    // If voted out, the Jester wins!
    state.winner = 'jester';
  }
}

module.exports = Jester;
