import type { InferOutput } from 'valibot';
import { literal, nonEmpty, object, pipe, string, trim, tuple, variant } from 'valibot';
import { ImageResourceUrl, VideoResourceUrl } from './resource.js';

export const PostDescription = pipe(string(), trim(), nonEmpty());

export type PostDescription = InferOutput<typeof PostDescription>;

export const Shot = object({
  type: literal('shot'),
  content: ImageResourceUrl,
});

export const ShotSet = object({
  type: literal('shot-set'),
  content: tuple(
    [ImageResourceUrl, ImageResourceUrl, ImageResourceUrl, ImageResourceUrl],
    'Should be 4 shot resources',
  ),
});

export const Redrawing = object({
  type: literal('redrawing'),
  content: tuple([ImageResourceUrl, ImageResourceUrl], 'Should be a tuple of drawing and shot resources'),
});

export const Wallpaper = object({
  type: literal('wallpaper'),
  content: ImageResourceUrl,
});

export const VerticalWallpaper = object({
  type: literal('wallpaper-v'),
  content: ImageResourceUrl,
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
  content: tuple([ImageResourceUrl, ImageResourceUrl], 'Should be a tuple of photoshopped and original shot resources'),
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
]);
