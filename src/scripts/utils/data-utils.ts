import { Packr } from 'msgpackr';
import type { Readable } from 'stream';
import zlib from 'zlib';

const packr = new Packr();

export function compressData(data: unknown): string | undefined {
  return (
    zlib
      // @ts-expect-error TODO: resolve typing issues
      .brotliCompressSync(packr.pack(data), {
        params: {
          [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
          [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
        },
      })
      .toString('base64')
      .match(/.{1,76}/g)
      ?.join('\n')
  );
}

export function decompressData<T>(value: string): T {
  // @ts-expect-error TODO: resolve typing issues
  return packr.unpack(zlib.brotliDecompressSync(Buffer.from(value, 'base64')));
}

export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const data: Uint8Array[] = [];

    stream.on('data', (chunk) => {
      data.push(chunk);
    });

    stream.on('end', () => {
      resolve(Buffer.concat(data));
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}
