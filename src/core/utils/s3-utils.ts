export const DEFAULT_S3_UPLOADS_PATH = 'uploads';

function isBrowserEnv() {
  return typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined';
}

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, '');
}

export function getS3UploadsPath(): string {
  const value = isBrowserEnv()
    ? (import.meta.env.VITE_S3_UPLOADS_PATH as string | undefined)
    : typeof process !== 'undefined'
      ? process.env.S3_UPLOADS_PATH
      : undefined;

  return trimSlashes(value || DEFAULT_S3_UPLOADS_PATH);
}

export function getS3PublicUrl(): string | undefined {
  const value = isBrowserEnv()
    ? (import.meta.env.VITE_S3_PUBLIC_URL as string | undefined)
    : typeof process !== 'undefined'
      ? process.env.S3_PUBLIC_URL
      : undefined;

  return value ? value.replace(/\/+$/, '') : undefined;
}

export function getUploadPublicUrl(name: string): string | undefined {
  const base = getS3PublicUrl();
  if (!base) {
    return undefined;
  }

  const key = [getS3UploadsPath(), name].filter(Boolean).join('/');
  return `${base}/${key}`;
}

export function isS3PublicUrl(url: string | undefined): boolean {
  const base = getS3PublicUrl();
  return Boolean(url && base && url.startsWith(`${base}/`));
}

export function getS3CorsUrl(url: string): string {
  if (!isS3PublicUrl(url)) {
    return url;
  }

  return `${url}${url.includes('?') ? '&' : '?'}cors=1`;
}

export function replaceUploadExtension(name: string, extension: string): string {
  return name.replace(/\.[^./]*$/, '') + extension;
}

export function getUploadMetaName(name: string): string {
  return replaceUploadExtension(name, '.meta.json');
}

export function getUploadPreviewName(name: string): string {
  return replaceUploadExtension(name, '.preview.webp');
}
