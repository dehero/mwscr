import 'dotenv/config';
import { getPostEntriesFromSource } from '../core/entities/post.js';
import { getLocations } from './data-managers/locations.js';
import { published } from './data-managers/posts.js';

const publishedPostEntries = await getPostEntriesFromSource(published.getAllPosts);

const locations = (await getLocations()).sort((a, b) => b.length - a.length);

for (const [id, post] of publishedPostEntries) {
  if (post.location) {
    continue;
  }

  const lowerCaseTitle = post.title.toLocaleLowerCase();

  for (const location of locations) {
    const locationRegex = new RegExp(`\\b${location.replace(/ Region$/, '').toLocaleLowerCase()}\\b`);

    if (locationRegex.test(lowerCaseTitle)) {
      post.location = location;
      await published.updatePost(id);
      break;
    }
  }
}
