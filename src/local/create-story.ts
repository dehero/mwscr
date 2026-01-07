import 'dotenv/config';
import { writeFile } from 'fs/promises';
import { parsePostPath } from '../core/entities/posts-manager.js';
import { dataManager } from './data-managers/manager.js';
import { createPostStory } from './renderers/stories.js';

const path = process.argv[2];
if (!path) {
  console.error('Need post path');
  process.exit(1);
}

const { managerName, id } = parsePostPath(path);

if (!managerName) {
  console.error('Need posts manager name before post ID');
  process.exit(1);
}

if (!id) {
  console.error('Need post ID');
  process.exit(1);
}

const manager = dataManager.findPostsManager(managerName);
const post = await manager?.getItem(id);

if (!post) {
  console.error(`Unable to find post ${path}`);
  process.exit(1);
}

const { image, html } = await createPostStory(post, { ignoreLinks: true });
const imageFilename = `.temp/${managerName}-${id}.png`;
const htmlFilename = `.temp/${managerName}-${id}.html`;

// @ts-expect-error TODO: Resolve typing issue
await writeFile(imageFilename, image);
console.log(`Story image saved to ${imageFilename}`);

await writeFile(htmlFilename, html, 'utf-8');
console.log(`Story html saved to ${htmlFilename}`);
