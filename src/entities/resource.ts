import { posix } from 'path/posix';
import { pathToFileURL } from 'url';

export const RESOURCE_PROTOCOLS = ['store:', 'file:', 'http:', 'https:'] as const;

export const RESOURCE_TYPES = ['image', 'video', 'archive'] as const;

const RESOURCE_REGEX_IMAGE = /.png$/;
const RESOURCE_REGEX_VIDEO = /.(avi|mp4)$/;

export const RESOURCE_MISSING_IMAGE = 'MISSING_IMAGE.png';
export const RESOURCE_MISSING_VIDEO = 'MISSING_VIDEO.mp4';

export type ResourceProtocol = (typeof RESOURCE_PROTOCOLS)[number];
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export function isResourceProtocol(value: unknown): value is ResourceProtocol {
  return typeof value === 'string' && RESOURCE_PROTOCOLS.includes(value as ResourceProtocol);
}

export type ResourceUrl = `${ResourceProtocol}/${string}`;

export interface ResourceParsedUrl {
  protocol: ResourceProtocol;
  pathname: string;
  ext: string;
  name: string;
  base: string;
  dir: string;
}

export type Resource = [data: Buffer, mimeType: string | null, filename: string];

export function parseResourceUrl(url: string): ResourceParsedUrl {
  const { protocol, host, pathname } = new URL(url, pathToFileURL(process.cwd() + '/'));
  const { ext, name, base, dir } = posix.parse(pathname);

  if (!isResourceProtocol(protocol)) {
    throw new Error(`Unknown protocol ${protocol}`);
  }

  return {
    dir: dir.replace(/^\//, ''),
    name,
    ext,
    base,
    protocol,
    pathname: posix.join(host, pathname.replace(/^\//, '')),
  };
}

export function resourceIsImage(url: string): boolean {
  return RESOURCE_REGEX_IMAGE.test(url);
}

export function resourceIsVideo(url: string): boolean {
  return RESOURCE_REGEX_VIDEO.test(url);
}
