import picomatch from 'picomatch';
import type { InferOutput } from 'valibot';
import { literal, number, union } from 'valibot';
import { dateToString, stringToDate } from '../utils/date-utils.js';
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

export const STORE_DRAFT_ITEM_NAME_REGEX = /^([^.]+)\.(\d{4}-\d{2}-\d{2})-([^.]+)(?:\.(\d+))?$/;
export const STORE_FINAL_ITEM_NAME_REGEX = /^(\d{4}-\d{2}-\d{2})-([^.]+)(?:\.(original))?$/;

export interface StoreItem {
  name: string;
  url: string;
  isDirectory: boolean;
}

export const StoreItemVariant = union([number(), literal('original'), literal('final')]);
export type StoreItemVariant = InferOutput<typeof StoreItemVariant>;

export interface StoreItemParsedUrl {
  dir?: string;
  author?: string;
  date?: Date;
  key: string;
  variant?: StoreItemVariant;
  ext: string;
}

export interface Store {
  readonly include?: string[];
  readonly name: string;

  getPublicUrl(path: string): string | undefined;

  getPreviewUrl(path: string, width?: number, height?: number): string | undefined | Promise<string | undefined>;
}

export interface StoreManager extends Store {
  copy(from: string, to: string): Promise<void>;

  exists(path: string): Promise<false | StoreItem>;

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

export function parseStoreItemUrl(url: string): StoreItemParsedUrl | undefined {
  const { ext, name, dir: fullDir, protocol } = parseResourceUrl(url);
  let [dir] = fullDir.split('/');

  let author, dateStr, key, variantStr;
  let variant: StoreItemVariant;

  if (protocol !== 'store:') {
    return undefined;
  }

  switch (dir) {
    case STORE_INBOX_DIR:
    case STORE_TRASH_DIR:
      [, author, dateStr, key, variantStr] = STORE_DRAFT_ITEM_NAME_REGEX.exec(name) || [];
      variant = !variantStr ? 'original' : Number(variantStr);
      break;
    case STORE_DRAWINGS_DIR:
    case STORE_NEWS_DIR:
    case STORE_OUTTAKES_DIR:
    case STORE_PHOTOS_DIR:
    case STORE_PHOTOSHOPS_DIR:
    case STORE_SHOTS_DIR:
    case STORE_SNAPSHOTS_DIR:
    case STORE_VIDEOS_DIR:
    case STORE_WALLPAPERS_DIR:
      [, dateStr, key, variantStr] = STORE_FINAL_ITEM_NAME_REGEX.exec(name) || [];
      variant = variantStr === 'original' ? 'original' : 'final';
      break;
    default:
      key = name;
      variant = 'final';
      dir = fullDir;
  }

  if (!key) {
    return undefined;
  }

  return {
    dir,
    author,
    date: dateStr ? stringToDate(dateStr) : undefined,
    key,
    variant,
    ext,
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

export function createStoreItemUrl(components: StoreItemParsedUrl) {
  const { dir, author, date, key, ext, variant } = components;

  switch (dir) {
    case STORE_INBOX_DIR:
    case STORE_TRASH_DIR:
      if (variant === 'final' || !date) {
        return undefined;
      }
      if (typeof variant === 'number' && variant > 0) {
        return `store:/${dir}/${author}.${dateToString(date)}-${key}.${variant}${ext}`;
      }
      return `store:/${dir}/${author}.${dateToString(date)}-${key}${ext}`;

    case STORE_DRAWINGS_DIR:
    case STORE_NEWS_DIR:
    case STORE_OUTTAKES_DIR:
    case STORE_PHOTOS_DIR:
    case STORE_PHOTOSHOPS_DIR:
    case STORE_SHOTS_DIR:
    case STORE_SNAPSHOTS_DIR:
    case STORE_VIDEOS_DIR:
    case STORE_WALLPAPERS_DIR:
      if (variant === 'original' && date) {
        return `store:/${dir}/${STORE_ORIGINAL_DIR}/${dateToString(date)}-${key}.original${ext}`;
      }
      if (variant === 'final' && date) {
        return `store:/${dir}/${dateToString(date)}-${key}${ext}`;
      }
      return undefined;

    default:
      return `store:/${dir}/${key}${ext}`;
  }
}
