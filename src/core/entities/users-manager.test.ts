import assert from 'node:assert';
import test from 'node:test';
import type { User } from './user.js';
import { UsersManager } from './users-manager.js';

class TestUsersManager extends UsersManager {
  public createItemId(item: User) {
    return super.createItemId(item);
  }

  public async removeChunkData(_chunkName: string) {}

  public async saveChunkData(_chunkName: string) {}

  public async loadChunkData(_chunkName: string) {
    return {};
  }
}

test('UsersManager.createItemId', async (t) => {
  const manager = new TestUsersManager();

  await t.test('should generate ID based on user name', () => {
    const user: User = {
      name: 'John Doe',
      profiles: {},
    };
    const id = manager.createItemId(user);
    assert.strictEqual(id, 'john-doe');
  });

  await t.test('should generate ID based on first profile name', () => {
    const user: User = {
      name: '         ',
      profiles: {
        ig: 'john_doe',
      },
    };
    const id = manager.createItemId(user);
    assert.strictEqual(id, 'john-doe');
  });

  await t.test('should generate ID based on first profile name (when multiple)', () => {
    const user: User = {
      name: '',
      profiles: {
        ig: 'john_doe',
        tg: 'john_doe2',
      },
    };
    const id = manager.createItemId(user);
    assert.strictEqual(id, 'john-doe');
  });
});
