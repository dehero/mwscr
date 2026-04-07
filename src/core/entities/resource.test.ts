import assert from 'node:assert';
import { test } from 'node:test';
import { is } from 'valibot';
import { ImageResourceUrl, parseResourceUrl, VideoResourceUrl } from './resource.js';

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

test('parseResourceUrl', async (t) => {
  await t.test('should parse store: protocol URLs correctly', () => {
    const url = 'store:/images/photo.png';
    const result = parseResourceUrl(url);

    assert.strictEqual(result.protocol, 'store:');
    assert.strictEqual(result.path, 'images/photo.png');
    assert.strictEqual(result.ext, '.png');
    assert.strictEqual(result.name, 'photo');
    assert.strictEqual(result.base, 'photo.png');
    assert.strictEqual(result.dir, 'images');
  });

  await t.test('should parse file: protocol URLs correctly', () => {
    const url = 'file:/home/user/video.mp4';
    const result = parseResourceUrl(url);

    assert.strictEqual(result.protocol, 'file:');
    assert.strictEqual(result.path, 'home/user/video.mp4');
    assert.strictEqual(result.ext, '.mp4');
    assert.strictEqual(result.name, 'video');
    assert.strictEqual(result.base, 'video.mp4');
    assert.strictEqual(result.dir, 'home/user');
  });

  await t.test('should parse http: protocol URLs correctly', () => {
    const url = 'http://example.com/images/photo.webp';
    const result = parseResourceUrl(url);

    assert.strictEqual(result.protocol, 'http:');
    assert.strictEqual(result.path, 'example.com/images/photo.webp');
    assert.strictEqual(result.ext, '.webp');
    assert.strictEqual(result.name, 'photo');
    assert.strictEqual(result.base, 'photo.webp');
    assert.strictEqual(result.dir, 'example.com/images');
  });

  await t.test('should parse https: protocol URLs correctly', () => {
    const url = 'https://cdn.example.com/assets/image.jpg';
    const result = parseResourceUrl(url);

    assert.strictEqual(result.protocol, 'https:');
    assert.strictEqual(result.path, 'cdn.example.com/assets/image.jpg');
    assert.strictEqual(result.ext, '.jpg');
    assert.strictEqual(result.name, 'image');
    assert.strictEqual(result.base, 'image.jpg');
    assert.strictEqual(result.dir, 'cdn.example.com/assets');
  });

  await t.test('should parse uploads: protocol URLs correctly', () => {
    const url = 'uploads:/temp/archive.zip';
    const result = parseResourceUrl(url);

    assert.strictEqual(result.protocol, 'uploads:');
    assert.strictEqual(result.path, 'temp/archive.zip');
    assert.strictEqual(result.ext, '.zip');
    assert.strictEqual(result.name, 'archive');
    assert.strictEqual(result.base, 'archive.zip');
    assert.strictEqual(result.dir, 'temp');
  });

  await t.test('should handle root-level files (no directory)', () => {
    const url = 'store:/file.txt';
    const result = parseResourceUrl(url);

    assert.strictEqual(result.protocol, 'store:');
    assert.strictEqual(result.path, 'file.txt');
    assert.strictEqual(result.ext, '.txt');
    assert.strictEqual(result.name, 'file');
    assert.strictEqual(result.base, 'file.txt');
    assert.strictEqual(result.dir, '');
  });

  await t.test('should handle files without extension', () => {
    const url = 'store:/README';
    const result = parseResourceUrl(url);

    assert.strictEqual(result.protocol, 'store:');
    assert.strictEqual(result.path, 'README');
    assert.strictEqual(result.ext, '');
    assert.strictEqual(result.name, 'README');
    assert.strictEqual(result.base, 'README');
    assert.strictEqual(result.dir, '');
  });

  await t.test('should handle files with multiple dots in name', () => {
    const url = 'store:/archive.tar.gz';
    const result = parseResourceUrl(url);

    assert.strictEqual(result.protocol, 'store:');
    assert.strictEqual(result.path, 'archive.tar.gz');
    assert.strictEqual(result.ext, '.gz');
    assert.strictEqual(result.name, 'archive.tar');
    assert.strictEqual(result.base, 'archive.tar.gz');
    assert.strictEqual(result.dir, '');
  });

  await t.test('should handle nested directories', () => {
    const url = 'file:/a/b/c/d/e/image.bmp';
    const result = parseResourceUrl(url);

    assert.strictEqual(result.protocol, 'file:');
    assert.strictEqual(result.path, 'a/b/c/d/e/image.bmp');
    assert.strictEqual(result.ext, '.bmp');
    assert.strictEqual(result.name, 'image');
    assert.strictEqual(result.base, 'image.bmp');
    assert.strictEqual(result.dir, 'a/b/c/d/e');
  });

  await t.test('should throw error for unknown protocol', () => {
    const url = 'unknown:/path/file.txt';

    assert.throws(() => parseResourceUrl(url), /Unknown protocol unknown:/);
  });

  await t.test('should handle URLs with trailing slash in path', () => {
    const url = 'store:/folder/';
    const result = parseResourceUrl(url);

    assert.strictEqual(result.protocol, 'store:');
    assert.strictEqual(result.path, 'folder/');
    assert.strictEqual(result.ext, '');
    assert.strictEqual(result.name, '');
    assert.strictEqual(result.base, '');
    assert.strictEqual(result.dir, 'folder');
  });

  await t.test('should preserve the exact pathname structure', () => {
    const url = 'https://example.com/api/v1/images/photo.jpg?query=1#hash';
    const result = parseResourceUrl(url);

    assert.strictEqual(result.path, 'example.com/api/v1/images/photo.jpg');
    assert.strictEqual(result.ext, '.jpg');
    assert.strictEqual(result.name, 'photo');
    assert.strictEqual(result.base, 'photo.jpg');
    assert.strictEqual(result.dir, 'example.com/api/v1/images');
  });

  await t.test('should handle HTTP URLs with deep nested paths', () => {
    const url = 'http://api.example.com/v1/users/123/avatar.png';
    const result = parseResourceUrl(url);

    assert.strictEqual(result.protocol, 'http:');
    assert.strictEqual(result.path, 'api.example.com/v1/users/123/avatar.png');
    assert.strictEqual(result.ext, '.png');
    assert.strictEqual(result.name, 'avatar');
    assert.strictEqual(result.base, 'avatar.png');
    assert.strictEqual(result.dir, 'api.example.com/v1/users/123');
  });

  await t.test('should handle Windows-style paths in file: protocol', () => {
    const url = 'file:/C:/Users/name/document.pdf';
    const result = parseResourceUrl(url);

    assert.strictEqual(result.protocol, 'file:');
    assert.strictEqual(result.path, 'C:/Users/name/document.pdf');
    assert.strictEqual(result.ext, '.pdf');
    assert.strictEqual(result.name, 'document');
    assert.strictEqual(result.base, 'document.pdf');
    assert.strictEqual(result.dir, 'C:/Users/name');
  });

  await t.test('should handle files with dot at the beginning', () => {
    const url = 'store:/.hiddenrc';
    const result = parseResourceUrl(url);

    assert.strictEqual(result.protocol, 'store:');
    assert.strictEqual(result.path, '.hiddenrc');
    assert.strictEqual(result.ext, '');
    assert.strictEqual(result.name, '.hiddenrc');
    assert.strictEqual(result.base, '.hiddenrc');
    assert.strictEqual(result.dir, '');
  });

  await t.test('should handle URLs with port numbers', () => {
    const url = 'http://localhost:3000/images/photo.png';
    const result = parseResourceUrl(url);

    assert.strictEqual(result.protocol, 'http:');
    assert.strictEqual(result.path, 'localhost:3000/images/photo.png');
    assert.strictEqual(result.ext, '.png');
    assert.strictEqual(result.name, 'photo');
    assert.strictEqual(result.base, 'photo.png');
    assert.strictEqual(result.dir, 'localhost:3000/images');
  });
});
