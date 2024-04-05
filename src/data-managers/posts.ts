import type { Post, PostEntry } from '../entities/post.js';
import { getPostEntriesFromSource, getPostFirstPublished } from '../entities/post.js';
import { postNameFromTitle } from '../entities/post-title.js';
import type { InboxItem, PostRequest, PublishablePost, TrashItem } from '../entities/post-variation.js';
import { isInboxItem, isPublishablePost, isTrashOrInboxItem } from '../entities/post-variation.js';
import type { ServicePost } from '../entities/service-post.js';
import { asArray, listItems, textToId } from '../utils/common-utils.js';
import { getDataHash } from '../utils/data-utils.js';
import { dateToString } from '../utils/date-utils.js';
import { PostsManager } from './utils/posts-manager.js';

export const POSTS_PUBLISHED_PATH = 'data/published';
export const POSTS_INBOX_PATH = 'data/inbox';
export const POSTS_TRASH_PATH = 'data/trash';

export const published = new PostsManager<PublishablePost>({
  title: 'published',
  dirPath: POSTS_PUBLISHED_PATH,
  checkPost: isPublishablePost,
  getPostChunkName: getPublishedPostChunkName,
});

export const inbox = new PostsManager<InboxItem>({
  title: 'inbox',
  dirPath: POSTS_INBOX_PATH,
  checkPost: isInboxItem,
  getPostChunkName: getPostDraftChunkName,
});

// Allow trash to contain restorable inbox items temporarily
export const trash = new PostsManager<TrashItem | InboxItem>({
  title: 'trash',
  dirPath: POSTS_TRASH_PATH,
  checkPost: isTrashOrInboxItem,
  getPostChunkName: getPostDraftChunkName,
});

export async function findLastPublishedPostEntry(
  filter: (post: Post) => boolean,
): Promise<PostEntry<PublishablePost> | undefined> {
  const years = (await published.getChunkNames()).reverse();

  for (const year of years) {
    const postEntries = await getPostEntriesFromSource(() => published.getChunkPosts(year));
    const postEntry = [...postEntries].reverse().find(([_, post]) => filter(post));
    if (postEntry) {
      return postEntry;
    }
  }

  return undefined;
}

export async function* getAllServicePosts(service: string): AsyncGenerator<ServicePost<unknown>> {
  for await (const [, post] of published.getAllPosts()) {
    if (!post.posts) {
      continue;
    }
    for (const servicePost of post.posts) {
      if (servicePost.service === service) {
        yield servicePost;
      }
    }
  }
}

export async function getPost<
  TPostsManager extends PostsManager,
  TPost extends TPostsManager extends PostsManager<infer T> ? T : Post,
>(id: string, managers: TPostsManager[]): Promise<[TPost, TPostsManager]> {
  for (const manager of managers) {
    const post = await manager.getPost(id);
    if (post) {
      return [post as TPost, manager];
    }
  }

  throw new Error(`Cannot find post "${id}" through ${listItems(managers.map(({ title }) => title))} posts.`);
}

function getPublishedPostChunkName(id: string) {
  const chunkName = id.split('-')[0];

  if (!chunkName) {
    throw new Error(`Cannot get year from post id: ${id}`);
  }
  return chunkName;
}

function getPostDraftChunkName(id: string) {
  return id.split('.')[1]?.split('-')[0] ?? new Date().getFullYear().toString();
}

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
