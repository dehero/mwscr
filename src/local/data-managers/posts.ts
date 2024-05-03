import { getPostFirstPublished } from '../../core/entities/post.js';
import { postNameFromTitle } from '../../core/entities/post-title.js';
import type { InboxItem, PostRequest, PublishablePost, TrashItem } from '../../core/entities/post-variation.js';
import {
  getPostDraftChunkName,
  getPublishedPostChunkName,
  isInboxItem,
  isPublishablePost,
  isTrashOrInboxItem,
} from '../../core/entities/post-variation.js';
import { asArray, textToId } from '../../core/utils/common-utils.js';
import { dateToString } from '../../core/utils/date-utils.js';
import { getDataHash } from '../utils/data-utils.js';
import { LocalPostsManager } from './utils/local-posts-manager.js';

export const published = new LocalPostsManager<PublishablePost>({
  name: 'published',
  dirPath: 'data/published',
  checkPost: isPublishablePost,
  getPostChunkName: getPublishedPostChunkName,
});

export const inbox = new LocalPostsManager<InboxItem>({
  name: 'inbox',
  dirPath: 'data/inbox',
  checkPost: isInboxItem,
  getPostChunkName: getPostDraftChunkName,
});

// Allow trash to contain restorable inbox items temporarily
export const trash = new LocalPostsManager<TrashItem | InboxItem>({
  name: 'trash',
  dirPath: 'data/trash',
  checkPost: isTrashOrInboxItem,
  getPostChunkName: getPostDraftChunkName,
});

export function createPublishedPostId(post: PublishablePost, index?: number) {
  const created = getPostFirstPublished(post) ?? new Date();
  const dateStr = dateToString(created);
  const name = postNameFromTitle(post.title);

  return [dateStr, index, name].filter((item) => Boolean(item)).join('.');
}

export function createRepostId(post: PublishablePost) {
  const created = new Date();
  const dateStr = dateToString(created);
  const name = postNameFromTitle(post.title);

  return [dateStr, name].filter((item) => Boolean(item)).join('.');
}

export function createInboxItemId(creator: string | string[], date: Date, key: string, hash?: string): string {
  const firstCreator = asArray(creator)[0];
  return `${firstCreator}.${dateToString(date)}-${textToId(key)}${hash ? `-${hash}` : ''}`;
}

export function createPostRequestId(request: PostRequest) {
  const hash = getDataHash(request.request.text);

  return createInboxItemId(request.request.user, request.request.date, hash);
}
