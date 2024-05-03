import { getPublishedPostChunkName } from '../../core/entities/post-variation.js';
import { WebPostsManager } from './utils/web-posts-manager.js';

export const published = new WebPostsManager({
  name: 'published',
  chunksLoaders: import.meta.glob('../../../data/published/*.yml', { import: 'default' }),
  getPostChunkName: getPublishedPostChunkName,
});
