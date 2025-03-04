import assert from 'node:assert';
import test from 'node:test';
import type { User } from './user.js';
import { UsersManager } from './users-manager.js';

class TestUsersManager extends UsersManager {
  public async createItemId(item: User) {
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

  await t.test('should generate ID based on user name', async () => {
    const user: User = {
      name: 'John Doe',
      profiles: {},
    };
    const id = await manager.createItemId(user);
    assert.strictEqual(id, 'john-doe');
  });

  await t.test('should generate ID based on first profile name', async () => {
    const user: User = {
      name: '         ',
      profiles: {
        ig: 'john_doe',
      },
    };
    const id = await manager.createItemId(user);
    assert.strictEqual(id, 'john-doe');
  });

  await t.test('should generate ID based on first profile name (when multiple)', async () => {
    const user: User = {
      name: '',
      profiles: {
        ig: 'john_doe',
        tg: 'john_doe2',
      },
    };
    const id = await manager.createItemId(user);
    assert.strictEqual(id, 'john-doe');
  });

  await t.test('should generate ID with index for existing item', async () => {
    const user: User = {
      name: 'John Doe',
      profiles: {},
    };
    await manager.addItem(user);
    const id = await manager.createItemId(user);
    assert.strictEqual(id, 'john-doe-2');
  });
});
