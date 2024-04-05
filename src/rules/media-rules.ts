import type { MediaAspectRatio, MediaFormat, MediaMetadata } from '../entities/media.js';
import { aspectRatioFromSize, checkMediaAspectRatio } from '../entities/media.js';
import type { Rule } from '../entities/rule.js';

export type MediaRule = Rule<MediaMetadata>;

export function needCertainFormat(format: MediaFormat): MediaRule {
  return (metadata: MediaMetadata): metadata is MediaMetadata => {
    if (metadata.format !== format) {
      throw new Error(
        typeof metadata.format === 'undefined'
          ? 'unable to detect media format'
          : `need format "${format}", got "${metadata.format}"`,
      );
    }
    return true;
  };
}

export function needMinWidth(minWidth: number): MediaRule {
  return (metadata: MediaMetadata): metadata is MediaMetadata => {
    if (!metadata.width || metadata.width < minWidth) {
      throw new Error(
        typeof metadata.width === 'undefined'
          ? 'unable to detect media width'
          : `need minimal width ${minWidth}, got ${metadata.width}`,
      );
    }
    return true;
  };
}

export function needMinHeight(minHeight: number): MediaRule {
  return (metadata: MediaMetadata): metadata is MediaMetadata => {
    if (!metadata.height || metadata.height < minHeight) {
      throw new Error(
        typeof metadata.height === 'undefined'
          ? 'unable to detect media height'
          : `need minimal height ${minHeight}, got ${metadata.height}`,
      );
    }
    return true;
  };
}

export function needAspectRatio(aspectRatio: MediaAspectRatio): MediaRule {
  return (metadata: MediaMetadata): metadata is MediaMetadata => {
    if (!checkMediaAspectRatio(aspectRatio, metadata)) {
      throw new Error(
        !metadata.width || !metadata.height
          ? 'unable to detect media size'
          : `need aspect ratio ${aspectRatio}, got ${aspectRatioFromSize(metadata.width, metadata.height)}`,
      );
    }

    return true;
  };
}
