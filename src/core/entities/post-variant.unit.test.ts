import assert from 'node:assert';
import { test } from 'node:test';
import { is } from 'valibot';
import { getPostTypeFromContent } from './post.ts';
import { PostVariant } from './post-variant.ts';
import { getTargetStoreDirFromPostType, STORE_SHOTS_DIR } from './store.ts';

const seriesContent = ['store:/inbox/a.png', 'store:/inbox/b.png', 'store:/inbox/c.png'];

test('Series', async (t) => {
  await t.test('should require exactly 3 lossless images', () => {
    assert.strictEqual(is(PostVariant, { type: 'series', aspect: '1/1', content: seriesContent }), true);
    assert.strictEqual(is(PostVariant, { type: 'series', aspect: '1/1', content: seriesContent.slice(0, 2) }), false);
    assert.strictEqual(is(PostVariant, { type: 'series', aspect: '1/1', content: [...seriesContent, 'd.png'] }), false);
  });

  await t.test('should be recognized from 3 previously unpublished images', () => {
    assert.strictEqual(getPostTypeFromContent(seriesContent), 'series');
  });

  await t.test('should have shots storage directory', () => {
    assert.strictEqual(getTargetStoreDirFromPostType('series'), STORE_SHOTS_DIR);
  });
});
