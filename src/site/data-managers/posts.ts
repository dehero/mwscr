import { getPostDraftChunkName, getPublishedPostChunkName } from '../../core/entities/post-variation.js';
import { WebPostsManager } from './utils/web-posts-manager.js';

export const published = new WebPostsManager({
  name: 'published',
  chunksLoaders: import.meta.glob('../../../data/published/*.yml', { import: 'default' }),
  getPostChunkName: getPublishedPostChunkName,
});

export const inbox = new WebPostsManager({
  name: 'inbox',
  chunksLoaders: import.meta.glob('../../../data/inbox/*.yml', { import: 'default' }),
  getPostChunkName: getPostDraftChunkName,
});

export const trash = new WebPostsManager({
  name: 'trash',
  chunksLoaders: import.meta.glob('../../../data/trash/*.yml', { import: 'default' }),
  getPostChunkName: getPostDraftChunkName,
});
