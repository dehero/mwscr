import type { FormatEnum } from 'sharp';
import { greatestCommonDivisor } from '../utils/common-utils.js';

export type MediaFormat = keyof FormatEnum;

export interface MediaMetadata {
  width?: number;
  height?: number;
  format?: MediaFormat;
}

export type MediaAspectRatio = `${number}/${number}`;

export function aspectRatioFromSize(width: number, height: number): MediaAspectRatio {
  const divider = greatestCommonDivisor(width, height);

  return `${width / divider}/${height / divider}`;
}

export function checkMediaAspectRatio(aspectRatio: MediaAspectRatio, metadata: MediaMetadata) {
  if (!metadata.width || !metadata.height) {
    return false;
  }

  const [w, h] = aspectRatio.split('/');

  return metadata.width / metadata.height === Number(w) / Number(h);
}

export function getAspectRatioHeightMultiplier(aspectRatio: MediaAspectRatio) {
  const [w, h] = aspectRatio.split('/');
  return Number(h) / Number(w);
}

export function getLimitedAspectRatio(
  aspectRatio: MediaAspectRatio,
  minHeightMultiplier: number | undefined,
  maxHeightMultiplier: number | undefined,
) {
  const [w, h] = aspectRatio.split('/');
  const width = Number(w);
  let height = Number(h);
  const heightMultiplier = getAspectRatioHeightMultiplier(aspectRatio);

  if (minHeightMultiplier && heightMultiplier < minHeightMultiplier) {
    height = width * minHeightMultiplier;
  } else if (maxHeightMultiplier && heightMultiplier > maxHeightMultiplier) {
    height = width * maxHeightMultiplier;
  }

  return aspectRatioFromSize(width, height);
}

export function aspectRatioToReadableText(aspectRatio: MediaAspectRatio | undefined) {
  if (!aspectRatio) {
    return;
  }

  return aspectRatio.replace('/', ':');
}
