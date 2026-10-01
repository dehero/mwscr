import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { DEFAULT_S3_UPLOADS_PATH, getUploadPreviewName } from '../../core/utils/s3-utils.ts';

interface UploadMetadata {
  name?: string;
  expires?: string;
}

function createClient() {
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

async function readMetadata(client: S3Client, bucket: string, key: string): Promise<UploadMetadata | undefined> {
  try {
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const text = await response.Body?.transformToString();
    return text ? (JSON.parse(text) as UploadMetadata) : undefined;
  } catch {
    return undefined;
  }
}

async function deleteKeys(client: S3Client, bucket: string, keys: string[]) {
  for (let index = 0; index < keys.length; index += 1000) {
    const batch = keys.slice(index, index + 1000);
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: batch.map((Key) => ({ Key })) },
      }),
    );
  }
}

export async function maintainUploads() {
  console.group('Maintaining S3 uploads...');

  const bucket = process.env.S3_BUCKET;
  const uploadsPath = (process.env.S3_UPLOADS_PATH || DEFAULT_S3_UPLOADS_PATH).replace(/^\/+|\/+$/g, '');

  if (!bucket) {
    console.info('S3_BUCKET is not set. Skipping uploads maintenance.');
    console.groupEnd();
    return;
  }

  const client = createClient();
  const prefix = `${uploadsPath}/`;
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: continuationToken }),
    );

    for (const item of response.Contents ?? []) {
      if (item.Key) {
        keys.push(item.Key);
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  const metaKeys = keys.filter((key) => key.endsWith('.meta.json'));
  const now = Date.now();
  const deletableKeys: string[] = [];

  for (const metaKey of metaKeys) {
    const metadata = await readMetadata(client, bucket, metaKey);
    const expires = metadata?.expires ? Date.parse(metadata.expires) : Number.NaN;

    if (!Number.isFinite(expires) || expires >= now) {
      continue;
    }

    const metaName = metaKey.slice(prefix.length);
    const name = metadata?.name;

    if (name) {
      deletableKeys.push(`${prefix}${name}`);
      deletableKeys.push(`${prefix}${getUploadPreviewName(name)}`);
    } else {
      deletableKeys.push(`${prefix}${getUploadPreviewName(metaName.replace(/\.meta\.json$/, ''))}`);
    }

    deletableKeys.push(metaKey);
  }

  if (deletableKeys.length > 0) {
    await deleteKeys(client, bucket, deletableKeys);
  }

  console.info(`Deleted ${deletableKeys.length} expired upload objects.`);
  console.groupEnd();
}
