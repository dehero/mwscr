export function createS3PublicUrl(base: string, storePath: string | undefined, path: string): string {
  const normalizedStorePath = storePath?.replace(/^\/+|\/+$/g, '') ?? '';
  const key = [normalizedStorePath, path.replace(/^\/+/, '')].filter(Boolean).join('/');
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `${base.replace(/\/$/, '')}/${encodedKey}`;
}
