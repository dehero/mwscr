import { RESOURCE_MISSING_IMAGE } from '../../core/entities/resource.js';
import { asArray } from '../../core/utils/common-utils.js';
import { locations } from '../data-managers/locations.js';
import { inbox, posts, trash } from '../data-managers/posts.js';
import { resourceExists } from '../data-managers/resources.js';

export async function checkPosts() {
  console.group('Checking published and pending posts...');

  await checkPostsContent();
  await checkPostsLocation();

  console.groupEnd();
}

async function checkPostsContent() {
  console.info('Checking availability of published and pending posts content...');

  for (const manager of [posts, inbox]) {
    for await (const [id, post] of manager.readAllEntries()) {
      const content = asArray(post.content);

      if (post.violation === 'unreachable-resource') {
        continue;
      }

      for (const url of content) {
        if (url === RESOURCE_MISSING_IMAGE || !(await resourceExists(url))) {
          console.error(`Resource "${url}" not found for ${manager.name} item "${id}".`);
        }
      }
    }
  }

  console.info(`Checked posts content.`);
}

async function checkPostsLocation() {
  console.info('Checking if posts location exists in locations list...');

  for (const manager of [posts, inbox, trash]) {
    for await (const [id, post] of manager.readAllEntries()) {
      if (!post.location) {
        continue;
      }

      const [, location] = (await locations.findEntry({ title: post.location })) ?? [];
      if (location?.title !== post.location) {
        console.error(`Location "${post.location}" not found for ${manager.name} item "${id}".`);
        if (location) {
          console.warn(`Possible replacement: ${location.title}`);
        }
      }
    }
  }

  console.info(`Checked posts locations.`);
}
