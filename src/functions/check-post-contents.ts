import { inbox, published } from '../data-managers/posts.js';
import { resourceExists } from '../data-managers/resources.js';
import { RESOURCE_MISSING_IMAGE } from '../entities/resource.js';
import { asArray } from '../utils/common-utils.js';

export async function checkPostContents() {
  console.group('Checking availability of published and inbox contents...');

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
    console.info(`Checked ${manager.title} posts.`);
  }

  console.groupEnd();
}
