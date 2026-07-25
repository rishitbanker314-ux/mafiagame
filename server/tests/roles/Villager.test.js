const Villager = require('../../src/roles/Villager');
const { createGameState, addPlayer } = require('../../src/engine/GameState');

describe('Villager', () => {
  it('has correct name, team, and priority', () => {
    const villager = new Villager();
    expect(villager.name).toBe('Villager');
    expect(villager.team).toBe('village');
    expect(villager.priority).toBe(50);
  });

  it('nightAction returns null (no-op)', () => {
    const villager = new Villager();
    const state = createGameState('test');
    addPlayer(state, 'v1', 'Alice');

    const result = villager.nightAction('v1', 'v1', state);

    expect(result).toBeNull();
    expect(state.actionQueue).toHaveLength(0);
  });
});
