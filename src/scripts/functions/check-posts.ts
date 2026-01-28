import { locationMatchesString } from '../../core/entities/location.js';
import { RESOURCE_MISSING_IMAGE } from '../../core/entities/resource.js';
import { asArray } from '../../core/utils/common-utils.js';
import { locations } from '../data-managers/locations.js';
import { drafts, posts, postsManagers } from '../data-managers/posts.js';
import { resourceExists } from '../data-managers/resources.js';

export async function checkPosts() {
  console.group('Checking published and pending posts...');

  await checkPostsContent();
  await checkPostsLocation();

  console.groupEnd();
}

async function checkPostsContent() {
  console.info('Checking availability of published and pending posts content...');

  for (const manager of [posts, drafts]) {
    for await (const [id, post] of manager.readAllEntries()) {
      const content = asArray<string>(post.content);

      if (asArray(post.violation).includes('unreachable-resource')) {
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
  console.info('Checking if posts locations exist in locations list...');

  for (const manager of postsManagers) {
    for await (const [id, post] of manager.readAllEntries()) {
      const locationTitles = asArray(post.location);

      for (const locationTitle of locationTitles) {
        const [, location] =
          (await locations.findEntry((location) => locationMatchesString(location, locationTitle))) ?? [];
        if (location?.title !== locationTitle) {
          console.error(`Location "${locationTitle}" not found for ${manager.name} item "${id}".`);
          if (location) {
            console.warn(`Possible replacement: ${location.title}`);
          }
        }
      }
    }
  }

  console.info(`Checked posts locations.`);
}
