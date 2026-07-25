const Role = require('../../src/roles/Role');

// Concrete test subclass to verify the base class contract
class TestRole extends Role {
  constructor() {
    super('TestRole', { team: 'town', priority: 10 });
  }
}

// Subclass that overrides nightAction
class ActiveRole extends Role {
  constructor() {
    super('ActiveRole', { priority: 5 });
  }

  nightAction(sourceId, targetId, state) {
    return { action: 'tested', sourceId, targetId };
  }
}

describe('Role (base class)', () => {
  it('cannot be instantiated directly', () => {
    expect(() => new Role('Direct')).toThrow(
      'Role is abstract and cannot be instantiated directly.'
    );
  });

  it('requires a non-empty string name', () => {
    class BadRole extends Role {
      constructor() {
        super('', { priority: 1 });
      }
    }
    expect(() => new BadRole()).toThrow('Role name must be a non-empty string.');
  });

  it('requires an integer priority', () => {
    class BadRole extends Role {
      constructor() {
        super('Bad', { priority: 1.5 });
      }
    }
    expect(() => new BadRole()).toThrow('Role priority must be an integer.');
  });

  it('defaults team to neutral and priority to 50', () => {
    class DefaultRole extends Role {
      constructor() {
        super('DefaultRole');
      }
    }
    const role = new DefaultRole();
    expect(role.team).toBe('neutral');
    expect(role.priority).toBe(50);
  });

  it('can be extended with custom team and priority', () => {
    const role = new TestRole();
    expect(role.name).toBe('TestRole');
    expect(role.team).toBe('town');
    expect(role.priority).toBe(10);
  });

  it('base nightAction returns null (no-op)', () => {
    const role = new TestRole();
    const result = role.nightAction('p1', 'p2', {});
    expect(result).toBeNull();
  });

  it('subclass can override nightAction', () => {
    const role = new ActiveRole();
    const result = role.nightAction('p1', 'p2', {});
    expect(result).toEqual({ action: 'tested', sourceId: 'p1', targetId: 'p2' });
  });
});
