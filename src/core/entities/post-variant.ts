import type { InferOutput } from 'valibot';
import { array, literal, nonEmpty, object, picklist, pipe, string, trim, tuple, union, variant } from 'valibot';
import { ImageResourceUrl, LosslessImageResourceUrl, VideoResourceUrl } from './resource.js';

export const PostDescription = pipe(string(), trim(), nonEmpty());

export type PostDescription = InferOutput<typeof PostDescription>;

export const Shot = object({
  type: literal('shot'),
  aspect: picklist(['1/1', '1.5/1']),
  content: LosslessImageResourceUrl,
});

export const Compilation = object({
  type: literal('compilation'),
  aspect: picklist(['1/1', '1.5/1', '16/9', '9/19.5']),
  content: tuple(
    [LosslessImageResourceUrl, LosslessImageResourceUrl, LosslessImageResourceUrl, LosslessImageResourceUrl],
    'Should be 4 resources',
  ),
});

export const Redrawing = object({
  type: literal('redrawing'),
  content: tuple([ImageResourceUrl, LosslessImageResourceUrl], 'Should be a tuple of drawing and shot resources'),
});

export const Wallpaper = object({
  type: literal('wallpaper'),
  aspect: picklist(['16/9', '9/19.5']),
  content: LosslessImageResourceUrl,
});

export const Video = object({
  type: literal('video'),
  aspect: picklist(['16/9']),
  content: VideoResourceUrl,
});

export const Clip = object({
  type: literal('clip'),
  aspect: picklist(['1/1', '9/16']),
  content: VideoResourceUrl,
});

export const Outtakes = object({
  type: literal('outtakes'),
  content: tuple([ImageResourceUrl, ImageResourceUrl, ImageResourceUrl], 'Should be 3 screenshot resources'),
});

export const News = object({
  type: literal('news'),
  description: PostDescription,
  descriptionRu: PostDescription,
});

export const Mention = object({
  type: literal('mention'),
  snapshot: ImageResourceUrl,
});

export const Photoshop = object({
  type: literal('photoshop'),
  content: tuple(
    [ImageResourceUrl, LosslessImageResourceUrl],
    'Should be a tuple of photoshopped and original shot resources',
  ),
});

export const Achievement = object({
  type: literal('achievement'),
  content: union([ImageResourceUrl, array(ImageResourceUrl, 'Should be a list of resource strings')]),
});

export const Merch = object({
  type: literal('merch'),
  snapshot: union([ImageResourceUrl, array(ImageResourceUrl, 'Should be a list of resource strings')]),
});

export const PostVariant = variant('type', [
  Shot,
  Compilation,
  Redrawing,
  Video,
  Clip,
  Wallpaper,
  News,
  Mention,
  Photoshop,
  Outtakes,
  Achievement,
  Merch,
]);
