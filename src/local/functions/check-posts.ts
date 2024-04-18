import { RESOURCE_MISSING_IMAGE } from '../../core/entities/resource.js';
import { asArray } from '../../core/utils/common-utils.js';
import { findLocation } from '../data-managers/locations.js';
import { inbox, published, trash } from '../data-managers/posts.js';
import { resourceExists } from '../data-managers/resources.js';

export async function checkPosts() {
  console.group('Checking published and inbox posts...');

  await checkPostsContent();
  await checkPostsLocation();

  console.groupEnd();
}

async function checkPostsContent() {
  console.info('Checking availability of published and inbox content...');

  for (const manager of [published, inbox]) {
    for await (const [id, post] of manager.getAllPosts()) {
      const content = asArray(post.content);

      if (post.violation === 'unreachable-resource') {
        continue;
      }

      for (const url of content) {
        if (url === RESOURCE_MISSING_IMAGE || !(await resourceExists(url))) {
          console.error(`Resource "${url}" not found for ${manager.title} post "${id}".`);
        }
      }
    }
  }

  console.info(`Checked posts content.`);
}

async function checkPostsLocation() {
  console.info('Checking if posts location exists in locations list...');

  for (const manager of [published, inbox, trash]) {
    for await (const [id, post] of manager.getAllPosts()) {
      if (!post.location) {
        continue;
      }

      const location = await findLocation(post.location);
      if (location !== post.location) {
        console.error(`Location "${post.location}" not found for ${manager.title} post "${id}".`);
        if (location) {
          console.warn(`Possible replacement: ${location}`);
        }
      }
    }
  }

  console.info(`Checked posts location.`);
}
