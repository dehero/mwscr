import assert from 'node:assert';
import { test } from 'node:test';
import { is } from 'valibot';
import { ImageResourceUrl, VideoResourceUrl } from './resource.js';

test('ImageResourceUrl', async (t) => {
  await t.test('should be valid if ends with image extension', () => {
    assert.ok(is(ImageResourceUrl, 'https://example.com/image.png'));
  });

  await t.test('should fail if not ends with image extension', () => {
    assert.ok(!is(ImageResourceUrl, 'https://example.com/image.txt'));
  });
});

test('VideoResourceUrl', async (t) => {
  await t.test('should be valid if ends with video extension', () => {
    assert.ok(is(VideoResourceUrl, 'https://example.com/video.mp4'));
  });

  await t.test('should fail if not ends with video extension', () => {
    assert.ok(!is(VideoResourceUrl, 'https://example.com/video.txt'));
  });
});
