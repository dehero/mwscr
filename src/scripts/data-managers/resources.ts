import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import { posix } from 'path';
import mime from 'mime';
import fetch from 'node-fetch';
import sharp from 'sharp';
import { pipeline } from 'stream/promises';
import type { MediaMetadata } from '../../core/entities/media.js';
import type { Resource } from '../../core/entities/resource.js';
import { parseResourceUrl, resourceIsImage, resourceIsVideo } from '../../core/entities/resource.js';
import { textToId } from '../../core/utils/common-utils.js';
import { storeManager } from '../store-managers/index.js';
import { pathExists } from '../utils/file-utils.js';

const DEBUG_RESOURCES = Boolean(process.env.DEBUG_RESOURCES) || false;

export const RESOURCES_PREVIEWS_PATH = 'assets/previews';
export const RESOURCES_PREVIEWS_EXT = '.avif';

export async function resourceExists(url: string): Promise<boolean> {
  const { protocol, pathname } = parseResourceUrl(url);

  switch (protocol) {
    case 'store:':
      return storeManager.exists(pathname);
    case 'file:':
      return pathExists(pathname);
    case 'http:':
    case 'https:': {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    }
    default:
      throw new Error(`Unknown resource protocol ${protocol} for ${url}.`);
  }
}

export async function copyResource(fromUrl: string, toUrl: string): Promise<void> {
  const from = parseResourceUrl(fromUrl);
  const to = parseResourceUrl(toUrl);

  console.info(`Copying from "${fromUrl}" to "${toUrl}"`);

  if (DEBUG_RESOURCES) {
    return;
  }

  switch (from.protocol) {
    case 'store:':
      switch (to.protocol) {
        case 'store:':
          return storeManager.copy(from.pathname, to.pathname);
        case 'file:':
          // @ts-expect-error TODO: resolve typing issues
          return fs.writeFile(to.pathname, await storeManager.get(from.pathname));
        default:
      }
      break;
    case 'file:':
      switch (to.protocol) {
        case 'store:':
          return storeManager.put(to.pathname, await fs.readFile(from.pathname));
        case 'file:':
          return fs.copyFile(from.pathname, to.pathname);
        default:
      }
      break;
    case 'http:':
    case 'https:':
      switch (to.protocol) {
        case 'store:': {
          const response = await fetch(fromUrl);
          if (response.body === null) {
            throw new Error(`Unable to get body for "${fromUrl}"`);
          }

          const arrayBuffer = await response.arrayBuffer();
          const data = Buffer.from(arrayBuffer);

          // Started failing when saving VK avatars to Yandex.Disk using stream. Converting it to buffer as a quick fix.
          // TODO: try using native fetch
          return storeManager.put(to.pathname, data);
        }
        case 'file:': {
          const response = await fetch(fromUrl);
          const stream = createWriteStream(to.pathname);
          if (response.body === null) {
            throw new Error(`Unable to get body for "${fromUrl}"`);
          }

          return pipeline(response.body, stream);
        }
        default:
      }
      break;
    default:
  }

  throw new Error(`Unable to copy "${fromUrl}" to "${toUrl}"`);
}

export async function moveResource(fromUrl: string, toUrl: string) {
  const from = parseResourceUrl(fromUrl);
  const to = parseResourceUrl(toUrl);

  console.info(`Moving from "${fromUrl}" to "${toUrl}"`);

  if (DEBUG_RESOURCES) {
    return;
  }

  switch (from.protocol) {
    case 'store:':
      switch (to.protocol) {
        case 'store:':
          return storeManager.move(from.pathname, to.pathname);
        case 'file:':
          await copyResource(fromUrl, toUrl);
          return storeManager.remove(from.pathname);
        default:
      }
      break;
    case 'file:':
      switch (to.protocol) {
        case 'store:':
          await copyResource(fromUrl, toUrl);
          return fs.rm(from.pathname);
        case 'file:':
          return fs.rename(from.pathname, to.pathname);
        default:
      }
      break;
    case 'http:':
    case 'https:':
      // Don't try to delete file on web, just copy
      return copyResource(fromUrl, toUrl);
    default:
  }

  throw new Error(`Unable to move "${fromUrl}" to "${toUrl}"`);
}

