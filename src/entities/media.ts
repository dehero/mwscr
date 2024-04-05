import type { FormatEnum } from 'sharp';
import { greatestCommonDivisor } from '../utils/common-utils.js';

export type MediaFormat = keyof FormatEnum;

export interface MediaMetadata {
  width?: number;
  height?: number;
  format?: MediaFormat;
}

export type MediaAspectRatio = `${number}:${number}`;

export function aspectRatioFromSize(width: number, height: number): MediaAspectRatio {
  const divider = greatestCommonDivisor(width, height);

  return `${width / divider}:${height / divider}`;
}

export function checkMediaAspectRatio(aspectRatio: MediaAspectRatio, metadata: MediaMetadata) {
  if (!metadata.width || !metadata.height) {
    return false;
  }

  const [w, h] = aspectRatio.split(':');

  return metadata.width / metadata.height === Number(w) / Number(h);
}
