import { stringToDate } from '../utils/date-utils.js';
import { parseResourceUrl } from './resource.js';

export const STORE_SHOTS_DIR = 'shots';
export const STORE_ORIGINAL_DIR = 'original';
export const STORE_DRAWINGS_DIR = 'drawings';
export const STORE_VIDEOS_DIR = 'videos';
export const STORE_INBOX_DIR = 'inbox';
export const STORE_TRASH_DIR = 'trash';

export const STORE_INBOX_ITEM_NAME_REGEX = /^([^.]+)\.(\d{4}-\d{2}-\d{2})-([^.]+)(?:\.(\d+))?$/;
export const STORE_SHOTS_NAME_REGEX = /^(\d{4}-\d{2}-\d{2})\.(.+)$/;

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
  copy(from: string, to: string): Promise<void>;

  exists(src: string): Promise<boolean>;

  get(path: string): Promise<Buffer>;

  getStream(path: string): Promise<NodeJS.ReadableStream | null>;

  getPreviewUrl(path: string, width?: number, height?: number): Promise<string | undefined>;

  move(from: string, to: string): Promise<void>;

  put(path: string, data: Iterable<unknown> | AsyncIterable<unknown>): Promise<void>;

  putStream(path: string, stream: NodeJS.ReadableStream): Promise<void>;

  putUrl(path: string, url: string): Promise<void>;

  readdir(path: string): Promise<StoreItem[]>;

  remove(path: string): Promise<void>;
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
    case STORE_SHOTS_DIR:
    case STORE_VIDEOS_DIR:
      [, dateStr, key] = STORE_SHOTS_NAME_REGEX.exec(name) || [];
      originalUrl = `store:/${dir}/${STORE_ORIGINAL_DIR}/${dateStr}.${key}.original${ext}`;
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
