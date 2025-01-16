import type { MediaAspectRatio, MediaFormat, MediaMetadata } from '../entities/media.js';
import { aspectRatioFromSize, checkMediaAspectRatio } from '../entities/media.js';
import type { Rule } from '../entities/rule.js';

export type MediaRule = Rule<MediaMetadata>;

export function needCertainFormat(format: MediaFormat): MediaRule {
  return (metadata: MediaMetadata) => {
    if (metadata.format !== format) {
      return typeof metadata.format === 'undefined'
        ? 'unable to detect media format'
        : `need format "${format}", got "${metadata.format}"`;
    }

    return undefined;
  };
}

export function needMinWidth(minWidth: number): MediaRule {
  return (metadata: MediaMetadata) => {
    if (!metadata.width || metadata.width < minWidth) {
      return typeof metadata.width === 'undefined'
        ? 'unable to detect media width'
        : `need minimal width ${minWidth}, got ${metadata.width}`;
    }

    return undefined;
  };
}

export function needMinHeight(minHeight: number): MediaRule {
  return (metadata: MediaMetadata) => {
    if (!metadata.height || metadata.height < minHeight) {
      return typeof metadata.height === 'undefined'
        ? 'unable to detect media height'
        : `need minimal height ${minHeight}, got ${metadata.height}`;
    }

    return undefined;
  };
}

export function needAspectRatio(aspectRatio: MediaAspectRatio): MediaRule {
  return (metadata: MediaMetadata) => {
    if (!checkMediaAspectRatio(aspectRatio, metadata)) {
      return !metadata.width || !metadata.height
        ? 'unable to detect media size'
        : `need aspect ratio ${aspectRatio}, got ${aspectRatioFromSize(metadata.width, metadata.height)}`;
    }

    return undefined;
  };
}
