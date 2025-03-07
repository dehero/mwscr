import { array, boolean, object, string } from 'valibot';
import { assertSchema } from '../../core/entities/schema.js';

export const UploadScriptResultItem = object({
  success: boolean(),
  url: string(),
  errors: array(string()),
});

export const UploadScriptResult = array(UploadScriptResultItem);

export interface Upload {
  url: string;
  name?: string;
}

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
      throw new Error(await response.text());
    }

    const data = await response.json();

    assertSchema(UploadScriptResult, data);

    for (const [i, result] of data.entries()) {
      const name = files[i]?.name;

      if (result.success) {
        uploads.push({ name, url: result.url });
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
