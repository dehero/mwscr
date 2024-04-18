import assert from 'node:assert';
import { test } from 'node:test';
import { postTitleFromString } from './post-title.js';

test('postTitleFromString', async (t) => {
  await t.test('should turn a string into post title', () => {
    const input = ' the Title_with*  technical-separators , in|it@? ';
    const expected = 'The Title with Technical-Separators, in It?';
    const actual = postTitleFromString(input);

    assert.strictEqual(actual, expected);
  });
});
