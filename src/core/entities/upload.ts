import { array, boolean, date, type InferOutput, nullable, number, object, optional, picklist, string } from 'valibot';
import { getRevisionHash } from '../utils/common-utils.js';
import type { Resource } from './resource.js';

export const UploadType = picklist(['image', 'video', 'archive', 'patch', 'file']);

export const Upload = object({
  name: string(),
  url: string(),
  author: optional(string()),
  originalName: string(),
  size: number(),
  type: UploadType,
  mime: string(),
  uploaded: date(),
  expires: date(),
});

export const UploadsResponse = object({
  files: array(Upload),
});

export const UploadResultItem = object({
  success: boolean(),
  errors: array(string()),
  file: nullable(Upload),
});

export const UploadResult = array(UploadResultItem);

export const UploadErrorResponse = object({
  error: string(),
});

export type UploadType = InferOutput<typeof UploadType>;
export type Upload = InferOutput<typeof Upload>;
export type UploadResultItem = InferOutput<typeof UploadResultItem>;
export type UploadResult = InferOutput<typeof UploadResult>;
export type UploadsResponse = InferOutput<typeof UploadsResponse>;
export type UploadErrorResponse = InferOutput<typeof UploadErrorResponse>;

export function createUploadFileName(resource: Resource): string {
  const [data, mimeType, originalName] = resource;
  const hash = getRevisionHash(data);
  const ext = originalName.split('.').pop()?.toLowerCase() || '';
  const type = getUploadTypeFromMimeType(mimeType);

  return `mwscr-${type}-${hash}${ext ? `.${ext}` : ''}`;
}

export function getUploadTypeFromMimeType(mimeType: string | null) {
  if (!mimeType) {
    return 'file';
  }

  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  if (mimeType.startsWith('video/')) {
    return 'video';
  }

  const archiveMimes = ['application/zip', 'application/x-zip-compressed'];

  if (archiveMimes.includes(mimeType)) {
    return 'archive';
  }

  if (mimeType === 'application/json') {
    return 'patch';
  }

  return 'file';
}
