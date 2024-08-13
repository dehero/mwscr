import assert from 'node:assert';
import { test } from 'node:test';
import { aspectRatioFromSize, checkMediaAspectRatio, getAspectRatioHeightMultiplier } from './media.js';

test('aspectRatioFromSize', async (t) => {
  await t.test('should correctly calculate aspect ratio', () => {
    assert.strictEqual(aspectRatioFromSize(16, 9), '16/9');
    assert.strictEqual(aspectRatioFromSize(4, 3), '4/3');
    assert.strictEqual(aspectRatioFromSize(1, 1), '1/1');
  });
});

test('checkMediaAspectRatio', async (t) => {
  await t.test('should return false if metadata is undefined', () => {
    assert.strictEqual(checkMediaAspectRatio('16/9', {}), false);
  });

  await t.test('should return true if aspect ratios match', () => {
    assert.strictEqual(checkMediaAspectRatio('16/9', { width: 1920, height: 1080 }), true);
    assert.strictEqual(checkMediaAspectRatio('4/3', { width: 1280, height: 960 }), true);
    assert.strictEqual(checkMediaAspectRatio('1/1', { width: 1, height: 1 }), true);
  });

  await t.test('should return false if aspect ratios do not match', () => {
    assert.strictEqual(checkMediaAspectRatio('16/9', { width: 1280, height: 1024 }), false);
    assert.strictEqual(checkMediaAspectRatio('4/3', { width: 1920, height: 1080 }), false);
    assert.strictEqual(checkMediaAspectRatio('1/1', { width: 16, height: 9 }), false);
  });
});

test('getAspectRatioHeightMultiplier', async (t) => {
  await t.test('should correctly calculate height multiplier', () => {
    assert.strictEqual(getAspectRatioHeightMultiplier('16/9'), 0.5625);
    assert.strictEqual(getAspectRatioHeightMultiplier('4/3'), 0.75);
    assert.strictEqual(getAspectRatioHeightMultiplier('1/1'), 1);
    assert.strictEqual(getAspectRatioHeightMultiplier('9/19.5'), 19.5 / 9);
  });
});
