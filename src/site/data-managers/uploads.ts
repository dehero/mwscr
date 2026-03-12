import { assertSchema } from '../../core/entities/schema.js';
import type { Upload, UploadType } from '../../core/entities/upload.js';
import { UploadErrorResponse, UploadResult, UploadsResponse } from '../../core/entities/upload.js';
import { jsonDateReviver } from '../../core/utils/date-utils.js';

export interface UploadFilesResult {
  uploads: Upload[];
  errors: string[];
}

export async function uploadFiles(files: File[]) {
  const uploads: Upload[] = [];
  const errors: string[] = [];
  const formData = new FormData();

  for (const file of files) {
    formData.append('file[]', file, file.name);
  }

  try {
    const response = await fetch(`/uploads/`, { method: 'POST', body: formData });

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
  const url = new URL('/uploads/', window.location.origin);

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
