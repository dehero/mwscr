import assert from 'node:assert';
import { test } from 'node:test';
import {
  ImageResourceUrl,
  RESOURCE_MISSING_IMAGE,
  RESOURCE_MISSING_VIDEO,
  ResourceUrl,
  VideoResourceUrl,
} from './resource.js';

test('ResourceUrl', async (t) => {
  await t.test('should be valid if starts with protocol', () => {
    assert.ok(ResourceUrl.safeParse('https://example.com/image.png').success);
  });

  await t.test('should be valid if equals to missing image constant', () => {
    assert.ok(ResourceUrl.safeParse(RESOURCE_MISSING_IMAGE).success);
  });

  await t.test('should be valid if equals to missing video constant', () => {
    assert.ok(ResourceUrl.safeParse(RESOURCE_MISSING_VIDEO).success);
  });

  await t.test('should fail if not starts with protocol', () => {
    assert.ok(!ResourceUrl.safeParse('/image.png').success);
  });
});

test('ImageResourceUrl', async (t) => {
  await t.test('should be valid if ends with image extension', () => {
    assert.ok(ImageResourceUrl.safeParse('https://example.com/image.png').success);
  });

  await t.test('should fail if not ends with image extension', () => {
    assert.ok(!ImageResourceUrl.safeParse('https://example.com/image.txt').success);
  });

  await t.test('should fail if not starts with protocol', () => {
    assert.ok(!ImageResourceUrl.safeParse('/image.png').success);
  });
});

test('VideoResourceUrl', async (t) => {
  await t.test('should be valid if ends with video extension', () => {
    assert.ok(VideoResourceUrl.safeParse('https://example.com/video.mp4').success);
  });

  await t.test('should fail if not ends with video extension', () => {
    assert.ok(!VideoResourceUrl.safeParse('https://example.com/video.txt').success);
  });

  await t.test('should fail if not starts with protocol', () => {
    assert.ok(!VideoResourceUrl.safeParse('/video.mp4').success);
  });
});
