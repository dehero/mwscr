import assert from 'node:assert';
import test from 'node:test';
import { createS3PublicUrl } from './s3-url.js';

test('createS3PublicUrl', () => {
  assert.strictEqual(
    createS3PublicUrl('https://cdn.example.com/', '/store/', '/shots/a file.png'),
    'https://cdn.example.com/store/shots/a%20file.png',
  );
});
