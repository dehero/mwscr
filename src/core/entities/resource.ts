import { z } from 'zod';
import { listItems } from '../utils/common-utils.js';

export const ResourceProtocol = z.enum(['store:', 'file:', 'http:', 'https:']);
export const ResourceType = z.enum(['image', 'video', 'archive']);

export const ImageResourceExtension = z.enum(['.png', '.webp', '.jpg']);
export const VideoResourceExtension = z.enum(['.avi', '.mp4']);

export const RESOURCE_MISSING_IMAGE = 'MISSING_IMAGE.png';
export const RESOURCE_MISSING_VIDEO = 'MISSING_VIDEO.mp4';

export type ResourceProtocol = z.infer<typeof ResourceProtocol>;
export type ResourceType = z.infer<typeof ResourceType>;

export const ResourceUrl = z.union([
  z.literal(RESOURCE_MISSING_IMAGE),
  z.literal(RESOURCE_MISSING_VIDEO),
  z.custom<`${ResourceProtocol}/${string}`>(
    (value) => ResourceProtocol.options.some((protocol) => String(value).startsWith(protocol + '/')),
    (value) => ({
      message: `need to start with protocol ${listItems(
        ResourceProtocol.options,
        true,
      )} and further slash, got "${value}"`,
    }),
  ),
]);
export type ResourceUrl = z.infer<typeof ResourceUrl>;

export const ImageResourceUrl = ResourceUrl.and(
  z.custom<`${ResourceProtocol}/${string}${z.infer<typeof ImageResourceExtension>}`>(
    (value) => ImageResourceExtension.options.some((ext) => String(value).endsWith(ext)),
    (value) => ({
      message: `need to end with image extension ${listItems(ImageResourceExtension.options, true)}, got "${value}"`,
    }),
  ),
);

export const VideoResourceUrl = ResourceUrl.and(
  z.custom<`${ResourceProtocol}/${string}${z.infer<typeof VideoResourceExtension>}`>(
    (value) => VideoResourceExtension.options.some((ext) => String(value).endsWith(ext)),
    (value) => ({
      message: `need to end with video extension ${listItems(VideoResourceExtension.options, true)}, got "${value}"`,
    }),
  ),
);

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
  const { protocol: rawProtocol, host, pathname } = new URL(url, 'file://');
  const [, dir = '', base = ''] = /^(\/.+)?\/([^\/]+)$/.exec(pathname) ?? [];
  const [, name = '', ext = ''] = /^(.*)(\.[^.]+)$/.exec(base) ?? [];

  const protocol = ResourceProtocol.safeParse(rawProtocol).data;

  if (!protocol) {
    throw new Error(`Unknown protocol ${rawProtocol}`);
  }

  return {
    dir: dir.replace(/^\//, ''),
    name,
    ext,
    base,
    protocol,
    pathname: [host, pathname.replace(/^\//, '')].filter(Boolean).join('/'),
  };
}

export function resourceIsImage(url: string): boolean {
  return ImageResourceUrl.safeParse(url).success;
}

export function resourceIsVideo(url: string): boolean {
  return VideoResourceUrl.safeParse(url).success;
}
