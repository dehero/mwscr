import assert from 'assert';
import { test } from 'node:test';
import type { Comment } from '../../../core/entities/comment.ts';
import type { CommentInfo } from '../../../core/entities/comment-info.ts';
import { createCommentThreads } from './comment-threads.ts';

const comment = (text: string, datetime: string, author = 'author'): Comment => ({
  text,
  datetime: new Date(datetime),
  author,
});

const info = (text: string, datetime: string, parent?: Comment, author = 'author'): CommentInfo => ({
  text,
  datetime: new Date(datetime),
  author,
  parent,
  service: 'telegram',
  path: 'posts/post',
});

test('createCommentThreads', async (t) => {
  await t.test('should collapse consecutive replies to the same parent', () => {
    const parent = comment('parent', '2024-01-01T00:00:00Z');
    const first = info('first reply', '2024-01-03T00:00:00Z', parent);
    const second = info('second reply', '2024-01-02T00:00:00Z', parent);
    const standalone = info('standalone', '2024-01-04T00:00:00Z');

    const threads = createCommentThreads([first, second, standalone]);

    assert.strictEqual(threads.length, 2);
    assert.deepStrictEqual(threads[0], { parent, commentInfos: [first, second] });
    assert.deepStrictEqual(threads[1], { commentInfos: [standalone] });
  });

  await t.test('should collapse a standalone comment followed by a reply to it', () => {
    const parent = info('parent', '2024-01-01T00:00:00Z');
    const reply = info('reply', '2024-01-02T00:00:00Z', parent);

    const threads = createCommentThreads([parent, reply]);

    assert.strictEqual(threads.length, 1);
    assert.strictEqual(threads[0]!.parentInfo, parent);
    assert.deepStrictEqual(threads[0]!.commentInfos, [reply]);
  });

  await t.test('should collapse replies followed by their parent comment', () => {
    const parent = info('parent', '2024-01-01T00:00:00Z');
    const reply = info('reply', '2024-01-02T00:00:00Z', parent);

    const threads = createCommentThreads([reply, parent]);

    assert.strictEqual(threads.length, 1);
    assert.strictEqual(threads[0]!.parentInfo, parent);
    assert.deepStrictEqual(threads[0]!.commentInfos, [reply]);
  });

  await t.test('should not collapse replies to the same parent separated by another comment', () => {
    const parent = comment('parent', '2024-01-01T00:00:00Z');
    const first = info('first reply', '2024-01-03T00:00:00Z', parent);
    const other = info('other post comment', '2024-01-02T12:00:00Z');
    const second = info('second reply', '2024-01-02T00:00:00Z', parent);

    const threads = createCommentThreads([first, other, second]);

    assert.strictEqual(threads.length, 3);
    assert.deepStrictEqual(threads[0], { parent, commentInfos: [first] });
    assert.deepStrictEqual(threads[1], { commentInfos: [other] });
    assert.deepStrictEqual(threads[2], { parent, commentInfos: [second] });
  });

  await t.test('should keep consecutive standalone comments separate', () => {
    const first = info('first', '2024-01-02T00:00:00Z');
    const second = info('second', '2024-01-01T00:00:00Z');

    const threads = createCommentThreads([first, second]);

    assert.strictEqual(threads.length, 2);
    assert.deepStrictEqual(threads[0], { commentInfos: [first] });
    assert.deepStrictEqual(threads[1], { commentInfos: [second] });
  });

  await t.test('should return an empty list for empty input', () => {
    assert.deepStrictEqual(createCommentThreads([]), []);
  });
});
