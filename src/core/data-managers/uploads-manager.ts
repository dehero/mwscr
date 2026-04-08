import { assertSchema } from '../entities/schema.js';
import type { UploadType } from '../entities/upload.js';
import { Upload, UploadErrorResponse, UploadResult, UploadsResponse } from '../entities/upload.js';
import { site } from '../services/site.js';
import { jsonDateReviver } from '../utils/date-utils.js';

export interface UploadFilesResult {
  uploads: Upload[];
  errors: string[];
}

export interface UploadFilesOptions {
  author?: string;
  originalUrl?: string;
}

export async function uploadFiles(files: File[], options?: UploadFilesOptions) {
  const uploads: Upload[] = [];
  const errors: string[] = [];
  const formData = new FormData();

  for (const file of files) {
    formData.append('file[]', file, file.name);
  }

  if (options?.author) {
    formData.append('author', options.author);
  }

  if (options?.originalUrl) {
    formData.append('originalUrl', options.originalUrl);
  }

  try {
    const response = await fetch(`${site.origin}/uploads/`, { method: 'POST', body: formData });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    const data = JSON.parse(text, jsonDateReviver);

    assertSchema(UploadResult, data);

    for (const [i, result] of data.entries()) {
      const name = files[i]?.name;

      if (result.success && result.file) {
        uploads.push(result.file);
      } else if (Array.isArray(result.errors)) {
        errors.push(...result.errors.map((error) => `Failed to upload "${name}": ${error}`));
      } else {
        errors.push(`Failed to upload "${name}"`);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      errors.push(`Failed to upload files: ${error.message}`);
    } else {
      errors.push(`Failed to upload files: ${error}`);
    }
  }

  return { uploads, errors };
}

interface GetUploadsFilter {
  type?: UploadType;
}

export async function getUploads(filter?: GetUploadsFilter): Promise<Upload[]> {
  const url = new URL('/uploads/', site.origin);

  if (filter?.type) {
    url.searchParams.set('type', filter.type);
  }

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    const data = JSON.parse(text, jsonDateReviver);

    try {
      assertSchema(UploadsResponse, data);
      return data.files;
    } catch {
      assertSchema(UploadErrorResponse, data);
      throw new Error(data.error);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new TypeError(`Failed to fetch uploads: ${error.message}`);
    }
    throw new Error(`Failed to fetch uploads: ${error}`);
  }
}

export async function getUpload(url: string): Promise<Upload> {
  const metaUrl = url.replace(/^uploads:\/(.*)\..*/, `${site.origin}/uploads/$1.meta.json`);

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
