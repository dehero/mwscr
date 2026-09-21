import 'dotenv/config';
import { parseResourceUrl } from '../core/entities/resource.ts';
import { STORE_INBOX_DIR } from '../core/entities/store.ts';
import { asArray } from '../core/utils/common-utils.ts';
import { drafts } from './data-managers/posts.ts';
import { moveResource, resourceExists } from './data-managers/resources.ts';

const draftsEntries = await drafts.getAllEntries(true);

for (const [, post] of draftsEntries) {
  const content = [...asArray(post.content), ...asArray(post.trash)];

  for (const url of content) {
    const { dir, base } = parseResourceUrl(url);
    if (dir !== STORE_INBOX_DIR) {
      continue;
    }

    if (await resourceExists(url)) {
      continue;
    }

    const newUrl = `store:/trash/${base}`;
    if (await resourceExists(newUrl)) {
      await moveResource(newUrl, url);
      console.log(`Restored "${url}" from trash`);
    } else {
      console.log(`Cannot find "${url}" in trash`);
    }
  }
}
