import assert from 'node:assert';
import { after, test } from 'node:test';
import { copyResource, moveResource, removeResource } from './resources.js';

test('copyResource', async (t) => {
  await t.test('copy external resource to inbox', async () => {
    after(() => removeResource('store:/inbox/external-resource-copy-test.png'));

    await assert.doesNotReject(
      copyResource(
        'https://raw.githubusercontent.com/dehero/mwscr/refs/heads/main/assets/icon.png',
        'store:/inbox/external-resource-copy-test.png',
      ),
    );
  });
});

test('moveResource', async (t) => {
  await t.test('move file from inbox to shots', async () => {
    after(() => removeResource('store:/shots/move-resource-test.png'));

    await copyResource('store:/shots/2016-11-20-1-dren-plantation.png', 'store:/inbox/move-resource-test.png');

    await assert.doesNotReject(
      moveResource('store:/inbox/move-resource-test.png', 'store:/shots/move-resource-test.png'),
    );
  });
});
