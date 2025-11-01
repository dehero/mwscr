import sharp from 'sharp';
import { readResource } from '../../data-managers/resources.js';

export async function getResourceForHtml(url: string) {
  const [imageData, imageMimeType] = await readResource(url);
  const metadata = await sharp(imageData).metadata();
  const heightMultiplier = metadata.height && metadata.width ? metadata.height / metadata.width : 0;
  const dataUrl = `data:${imageMimeType};base64,${imageData.toString('base64')}`;

  return {
    dataUrl,
    heightMultiplier,
  };
}
