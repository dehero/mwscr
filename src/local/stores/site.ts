import { posix } from 'path';
import { Client } from 'basic-ftp';
import { Duplex, Readable } from 'stream';
import type { StoreItem } from '../../core/entities/store.js';
import { debounce } from '../../core/utils/common-utils.js';
import { streamToBuffer } from '../utils/data-utils.js';

const SITE_URL = 'https://mwscr.dehero.site/';

let client: Client | undefined;

const waitAndClose = debounce(() => client?.close(), 1000);

export const include = ['shots/*.png', 'drawings/*.png'];

async function connect() {
  const { SITE_FTP_HOST, SITE_FTP_USER, SITE_FTP_PASSWORD, SITE_FTP_STORE_PATH } = process.env;
  if (!SITE_FTP_HOST) {
    throw new Error('Need site FTP host');
  }

  if (!SITE_FTP_USER) {
    throw new Error('Need site FTP user');
  }

  if (!SITE_FTP_PASSWORD) {
    throw new Error('Need site FTP password');
  }

  if (!SITE_FTP_STORE_PATH) {
    throw new Error('Need site FTP store path');
  }

  if (!client) {
    client = new Client();
  }

  if (client.closed) {
    await client.access({
      host: SITE_FTP_HOST,
      user: SITE_FTP_USER,
      password: SITE_FTP_PASSWORD,
    });
  }

  return { client, path: SITE_FTP_STORE_PATH };
}

export async function copy(from: string, to: string): Promise<void> {
  try {
    const { client, path } = await connect();
    const fromPath = posix.join(path, from);
    const toPath = posix.join(path, to);

    const stream = new Duplex();

    await client.downloadTo(stream, fromPath);
    await client.uploadFrom(stream, toPath);
  } finally {
    waitAndClose();
  }
}

export async function exists(path: string): Promise<boolean> {
  try {
    const { dir, base } = posix.parse(path);
    const items = await readdir(dir);

    return Boolean(items.find((item) => item.name === base));
  } finally {
    waitAndClose();
  }
}

export async function get(path: string): Promise<Buffer> {
  try {
    const site = await connect();
    const stream = new Duplex();

    await site.client.downloadTo(stream, posix.join(site.path, path));

    return await streamToBuffer(stream);
  } finally {
    waitAndClose();
  }
}

export async function getStream(path: string): Promise<NodeJS.ReadableStream | null> {
  try {
    const site = await connect();
    const stream = new Duplex();

    await site.client.downloadTo(stream, posix.join(site.path, path));

    return stream;
  } finally {
    waitAndClose();
  }
}

export async function getPreviewUrl(path: string, _width?: number, _height?: number): Promise<string | undefined> {
  return getPublicUrl(path);
}

export async function getPublicUrl(path: string): Promise<string | undefined> {
  return `${SITE_URL}store/${path}`;
}

export async function move(from: string, to: string): Promise<void> {
  try {
    const { client, path } = await connect();
    const fromPath = posix.join(path, from);
    const toPath = posix.join(path, to);

    await client.rename(fromPath, toPath);
  } finally {
    waitAndClose();
  }
}

export async function put(path: string, data: Iterable<unknown> | AsyncIterable<unknown>): Promise<void> {
  const stream = Readable.from(data);

  try {
    return putStream(path, stream);
  } finally {
    waitAndClose();
  }
}

export async function putStream(path: string, stream: NodeJS.ReadableStream): Promise<void> {
  try {
    const site = await connect();

    await site.client.uploadFrom(new Readable().wrap(stream), posix.join(site.path, path));
  } finally {
    waitAndClose();
  }
}

export async function readdir(path: string): Promise<StoreItem[]> {
  try {
    const site = await connect();
    const items = await site.client.list(posix.join(site.path, path));

    return items.map((item) => ({
      name: item.name,
      url: `store:/${posix.join(path, item.name)}`,
      isDirectory: item.isDirectory,
    }));
  } finally {
    waitAndClose();
  }
}

export async function remove(path: string): Promise<void> {
  try {
    const site = await connect();

    await site.client.remove(posix.join(site.path, path));
  } finally {
    waitAndClose();
  }
}
