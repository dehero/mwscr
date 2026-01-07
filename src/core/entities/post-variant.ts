import type { InferOutput } from 'valibot';
import { array, literal, nonEmpty, object, pipe, string, trim, tuple, union, variant } from 'valibot';
import { ImageResourceUrl, LosslessImageResourceUrl, VideoResourceUrl } from './resource.js';

export const PostDescription = pipe(string(), trim(), nonEmpty());

export type PostDescription = InferOutput<typeof PostDescription>;

export const Shot = object({
  type: literal('shot'),
  content: LosslessImageResourceUrl,
});

export const ShotSet = object({
  type: literal('shot-set'),
  content: tuple(
    [LosslessImageResourceUrl, LosslessImageResourceUrl, LosslessImageResourceUrl, LosslessImageResourceUrl],
    'Should be 4 shot resources',
  ),
});

export const Redrawing = object({
  type: literal('redrawing'),
  content: tuple([ImageResourceUrl, LosslessImageResourceUrl], 'Should be a tuple of drawing and shot resources'),
});

export const Wallpaper = object({
  type: literal('wallpaper'),
  content: LosslessImageResourceUrl,
});

export const VerticalWallpaper = object({
  type: literal('wallpaper-v'),
  content: LosslessImageResourceUrl,
});

export const Video = object({
  type: literal('video'),
  content: VideoResourceUrl,
});

export const Clip = object({
  type: literal('clip'),
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
  ShotSet,
  Redrawing,
  Video,
  Clip,
  Wallpaper,
  VerticalWallpaper,
  News,
  Mention,
  Photoshop,
  Outtakes,
  Achievement,
  Merch,
]);
