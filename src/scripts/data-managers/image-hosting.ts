const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';
const IMAGEKIT_FILES_URL = 'https://api.imagekit.io/v1/files';

export interface TempImage {
  id: string;
  url: string;
}

interface ImageKitUploadResponse {
  fileId?: string;
  url?: string;
  message?: string;
  error?: { message?: string } | string;
}

function getAuthorizationHeader() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Need ImageKit private key');
  }

  return `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}`;
}

function getErrorMessage(result: ImageKitUploadResponse | undefined, response: Response) {
  if (typeof result?.error === 'string') {
    return result.error;
  }
  if (result?.error?.message) {
    return result.error.message;
  }
  if (result?.message) {
    return result.message;
  }

  return response.statusText || 'Unknown error';
}

/**
 * Uploads an image to ImageKit temporary hosting and returns its public URL.
 * Used to give external APIs (like Instagram) access to images that are not in a public store.
 */
export async function uploadTempImage(data: Buffer, filename = 'image.jpg'): Promise<TempImage> {
  const authorization = getAuthorizationHeader();

  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(data)], { type: 'image/jpeg' }), filename);
  form.append('fileName', filename);
  form.append('useUniqueFileName', 'true');

  const folder = process.env.IMAGEKIT_FOLDER;
  if (folder) {
    form.append('folder', folder);
  }

  let response: Response;
  try {
    response = await fetch(IMAGEKIT_UPLOAD_URL, {
      method: 'POST',
      headers: { Authorization: authorization },
      body: form,
    });
  } catch (error) {
    throw new Error(`Cannot reach ImageKit: ${error instanceof Error ? error.message : String(error)}`);
  }

  const result = (await response.json().catch(() => undefined)) as ImageKitUploadResponse | undefined;
  const url = result?.url;
  const id = result?.fileId;

  if (!response.ok || !url || !id) {
    throw new Error(`Cannot upload image to ImageKit: ${getErrorMessage(result, response)}`);
  }

  return { id, url };
}

/**
 * Removes a previously uploaded temporary image from ImageKit.
 */
export async function deleteTempImage(id: string): Promise<void> {
  const authorization = getAuthorizationHeader();

  const response = await fetch(`${IMAGEKIT_FILES_URL}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: authorization },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Cannot delete ImageKit file: ${response.statusText || response.status}`);
  }
}
