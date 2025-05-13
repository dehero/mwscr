import assert from 'node:assert';
import test from 'node:test';
import { Readable } from 'stream';
import { SiteStoreManager } from './site-store-manager.js';
import { YandexDiskManager } from './yandex-disk-manager.js';

const testFile = 'shots/test-store-manager.png';

const classes = [SiteStoreManager, YandexDiskManager];

for (const StoreManager of classes) {
  test(StoreManager.name, async (t) => {
    await t.test('copy', async () => {
      const manager = new StoreManager();
      await manager.put(testFile, Buffer.from('test'));
      await manager.copy(testFile, 'shots/copy-test.png');

      try {
        const data = await manager.get('shots/copy-test.png');
        assert.notEqual(data, undefined);
      } finally {
        await manager.remove('shots/copy-test.png');
        await manager.remove(testFile);
      }
    });

    await t.test('exists', async () => {
      const manager = new StoreManager();
      assert.ok(!(await manager.exists('shots/not-existing-file.png')));
      await manager.put(testFile, Buffer.from('test'));
      assert.ok(await manager.exists(testFile));
      await manager.remove(testFile);
    });

    await t.test('get', async () => {
      const manager = new StoreManager();
      await manager.put(testFile, Buffer.from('test'));
      const data = await manager.get(testFile);
      assert.notEqual(data, undefined);
      await manager.remove(testFile);
    });

    await t.test('getStream', async () => {
      const manager = new StoreManager();
      await manager.put(testFile, Buffer.from('test'));
      const stream = await manager.getStream(testFile);
      assert.notEqual(stream, undefined);
      await manager.remove(testFile);
    });

    await t.test('move', async () => {
      const manager = new StoreManager();
      await manager.put(testFile, Buffer.from('test'));
      await manager.move(testFile, 'shots/move-test.png');

      try {
        const data = await manager.get('shots/move-test.png');
        assert.notEqual(data, undefined);
      } finally {
        await manager.remove('shots/move-test.png');
      }
    });

    await t.test('put', async () => {
      const manager = new StoreManager();
      await manager.put(testFile, Buffer.from('test'));

      try {
        const data = await manager.get(testFile);
        assert.notEqual(data, undefined);
      } finally {
        await manager.remove(testFile);
      }
    });

    await t.test('putStream', async () => {
      const manager = new StoreManager();
      const stream = Readable.from([Buffer.from('test')]);
      await manager.putStream(testFile, stream);

      try {
        const data = await manager.get(testFile);
        assert.notEqual(data, undefined);
      } finally {
        await manager.remove(testFile);
      }
    });

    await t.test('readdir', async () => {
      const manager = new StoreManager();
      await manager.put(testFile, Buffer.from('test'));
      const list = await manager.readdir('shots');

      assert.notEqual(list.length, 0);
      await manager.remove(testFile);
    });

    await t.test('remove', async () => {
      const manager = new StoreManager();
      await manager.put(testFile, Buffer.from('test'));
      await manager.remove(testFile);

      try {
        await manager.get(testFile);
        assert.fail('File should be removed');
      } catch {
        // file is removed
      }
    });
  });
}
