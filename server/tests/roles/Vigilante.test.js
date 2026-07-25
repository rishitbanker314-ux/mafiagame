const Vigilante = require('../../src/roles/Vigilante');
const { createGameState, addPlayer } = require('../../src/engine/GameState');

describe('Vigilante', () => {
  let state;

  beforeEach(() => {
    state = createGameState('test');
    addPlayer(state, 'vig', 'The Vigilante');
    addPlayer(state, 'target', 'Alice');
  });

  it('has correct name, team, and priority', () => {
    const vig = new Vigilante();
    expect(vig.name).toBe('Vigilante');
    expect(vig.team).toBe('village');
    expect(vig.priority).toBe(30);
  });

  it('starts with 1 bullet', () => {
    const vig = new Vigilante();
    expect(vig.bullets).toBe(1);
  });

  it('nightAction pushes a kill action when bullets > 0', () => {
    const vig = new Vigilante();

    vig.nightAction('vig', 'target', state);

    expect(state.actionQueue).toHaveLength(1);
    expect(state.actionQueue[0].type).toBe('kill');
    expect(state.actionQueue[0].sourceId).toBe('vig');
    expect(state.actionQueue[0].targetId).toBe('target');
    expect(state.actionQueue[0].priority).toBe(30);
    expect(typeof state.actionQueue[0].execute).toBe('function');
  });

  it('decrements bullets after nightAction', () => {
    const vig = new Vigilante();

    vig.nightAction('vig', 'target', state);

    expect(vig.bullets).toBe(0);
  });

  it('nightAction returns null when no bullets remain', () => {
    const vig = new Vigilante();
    vig.bullets = 0;

    const result = vig.nightAction('vig', 'target', state);

    expect(result).toBeNull();
    expect(state.actionQueue).toHaveLength(0);
  });

  it('kill execute sets isAlive to false when target is not protected', () => {
    const vig = new Vigilante();

    vig.nightAction('vig', 'target', state);
    state.actionQueue[0].execute(state);

    expect(state.players['target'].isAlive).toBe(false);
  });

  it('kill execute does NOT kill when target is protected', () => {
    const vig = new Vigilante();
    state.players['target'].isProtected = true;

    vig.nightAction('vig', 'target', state);
    state.actionQueue[0].execute(state);

    expect(state.players['target'].isAlive).toBe(true);
  });
});
