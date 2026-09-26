const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';
const DEFAULT_IMAGE_EXPIRATION = 3600;

interface ImgBBUploadResponse {
  success?: boolean;
  data?: {
    url?: string;
    display_url?: string;
    delete_url?: string;
  };
  error?: {
    message?: string;
  };
}

/**
 * Uploads an image to ImgBB temporary hosting and returns its public URL.
 * The image is removed automatically after `IMGBB_EXPIRATION` seconds.
 * Used to give external APIs (like Instagram) access to images that are not in a public store.
 */
export async function uploadTempImage(data: Buffer, filename = 'image.jpg'): Promise<string> {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error('Need ImgBB API key');
  }

  const form = new FormData();
  form.append('key', apiKey);
  form.append('image', new Blob([new Uint8Array(data)], { type: 'image/jpeg' }), filename);
  form.append('expiration', process.env.IMGBB_EXPIRATION || String(DEFAULT_IMAGE_EXPIRATION));

  let response: Response;
  try {
    response = await fetch(IMGBB_UPLOAD_URL, { method: 'POST', body: form });
  } catch (error) {
    throw new Error(`Cannot reach ImgBB: ${error instanceof Error ? error.message : String(error)}`);
  }

  const result = (await response.json().catch(() => undefined)) as ImgBBUploadResponse | undefined;
  const url = result?.data?.url;

  if (!response.ok || !result?.success || !url) {
    const message = result?.error?.message || response.statusText || 'Unknown error';
    throw new Error(`Cannot upload image to ImgBB: ${message}`);
  }

  return url;
}
