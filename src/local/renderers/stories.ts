import { readFile } from 'fs/promises';
import sharp from 'sharp';
import { markdownToText } from '../../core/entities/markdown.js';
import type { Post } from '../../core/entities/post.js';
import { asArray } from '../../core/utils/common-utils.js';
import { readResource } from '../data-managers/resources.js';
import { htmlToImage } from '../utils/image-utils.js';

let storyStyle: string | undefined;
let fontDataUrl: string | undefined;

export interface CreatePostStoryArgs {
  ru?: boolean;
  ignoreLinks?: boolean;
}

export async function createPostStory(post: Post, args?: CreatePostStoryArgs) {
  const { ru, ignoreLinks } = args ?? {};

  const content = asArray(post.content);
  const snapshot = asArray(post.snapshot);
  let imageUrl;
  let refImageUrl;

  switch (post.type) {
    case 'shot':
      imageUrl = content[0];
      break;
    case 'redrawing':
    case 'photoshop':
      imageUrl = content[0];
      refImageUrl = content[1];
      break;
    case 'mention':
      imageUrl = snapshot[0];
      break;
    case 'news':
      imageUrl = content[1] ?? content[0];
      break;
    default:
      throw new Error(`Creating story images for post type ${post.type} is not supported.`);
  }

  const html = await createStoryHtml({
    title: ru ? post.titleRu : post.title,
    description: ru ? post.descriptionRu : post.description,
    imageUrl,
    refImageUrl,
    ignoreLinks,
  });
  const image = await htmlToImage(html);

  return { html, image };
}

export interface CreateStoryHtmlArgs {
  title?: string;
  description?: string;
  imageUrl?: string;
  refImageUrl?: string;
  ignoreLinks?: boolean;
}

export async function createStoryHtml({
  title,
  description,
  imageUrl = 'file://./assets/avatar.png',
  refImageUrl,
  ignoreLinks,
}: CreateStoryHtmlArgs): Promise<string> {
  if (!storyStyle) {
    const data = await readFile('./assets/story.css', 'utf-8');
    if (!storyStyle) {
      storyStyle = data;
    }
  }

  if (!fontDataUrl) {
    const data = `data:application/font-woff2;charset=utf-8;base64,${await readFile(
      './src/site/fonts/MysticCards.woff2',
      'base64',
    )}`;
    if (!fontDataUrl) {
      fontDataUrl = data;
    }
  }

  const image = await getResourceForStoryHtml(imageUrl);
  const refImage = refImageUrl ? await getResourceForStoryHtml(refImageUrl) : undefined;

  const { text, links } = description ? markdownToText(description) : {};

  return `
<html>
<head>
  <style>
    @font-face { font-family: 'MysticCards'; src: url("${fontDataUrl}") format('woff2'); }
  </style>
  <style type='text/css'>${storyStyle}</style>
</head>
<body>
  <img src="${image.dataUrl}"${image.heightMultiplier > 2 ? ` class="cut"` : ''} />
  ${refImage ? `<div class="ref"><img src="${refImage.dataUrl}" /></div>` : ''}
  ${title ? `<h1>${title}</h1>` : ''}
  ${text ? `<p>${text}</p>` : ''}
  ${
    !ignoreLinks && links
      ? links.length > 1
        ? `<ul>${links.map((link) => `<li>${link}</li>`).join('')}</ul>`
        : `<p>${links[0]}</p>`
      : ''
  }
</body>
</html>
`;
}

async function getResourceForStoryHtml(url: string) {
  const [imageData, imageMimeType] = await readResource(url);
  const metadata = await sharp(imageData).metadata();
  const heightMultiplier = metadata.height && metadata.width ? metadata.height / metadata.width : 0;
  const dataUrl = `data:${imageMimeType};base64,${imageData.toString('base64')}`;

  return {
    dataUrl,
    heightMultiplier,
  };
}
