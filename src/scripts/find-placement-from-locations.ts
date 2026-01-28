import 'dotenv/config';
import type { PostPlacement } from '../core/entities/post.js';
import { asArray } from '../core/utils/common-utils.js';
import { locations } from './data-managers/locations.js';
import { posts } from './data-managers/posts.js';

const publishedPostEntries = await posts.getAllEntries(true);

for (const [, post] of publishedPostEntries) {
  if (!post.location || post.placement || post.type !== 'shot') {
    continue;
  }

  const placements: Set<PostPlacement> = new Set();
  const locationEntries = await locations.getEntries(asArray(post.location));

  for (const [, location] of locationEntries) {
    if (location?.type === 'region') {
      placements.add('Outdoors');
    }
  }

  if (placements.size > 0) {
    if (placements.size > 1) {
      post.placement = 'Mixed';
    } else {
      post.placement = [...placements][0];
    }
  }
}

await posts.save();
