import 'dotenv/config';
import assert from 'node:assert';
import { after, test } from 'node:test';
import { DeleteObjectCommand, S3Client, type S3ClientConfig } from '@aws-sdk/client-s3';
import type { Upload } from '../entities/upload.ts';
import { getUploadMetaName, getUploadPreviewName, getS3UploadsPath } from '../utils/s3-utils.ts';
import { getUpload, getUploads, uploadFiles } from './uploads-manager.ts';

// 1x1 transparent PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

const uploaded: Upload[] = [];

function createCleanupClient() {
  const config: S3ClientConfig = {
    region: process.env.S3_REGION || 'us-east-1',
  };

  if (process.env.S3_ENDPOINT) {
    config.endpoint = process.env.S3_ENDPOINT;
    config.forcePathStyle = true;
  }

  if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    };
  }

  return new S3Client(config);
}

after(async () => {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    return;
  }

  const client = createCleanupClient();
  const path = getS3UploadsPath();

  for (const upload of uploaded) {
    for (const name of [upload.name, getUploadMetaName(upload.name), getUploadPreviewName(upload.name)]) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: `${path}/${name}` }));
    }
  }
});

test('uploads S3 integration', async (t) => {
  await t.test('upload image returns metadata', async () => {
    const file = new File([PNG], 'integration-test-image.png', { type: 'image/png' });
    const { uploads, errors } = await uploadFiles([file]);

    assert.deepEqual(errors, []);
    assert.equal(uploads.length, 1);

    const [upload] = uploads;
    assert.ok(upload);
    uploaded.push(upload);

    assert.match(upload.name, /^image-[a-f0-9]{8}\.png$/);
    assert.equal(upload.url, `uploads:/${upload.name}`);
    assert.equal(upload.originalName, 'integration-test-image.png');
    assert.equal(upload.type, 'image');
    assert.equal(upload.mime, 'image/png');
    assert.equal(upload.size, PNG.length);
    assert.ok(upload.uploaded instanceof Date);
    assert.ok(upload.expires instanceof Date);
    assert.ok(upload.expires.getTime() > upload.uploaded.getTime());
  });

  await t.test('uploaded image is listed', async () => {
    const [upload] = uploaded;
    assert.ok(upload);

    const list = await getUploads({ type: 'image' });
    const found = list.find((item) => item.name === upload.name);

    assert.ok(found, `Expected "${upload.name}" to be in the uploads list`);
  });

  await t.test('uploaded metadata can be fetched', async () => {
    const [upload] = uploaded;
    assert.ok(upload);

    const metadata = await getUpload(upload.url);
    assert.equal(metadata.name, upload.name);
    assert.equal(metadata.size, PNG.length);
  });

  await t.test('re-uploaded file is deduplicated', async () => {
    const [upload] = uploaded;
    assert.ok(upload);

    const file = new File([PNG], 'integration-test-image.png', { type: 'image/png' });
    const { uploads } = await uploadFiles([file]);

    assert.equal(uploads[0]?.name, upload.name);
  });

  await t.test('unsupported file type is rejected', async () => {
    const file = new File([Buffer.from('test')], 'integration-test.txt', { type: 'text/plain' });
    const { uploads, errors } = await uploadFiles([file]);

    assert.equal(uploads.length, 0);
    assert.match(errors.join(' '), /not supported/i);
  });
});
