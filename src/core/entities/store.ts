import picomatch from 'picomatch';
import { stringToDate } from '../utils/date-utils.js';
import type { PostType } from './post.js';
import { parseResourceUrl } from './resource.js';

export const STORE_SHOTS_DIR = 'shots';
export const STORE_ORIGINAL_DIR = 'original';
export const STORE_DRAWINGS_DIR = 'drawings';
export const STORE_VIDEOS_DIR = 'videos';
export const STORE_INBOX_DIR = 'inbox';
export const STORE_TRASH_DIR = 'trash';
export const STORE_WALLPAPERS_DIR = 'wallpapers';
export const STORE_NEWS_DIR = 'news';
export const STORE_SNAPSHOTS_DIR = 'snapshots';
export const STORE_PHOTOSHOPS_DIR = 'photoshops';
export const STORE_OUTTAKES_DIR = 'outtakes';
export const STORE_AVATARS_DIR = 'avatars';
export const STORE_PHOTOS_DIR = 'photos';

export const STORE_INBOX_ITEM_NAME_REGEX = /^([^.]+)\.(\d{4}-\d{2}-\d{2})-([^.]+)(?:\.(\d+))?$/;
export const STORE_SHOTS_NAME_REGEX = /^(\d{4}-\d{2}-\d{2})-(.+)$/;

export interface StoreItem {
  name: string;
  url: string;
  isDirectory: boolean;
}

export interface StoreResourceParsedUrl {
  dir?: string;
  author?: string;
  date?: Date;
  key?: string;
  variant?: string;
  ext?: string;
  originalUrl?: string;
}

export interface Store {
  include?: string[];

  getPublicUrl(path: string): string | undefined;

  getPreviewUrl(path: string, width?: number, height?: number): string | undefined | Promise<string | undefined>;
}

export interface StoreManager extends Store {
  copy(from: string, to: string): Promise<void>;

  exists(path: string): Promise<boolean>;

  get(path: string): Promise<Buffer>;

  getStream(path: string): Promise<NodeJS.ReadableStream | null>;

  move(from: string, to: string): Promise<void>;

  put(path: string, data: Iterable<unknown> | AsyncIterable<unknown>): Promise<void>;

  putStream(path: string, stream: NodeJS.ReadableStream): Promise<void>;

  readdir(path: string): Promise<StoreItem[]>;

  remove(path: string): Promise<void>;
}

export function storeIncludesPath(...checkedPaths: string[]) {
  return (store: Pick<StoreManager, 'include'>) =>
    !store.include ||
    (store.include.length > 0 && checkedPaths.every((path) => picomatch.isMatch(path, store.include ?? [])));
}

export function parseStoreResourceUrl(url: string): StoreResourceParsedUrl {
  const { ext, name, dir, protocol } = parseResourceUrl(url);

  let author, dateStr, key, variant, originalUrl;
  if (protocol !== 'store:') {
    return {};
  }

  switch (dir) {
    case STORE_INBOX_DIR:
    case STORE_TRASH_DIR:
      [, author, dateStr, key, variant] = STORE_INBOX_ITEM_NAME_REGEX.exec(name) || [];
      originalUrl = variant ? `store:/${dir}/${author}.${dateStr}-${key}${ext}` : undefined;
      break;
    case STORE_DRAWINGS_DIR:
    case STORE_PHOTOS_DIR:
    case STORE_OUTTAKES_DIR:
    case STORE_SHOTS_DIR:
    case STORE_VIDEOS_DIR:
    case STORE_WALLPAPERS_DIR:
      [, dateStr, key] = STORE_SHOTS_NAME_REGEX.exec(name) || [];
      originalUrl = `store:/${dir}/${STORE_ORIGINAL_DIR}/${dateStr}-${key}.original${ext}`;
      break;
    default:
  }

  return {
    dir,
    author,
    date: stringToDate(dateStr ?? ''),
    key,
    variant,
    ext,
    originalUrl,
  };
}

export function getTargetStoreDirFromPostType(type: PostType) {
  switch (type) {
    case 'shot':
      return STORE_SHOTS_DIR;
    case 'clip':
    case 'video':
      return STORE_VIDEOS_DIR;
    case 'wallpaper':
      return STORE_WALLPAPERS_DIR;
    case 'news':
      return STORE_NEWS_DIR;
    case 'photoshop':
      return STORE_PHOTOSHOPS_DIR;
    case 'redrawing':
      return STORE_DRAWINGS_DIR;
    case 'outtakes':
      return STORE_OUTTAKES_DIR;
    case 'achievement':
    case 'merch':
      return STORE_PHOTOS_DIR;
    default:
  }

  return undefined;
}
