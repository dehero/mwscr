import type { InferOutput } from 'valibot';
import { custom, is, nonEmpty, picklist, pipe, string } from 'valibot';
import { listItems } from '../utils/common-utils.js';

export const ResourceProtocol = picklist(['store:', 'file:', 'http:', 'https:']);
export const ResourceType = picklist(['image', 'video', 'archive']);

export const LosslessImageResourceExtension = picklist(['.png', '.bmp']);
export const ImageResourceExtension = picklist(['.png', '.webp', '.jpg', '.jpeg', '.gif', '.bmp']);
export const VideoResourceExtension = picklist(['.avi', '.mp4']);

export const RESOURCE_MISSING_IMAGE = 'store:/MISSING_IMAGE.png';
export const RESOURCE_MISSING_VIDEO = 'store:/MISSING_VIDEO.mp4';

export type ResourceProtocol = InferOutput<typeof ResourceProtocol>;
export type ResourceType = InferOutput<typeof ResourceType>;

export const ResourceUrl = pipe(
  string('Should be resource string'),
  nonEmpty('Should not be empty'),
  custom(
    (value) => ResourceProtocol.options.some((protocol) => String(value).startsWith(protocol)),
    `Should start with protocol ${listItems(ResourceProtocol.options, true)}"`,
  ),
);

export const LosslessImageResourceUrl = pipe(
  ResourceUrl,
  custom<`${ResourceUrl}${InferOutput<typeof LosslessImageResourceExtension>}`>(
    (value) => LosslessImageResourceExtension.options.some((ext) => String(value).endsWith(ext)),
    `Should end with image extension ${listItems(LosslessImageResourceExtension.options, true)}"`,
  ),
);

export const ImageResourceUrl = pipe(
  ResourceUrl,
  custom<`${ResourceUrl}${InferOutput<typeof ImageResourceExtension>}`>(
    (value) => ImageResourceExtension.options.some((ext) => String(value).endsWith(ext)),
    `Should end with image extension ${listItems(ImageResourceExtension.options, true)}"`,
  ),
);

export const VideoResourceUrl = pipe(
  ResourceUrl,
  custom<`${ResourceUrl}${InferOutput<typeof VideoResourceExtension>}`>(
    (value) => VideoResourceExtension.options.some((ext) => String(value).endsWith(ext)),
    `Should end with video extension ${listItems(VideoResourceExtension.options, true)}"`,
  ),
);

export type ResourceUrl = InferOutput<typeof ResourceUrl>;
export type LosslessImageResourceUrl = InferOutput<typeof LosslessImageResourceUrl>;
export type ImageResourceUrl = InferOutput<typeof ImageResourceUrl>;
export type VideoResourceUrl = InferOutput<typeof VideoResourceUrl>;

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
  const { protocol, host, pathname } = new URL(url, 'file://');
  const [, dir = '', base = ''] = /^(\/.+)?\/([^\/]+)$/.exec(pathname) ?? [];
  const [, name = '', ext = ''] = /^(.*)(\.[^.]+)$/.exec(base) ?? [];

  if (!is(ResourceProtocol, protocol)) {
    throw new Error(`Unknown protocol ${protocol}`);
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

export function resourceIsImage(url: string): url is ImageResourceUrl {
  return is(ImageResourceUrl, url);
}

export function resourceIsVideo(url: string): url is VideoResourceUrl {
  return is(VideoResourceUrl, url);
}
