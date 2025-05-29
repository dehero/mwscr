import nodeHtmlToImage from 'node-html-to-image';

export async function htmlToImage(html: string): Promise<Buffer> {
  const result = await nodeHtmlToImage({ html });

  if (!Buffer.isBuffer(result)) {
    throw new TypeError('Failed to create story image.');
  }

  return result;
}
