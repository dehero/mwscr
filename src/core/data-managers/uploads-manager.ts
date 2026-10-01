import { assertSchema } from '../entities/schema.ts';
import { parseResourceUrl } from '../entities/resource.ts';
import type { UploadType } from '../entities/upload.ts';
import { createUploadFileName, getUploadTypeFromMimeType, Upload } from '../entities/upload.ts';
import { jsonDateReviver } from '../utils/date-utils.ts';
import { getUploadMetaName, getUploadPreviewName, getS3UploadsPath, getUploadPublicUrl } from '../utils/s3-utils.ts';
import type { S3ClientConfig } from '@aws-sdk/client-s3';
import importVariantsRaw from '../../../assets/import-variants.json' with { type: 'json' };
import type { ImportVariant } from '../entities/import-variant.ts';

const importVariants = importVariantsRaw as Record<string, ImportVariant>;

const UPLOADS_FORMAT = 'site-uploads';
const PREVIEW_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/bmp'];
const PREVIEW_BASE_SIZE = 320;
const EXPIRATION_DAYS = 7;
const PATCH_SECTIONS = ['posts', 'extras', 'drafts', 'rejects'];
const PATCH_FIELDS = ['content', 'snapshot', 'trash'];

export interface UploadFilesResult {
  uploads: Upload[];
  errors: string[];
}

export interface UploadFilesOptions {
  author?: string;
  originalUrl?: string;
}

interface GetUploadsFilter {
  type?: UploadType;
}

interface S3UploadsEnv {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  uploadsPath: string;
}

function getS3UploadsEnv(): S3UploadsEnv {
  const isBrowser = typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined';

  const bucket = isBrowser ? String(import.meta.env.VITE_S3_BUCKET ?? '') : process.env.S3_BUCKET || '';
  const region = isBrowser
    ? String(import.meta.env.VITE_S3_REGION || 'us-east-1')
    : process.env.S3_REGION || 'us-east-1';
  const endpoint = isBrowser
    ? import.meta.env.VITE_S3_ENDPOINT
      ? String(import.meta.env.VITE_S3_ENDPOINT)
      : undefined
    : process.env.S3_ENDPOINT;
  const accessKeyId = isBrowser
    ? String(import.meta.env.VITE_S3_UPLOADS_ACCESS_KEY_ID ?? '')
    : process.env.S3_UPLOADS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || '';
  const secretAccessKey = isBrowser
    ? String(import.meta.env.VITE_S3_UPLOADS_SECRET_ACCESS_KEY ?? '')
    : process.env.S3_UPLOADS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY || '';

  if (!bucket) {
    throw new Error('S3 uploads bucket is not configured. Set S3_BUCKET for the site build.');
  }

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'S3 uploads credentials are not configured. Set S3_UPLOADS_ACCESS_KEY_ID and S3_UPLOADS_SECRET_ACCESS_KEY for the site build.',
    );
  }

  return {
    bucket,
    region,
    endpoint,
    accessKeyId,
    secretAccessKey,
    uploadsPath: getS3UploadsPath(),
  };
}

let uploadsClient: import('@aws-sdk/client-s3').S3Client | undefined;

async function getS3UploadsClient(env: S3UploadsEnv) {
  if (!uploadsClient) {
    const { S3Client } = await import('@aws-sdk/client-s3');

    const config: S3ClientConfig = {
      region: env.region,
      credentials: {
        accessKeyId: env.accessKeyId,
        secretAccessKey: env.secretAccessKey,
      },
      // S3-compatible storages may not support the checksum headers that are added by default
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    };

    if (env.endpoint) {
      config.endpoint = env.endpoint;
      config.forcePathStyle = true;
    }

    uploadsClient = new S3Client(config);
  }

  return uploadsClient;
}

function createUploadKey(env: S3UploadsEnv, name: string) {
  return [env.uploadsPath, name].filter(Boolean).join('/');
}

async function readUploadMeta(client: import('@aws-sdk/client-s3').S3Client, env: S3UploadsEnv, key: string) {
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');

  try {
    const response = await client.send(new GetObjectCommand({ Bucket: env.bucket, Key: key }));
    const text = await response.Body?.transformToString();
    if (!text) {
      return undefined;
    }

    const data = JSON.parse(text, jsonDateReviver);
    assertSchema(Upload, data);

    return data;
  } catch {
    return undefined;
  }
}

