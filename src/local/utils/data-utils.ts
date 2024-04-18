import crypto from 'crypto';
import { Packr } from 'msgpackr';
import zlib from 'zlib';

const packr = new Packr();

export function getDataHash(data: crypto.BinaryLike) {
  return crypto.createHash('shake256', { outputLength: 4 }).update(data).digest('hex');
}

export function compressData(data: unknown): string | undefined {
  return zlib
    .brotliCompressSync(packr.pack(data), {
      params: {
        [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
        [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
      },
    })
    .toString('base64')
    .match(/.{1,76}/g)
    ?.join('\n');
}

export function decompressData<T>(value: string): T {
  return packr.unpack(zlib.brotliDecompressSync(Buffer.from(value, 'base64')));
}
