import nodeHtmlToImage from 'node-html-to-image';

export async function htmlToImage(html: string): Promise<Buffer> {
  const result = await nodeHtmlToImage({
    html,
    puppeteerArgs: {
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--headless'],
    },
  });

  if (!Buffer.isBuffer(result)) {
    throw new TypeError('Failed to create story image.');
  }

  return result;
}