async function putUploadObject(
  client: import('@aws-sdk/client-s3').S3Client,
  env: S3UploadsEnv,
  key: string,
  body: Uint8Array | Blob | string,
  contentType: string,
) {
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');

  await client.send(
    new PutObjectCommand({
      Bucket: env.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

function getMimeTypeFromName(name: string) {
  const extension = name.split('.').pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    bmp: 'image/bmp',
    gif: 'image/gif',
    json: 'application/json',
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    zip: 'application/zip',
  };

  return extension ? mimeMap[extension] : undefined;
}

function validateUploadFile(mimeType: string, size: number) {
  const formats = importVariants[UPLOADS_FORMAT]?.allowedFormats ?? [];
  const sizeInMb = size / (1024 * 1024);

  for (const format of formats) {
    if (!format.mimeTypes.includes(mimeType)) {
      continue;
    }

    if (typeof format.maxSize === 'number' && sizeInMb > format.maxSize) {
      throw new Error(`File exceeds maximum size for ${format.label} (${format.maxSize}MB)`);
    }

    return;
  }

  throw new Error('File type not supported');
}

async function createUploadName(buffer: ArrayBuffer, mimeType: string, originalName: string) {
  if (mimeType === 'application/json') {
    return createUploadFileName([new TextDecoder().decode(buffer), mimeType, originalName]);
  }

  const digest = await crypto.subtle.digest('SHA-256', buffer);
  const hash = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() ?? '';
  const type = getUploadTypeFromMimeType(mimeType);

  return `${type}-${hash}${extension ? `.${extension}` : ''}`;
}

async function createImagePreview(buffer: ArrayBuffer, mimeType: string): Promise<Blob | undefined> {
  try {
    const bitmap = await createImageBitmap(new Blob([buffer], { type: mimeType }));
    const width = bitmap.width;
    const height = bitmap.height;

    if (!width || !height) {
      return undefined;
    }

    const targetWidth = width > height ? Math.round((width / height) * PREVIEW_BASE_SIZE) : PREVIEW_BASE_SIZE;
    const targetHeight = width > height ? PREVIEW_BASE_SIZE : Math.round((height / width) * PREVIEW_BASE_SIZE);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      return undefined;
    }

    context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    return await new Promise<Blob | undefined>((resolve) => {
      canvas.toBlob((blob) => resolve(blob ?? undefined), 'image/webp', 0.85);
    });
  } catch {
    return undefined;
  }
}

async function updateReferencedUploads(
  client: import('@aws-sdk/client-s3').S3Client,
  env: S3UploadsEnv,
  patchData: unknown,
  expires: Date,
  author?: string,
) {
  if (!patchData || typeof patchData !== 'object') {
    return;
  }

  const sections = patchData as Record<string, unknown>;

  for (const section of PATCH_SECTIONS) {
    const items = sections[section];
    if (!items || typeof items !== 'object') {
      continue;
    }

    for (const item of Object.values(items as Record<string, unknown>)) {
      if (!item || typeof item !== 'object') {
        continue;
      }

      const fields = item as Record<string, unknown>;

      for (const field of PATCH_FIELDS) {
        const value = fields[field];
        const strings = Array.isArray(value) ? value : [value];

        for (const str of strings) {
          if (typeof str !== 'string' || !str.startsWith('uploads:/')) {
            continue;
          }

          const name = str.replace(/^uploads:\//, '');
          const key = createUploadKey(env, getUploadMetaName(name));
          const meta = await readUploadMeta(client, env, key);

          if (!meta) {
            continue;
          }

          let updated = false;

          if (new Date(meta.expires).getTime() < expires.getTime()) {
            meta.expires = expires;
            updated = true;
          }

          if (author && !meta.author) {
            meta.author = author;
            updated = true;
          }

          if (updated) {
            await putUploadObject(client, env, key, JSON.stringify(meta, null, 2), 'application/json');
          }
        }
      }
    }
  }
}

async function uploadSingleFile(
  client: import('@aws-sdk/client-s3').S3Client,
  env: S3UploadsEnv,
  file: File,
  options?: UploadFilesOptions,
) {
  const mimeType = file.type || getMimeTypeFromName(file.name) || 'application/octet-stream';
  validateUploadFile(mimeType, file.size);

  const buffer = await file.arrayBuffer();
  const name = await createUploadName(buffer, mimeType, file.name);
  const key = createUploadKey(env, name);
  const metaKey = createUploadKey(env, getUploadMetaName(name));

  const existing = await readUploadMeta(client, env, metaKey);
  if (existing) {
    return existing;
  }

  await putUploadObject(client, env, key, new Uint8Array(buffer), mimeType);

  if (PREVIEW_MIME_TYPES.includes(mimeType)) {
    const preview = await createImagePreview(buffer, mimeType);
    if (preview) {
      await putUploadObject(client, env, createUploadKey(env, getUploadPreviewName(name)), preview, 'image/webp');
    }
  }

  const uploaded = new Date();
  const expires = new Date(uploaded.getTime() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

  const metadata: Upload = {
    name,
    url: `uploads:/${name}`,
    originalName: file.name,
    size: buffer.byteLength,
    type: getUploadTypeFromMimeType(mimeType),
    mime: mimeType,
    uploaded,
    expires,
  };

  if (options?.author) {
    metadata.author = options.author;
  }

  if (options?.originalUrl) {
    metadata.originalUrl = options.originalUrl;
  }

  await putUploadObject(client, env, metaKey, JSON.stringify(metadata, null, 2), 'application/json');

  if (mimeType === 'application/json') {
    await updateReferencedUploads(client, env, JSON.parse(new TextDecoder().decode(buffer)), expires, options?.author);
  }

  return metadata;
}

export async function uploadFiles(files: File[], options?: UploadFilesOptions): Promise<UploadFilesResult> {
  const uploads: Upload[] = [];
  const errors: string[] = [];

  let env: S3UploadsEnv;
  try {
    env = getS3UploadsEnv();
  } catch (error) {
    errors.push(error instanceof Error ? error.message : `${error}`);
    return { uploads, errors };
  }

  const client = await getS3UploadsClient(env);

  for (const file of files) {
    try {
      uploads.push(await uploadSingleFile(client, env, file, options));
    } catch (error) {
      const message = error instanceof Error ? error.message : `${error}`;
      errors.push(`Failed to upload "${file.name}": ${message}`);
    }
  }

  return { uploads, errors };
}

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  limit: number,
  mapper: (item: TInput) => Promise<TOutput>,
) {
  const results: TOutput[] = [];

  for (let index = 0; index < items.length; index += limit) {
    const batch = items.slice(index, index + limit);
    results.push(...(await Promise.all(batch.map(mapper))));
  }

  return results;
}

export async function getUploads(filter?: GetUploadsFilter): Promise<Upload[]> {
  const env = getS3UploadsEnv();
  const client = await getS3UploadsClient(env);
  const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');

  const prefix = `${env.uploadsPath}/`;
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({ Bucket: env.bucket, Prefix: prefix, ContinuationToken: continuationToken }),
    );

    for (const item of response.Contents ?? []) {
      if (item.Key) {
        keys.push(item.Key);
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  const metaKeys = keys.filter((key) => key.endsWith('.meta.json'));
  const metas = await mapWithConcurrency(metaKeys, 8, (key) => readUploadMeta(client, env, key));

  const now = Date.now();
  const uploads = metas.filter((meta): meta is Upload => Boolean(meta) && new Date(meta!.expires).getTime() > now);
  const filtered = filter?.type ? uploads.filter((upload) => upload.type === filter.type) : uploads;

  return filtered.sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime());
}

export async function getUpload(url: string): Promise<Upload> {
  const { path } = parseResourceUrl(url);
  const metaUrl = getUploadPublicUrl(getUploadMetaName(path));

  if (!metaUrl) {
    throw new Error('S3 uploads are not configured.');
  }

  try {
    const response = await fetch(metaUrl);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    const data = JSON.parse(text, jsonDateReviver);

    assertSchema(Upload, data);

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new TypeError(`Failed to fetch upload: ${error.message}`);
    }
    throw new Error(`Failed to fetch upload: ${error}`);
  }
}
