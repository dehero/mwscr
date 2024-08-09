import assert from 'node:assert';
import { test } from 'node:test';
import { storeIncludesPath } from './store.js';

test('storeIncludesPath', async (t) => {
  const paths = ['shots/2016-11-20.1.dren-plantation.png', 'drawings/2019-05-08.an-old-bridge.png'];

  await t.test('should return true if store.include is undefined', () => {
    const store = { include: undefined };

    const result = storeIncludesPath(...paths)(store);
    assert.strictEqual(result, true);
  });

  await t.test('should return true if all paths match the include pattern', () => {
    const store = { include: ['shots/*.png', 'drawings/*.png'] };

    const result = storeIncludesPath(...paths)(store);
    assert.strictEqual(result, true);
  });

  await t.test('should return false if any path does not match the include pattern', () => {
    const store = { include: ['inbox/*.*'] };

    const result = storeIncludesPath(...paths)(store);
    assert.strictEqual(result, false);
  });

  await t.test('should return false if store.include is defined and empty', () => {
    const store = { include: [] };

    const result = storeIncludesPath(...paths)(store);
    assert.strictEqual(result, false);
  });
});
