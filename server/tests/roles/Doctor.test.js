const Doctor = require('../../src/roles/Doctor');
const { createGameState, addPlayer } = require('../../src/engine/GameState');

describe('Doctor', () => {
  let state;

  beforeEach(() => {
    state = createGameState('test');
    addPlayer(state, 'doc', 'Dr. House');
    addPlayer(state, 'target', 'Alice');
  });

  it('has correct name, team, and priority', () => {
    const doctor = new Doctor();
    expect(doctor.name).toBe('Doctor');
    expect(doctor.team).toBe('village');
    expect(doctor.priority).toBe(20);
  });

  it('nightAction pushes a protect action to the queue', () => {
    const doctor = new Doctor();

    doctor.nightAction('doc', 'target', state);

    expect(state.actionQueue).toHaveLength(1);
    expect(state.actionQueue[0].type).toBe('protect');
    expect(state.actionQueue[0].sourceId).toBe('doc');
    expect(state.actionQueue[0].targetId).toBe('target');
    expect(state.actionQueue[0].priority).toBe(20);
    expect(typeof state.actionQueue[0].execute).toBe('function');
  });

  it('protect execute sets isProtected on target', () => {
    const doctor = new Doctor();

    doctor.nightAction('doc', 'target', state);
    state.actionQueue[0].execute(state);

    expect(state.players['target'].isProtected).toBe(true);
  });

  it('returns action summary from nightAction', () => {
    const doctor = new Doctor();

    const result = doctor.nightAction('doc', 'target', state);

    expect(result).toEqual({ type: 'protect', sourceId: 'doc', targetId: 'target' });
  });
});
