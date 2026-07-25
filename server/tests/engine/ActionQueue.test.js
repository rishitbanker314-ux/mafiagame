const ActionQueue = require('../../src/engine/ActionQueue');

// Minimal role stubs — follow the new Role interface (name, team, priority, nightAction)
const makeRole = (name, priority, actionFn) => ({
  name,
  team: 'neutral',
  priority,
  nightAction: actionFn || ((sourceId, targetId, state) => ({ action: name, targetId })),
});

describe('ActionQueue', () => {
  let queue;

  beforeEach(() => {
    queue = new ActionQueue();
  });

  it('starts empty', () => {
    expect(queue.length).toBe(0);
  });

  it('rejects actions without a role', () => {
    expect(() => queue.push({ playerId: 'p1', targetId: 'p2' })).toThrow();
  });

  it('rejects actions with a non-numeric priority', () => {
    expect(() =>
      queue.push({
        playerId: 'p1',
        role: { name: 'Bad', priority: 'high' },
        targetId: 'p2',
      })
    ).toThrow();
  });

  it('queues actions and reports length', () => {
    queue.push({ playerId: 'p1', role: makeRole('A', 1), targetId: 'p2' });
    queue.push({ playerId: 'p3', role: makeRole('B', 2), targetId: 'p4' });
    expect(queue.length).toBe(2);
  });

  it('resolves actions sorted by priority (ascending)', () => {
    queue.push({ playerId: 'p1', role: makeRole('Mafia', 3), targetId: 'p2' });
    queue.push({ playerId: 'p3', role: makeRole('Detective', 1), targetId: 'p4' });
    queue.push({ playerId: 'p5', role: makeRole('Doctor', 2), targetId: 'p6' });

    const results = queue.resolve({});

    expect(results[0].role).toBe('Detective');
    expect(results[1].role).toBe('Doctor');
    expect(results[2].role).toBe('Mafia');
  });

  it('preserves insertion order for equal priorities (stable sort)', () => {
    queue.push({ playerId: 'p1', role: makeRole('First', 1), targetId: 'p2' });
    queue.push({ playerId: 'p3', role: makeRole('Second', 1), targetId: 'p4' });

    const results = queue.resolve({});

    expect(results[0].role).toBe('First');
    expect(results[1].role).toBe('Second');
  });

  it('clears the queue after resolution', () => {
    queue.push({ playerId: 'p1', role: makeRole('A', 1), targetId: 'p2' });
    queue.resolve({});
    expect(queue.length).toBe(0);
  });

  it('clear() empties the queue without resolving', () => {
    queue.push({ playerId: 'p1', role: makeRole('A', 1), targetId: 'p2' });
    queue.clear();
    expect(queue.length).toBe(0);
  });

  it('calls nightAction with gameState and targetId', () => {
    const mockAction = jest.fn(() => ({ healed: true }));
    const role = makeRole('Doctor', 2, mockAction);
    const gameState = { players: {} };

    queue.push({ playerId: 'p1', role, targetId: 'p2' });
    queue.resolve(gameState);

    expect(mockAction).toHaveBeenCalledWith(gameState, 'p2');
  });
});
