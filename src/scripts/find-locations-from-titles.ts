import 'dotenv/config';
import { arrayFromAsync } from '../core/utils/common-utils.js';
import { locations } from './data-managers/locations.js';
import { posts } from './data-managers/posts.js';

const publishedPostEntries = await posts.getAllEntries(true);

const locationIds = (await arrayFromAsync(locations.readAllEntries(true)))
  .map(([id]) => id)
  .sort((a, b) => b.length - a.length);

for (const [, post] of publishedPostEntries) {
  if (post.location) {
    continue;
  }

  const lowerCaseTitle = post.title.toLocaleLowerCase();

  for (const location of locationIds) {
    const locationRegex = new RegExp(`\\b${location.replace(/ Region$/, '').toLocaleLowerCase()}\\b`);

    if (locationRegex.test(lowerCaseTitle)) {
      post.location = location;
      await posts.save();
      break;
    }
  }
}
