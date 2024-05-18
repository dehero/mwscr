import 'dotenv/config';
import { arrayFromAsync } from '../core/utils/common-utils.js';
import { locations } from './data-managers/locations.js';
import { published } from './data-managers/posts.js';

const publishedPostEntries = await published.getAllEntries(true);

const locationIds = (await arrayFromAsync(locations.readAllEntries(true)))
  .map(([id]) => id)
  .sort((a, b) => b.length - a.length);

for (const [id, post] of publishedPostEntries) {
  if (post.location) {
    continue;
  }

  const lowerCaseTitle = post.title.toLocaleLowerCase();

  for (const location of locationIds) {
    const locationRegex = new RegExp(`\\b${location.replace(/ Region$/, '').toLocaleLowerCase()}\\b`);

    if (locationRegex.test(lowerCaseTitle)) {
      post.location = location;
      await published.updateItem(id);
      break;
    }
  }
}
