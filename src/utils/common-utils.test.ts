import assert from 'assert';
import { test } from 'node:test';
import { asArray, greatestCommonDivisor, listItems, textToId } from './common-utils.js';

test('asArray', async (t) => {
  await t.test('should return an empty array when the value is undefined', () => {
    const result = asArray(undefined);
    assert.deepStrictEqual(result, []);
  });

  await t.test('should return an array when the value is an array', () => {
    const result = asArray([1, 2, 3]);
    assert.deepStrictEqual(result, [1, 2, 3]);
  });

  await t.test('should return a single element array when the value is not an array', () => {
    const result = asArray(1);
    assert.deepStrictEqual(result, [1]);
  });
});

test('greatestCommonDivisor', async (t) => {
  await t.test('should return the input value when the second argument is zero', () => {
    assert.strictEqual(greatestCommonDivisor(1, 0), 1);
  });

  await test('should return the greatest common divisor of two numbers', () => {
    assert.strictEqual(greatestCommonDivisor(6, 12), 6);
    assert.strictEqual(greatestCommonDivisor(15, 30), 15);
    assert.strictEqual(greatestCommonDivisor(21, 63), 21);
  });
});

test('textToId', async (t) => {
  await t.test('should return a slugified version of the input text', () => {
    const inputText = '!!!test  --string @#$ With_random%20КонТент_';
    const expectedSlug = 'test-string-with-random-20-kon-tent';
    const result = textToId(inputText);

    assert.strictEqual(result, expectedSlug);
  });
});

test('listItems', async (t) => {
  await t.test('should return an empty string for an empty array', () => {
    const result = listItems([]);
    assert.strictEqual(result, '');
  });

  await t.test('should return two items separated by "or"', () => {
    const result = listItems(['foo', 'bar']);
    assert.strictEqual(result, 'foo or bar');
  });

  await t.test('should return a comma-separated list of items with last items separated by "or"', () => {
    const result = listItems(['foo', 'bar', 'baz']);
    assert.strictEqual(result, 'foo, bar or baz');
  });

  await t.test('should return a comma-separated list of items with quotes', () => {
    const result = listItems(['foo', 'bar', 'baz'], true);
    assert.strictEqual(result, '"foo", "bar" or "baz"');
  });
});
