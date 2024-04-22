export const SITE_URL = 'https://mwscr.dehero.site/';

export const include = ['shots/*.png', 'drawings/*.png'];

export function getPublicUrl(path: string): string | undefined {
  return `${SITE_URL}store/${path}`;
}
