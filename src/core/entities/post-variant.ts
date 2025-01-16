import { literal, object, tuple, variant } from 'valibot';
import { ImageResourceUrl, VideoResourceUrl } from './resource.js';

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

export const PostVariant = variant('type', [Shot, ShotSet, Redrawing, Video, Clip, Wallpaper, VerticalWallpaper]);