export async function readResource(url: string): Promise<Resource> {
  const { protocol, pathname, base, ext } = parseResourceUrl(url);

  switch (protocol) {
    case 'store:': {
      const data = await storeManager.get(pathname);
      const mimeType = mime.getType(ext);

      return [data, mimeType, base];
    }
    case 'file:': {
      const data = await fs.readFile(pathname);
      const mimeType = mime.getType(ext);

      return [data, mimeType, base];
    }
    case 'http:':
    case 'https:': {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const data = Buffer.from(arrayBuffer);
      const mimeType = response.headers.get('Content-Type') ?? mime.getType(ext);
      const filename = response.headers.get('Content-Disposition')?.split('filename=')?.[1] ?? base;

      return [data, mimeType, filename];
    }
    default:
      throw new Error(`Unable to read protocol "${protocol}"`);
  }
}

export async function removeResource(url: string): Promise<void> {
  const { protocol, pathname } = parseResourceUrl(url);

  console.info(`Removing "${url}"`);

  if (DEBUG_RESOURCES) {
    return;
  }

  switch (protocol) {
    case 'store:':
      return storeManager.remove(pathname);
    case 'file:':
      return fs.rm(pathname);
    default:
  }

  throw new Error(`Unable to remove "${url}"`);
}

export async function writeResource(url: string, data: Buffer) {
  const { protocol, pathname } = parseResourceUrl(url);

  switch (protocol) {
    case 'store:':
      return storeManager.put(pathname, data);
    case 'file:':
      // @ts-expect-error TODO: resolve typing issues
      return fs.writeFile(pathname, data);
    default:
  }

  throw new Error(`Unable to write to "${url}"`);
}

export function getResourcePreviewPath(url: string): string | undefined {
  const { protocol, dir, name } = parseResourceUrl(url);
  // Don't create previews for images on web, first save to store or local file system
  if (protocol === 'http:' || protocol === 'https:') {
    return;
  }

  return `${RESOURCES_PREVIEWS_PATH}/${dir}/${textToId(name, true)}${RESOURCES_PREVIEWS_EXT}`;
}

export async function getResourcePreviewUrl(url: string, width?: number, height?: number): Promise<string | undefined> {
  const { protocol, pathname } = parseResourceUrl(url);

  switch (protocol) {
    case 'store:':
      return storeManager.getPreviewUrl(pathname, width, height);
    case 'http:':
    case 'https:':
      return url;
    default:
      throw new Error(`Unknown resource protocol ${protocol} for ${url}.`);
  }
}

export async function createResourcePreview(url: string, width: number, height: number): Promise<string | undefined> {
  const filename = getResourcePreviewPath(url);
  if (!filename) {
    return;
  }

  if (await pathExists(filename)) {
    return filename;
  }

  const isImage = resourceIsImage(url);
  const isVideo = resourceIsVideo(url);

  if (!isImage && !isVideo) {
    return;
  }

  const previewUrl = isVideo ? await getResourcePreviewUrl(url) : url;
  if (!previewUrl) {
    return;
  }

  try {
    const [data] = await readResource(previewUrl);
    const preview = sharp(data).resize(width, height, { fit: 'outside' });
    if (isVideo) {
      preview.composite([{ input: './assets/play.png' }]);
    }
    try {
      await fs.mkdir(posix.dirname(filename), { recursive: true });
    } catch {
      // Ignore
    }
    await preview.avif({ effort: 9, quality: 70, chromaSubsampling: '4:2:0' }).toFile(filename);
    console.info(`Created preview "${filename}" for "${url}"`);
  } catch (error) {
    console.error(`Cannot create preview for "${previewUrl}": ${error}`);
  }

  return filename;
}

export async function removeResourcePreview(url: string): Promise<void> {
  const filename = getResourcePreviewPath(url);
  if (!filename) {
    return;
  }

  try {
    await fs.rm(filename);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Cannot remove preview "${filename}": ${error.message}`);
    }
  }
}

export async function extractResourceMediaMetadata(resource: Resource | string): Promise<MediaMetadata> {
  let data, mimeType;

  if (typeof resource === 'string') {
    [data, mimeType] = await readResource(resource);
  } else {
    [data, mimeType] = resource;
  }

  switch (mimeType) {
    case 'image/gif':
    case 'image/avif':
    case 'image/jpeg':
    case 'image/png':
    case 'image/webp':
    case 'image/bmp':
      try {
        return await sharp(data).metadata();
      } catch {
        return {};
      }
    // TODO: add video support
    default:
  }

  return {};
}
