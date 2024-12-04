import { readdir } from 'fs/promises';
import type { Post } from '../../core/entities/post.js';
import { getPostFirstPublished, isPost } from '../../core/entities/post.js';
import { stripPostTags } from '../../core/entities/post-tag.js';
import type { InboxItem, PostRequest, PublishablePost, TrashItem } from '../../core/entities/post-variation.js';
import {
  getPostDraftChunkName,
  getPublishedPostChunkName,
  isInboxItem,
  isPublishablePost,
  isTrashOrInboxItem,
} from '../../core/entities/post-variation.js';
import type { PostsManagerName } from '../../core/entities/posts-manager.js';
import { PostsManager } from '../../core/entities/posts-manager.js';
import { asArray, textToId } from '../../core/utils/common-utils.js';
import { dateToString } from '../../core/utils/date-utils.js';
import { getDataHash } from '../utils/data-utils.js';
import { pathExists } from '../utils/file-utils.js';
import { loadYaml, saveYaml } from './utils/yaml.js';

interface LocalPostsManagerProps<TPost extends Post> {
  name: PostsManagerName;
  dirPath: string;
  checkPost: (post: Post, errors?: string[]) => post is TPost;
  getItemChunkName: (id: string) => string;
}

class LocalPostsManager<TPost extends Post = Post> extends PostsManager<TPost> {
  readonly name: PostsManagerName;
  readonly checkPost: (post: Post, errors?: string[]) => post is TPost;
  readonly getItemChunkName: (id: string) => string;
  readonly dirPath: string;

  constructor({ name, dirPath, checkPost, getItemChunkName }: LocalPostsManagerProps<TPost>) {
    super();
    this.name = name;
    this.checkPost = checkPost;
    this.dirPath = dirPath;
    this.getItemChunkName = getItemChunkName;
  }

  async addItem(post: Post | string, id: string) {
    const [, validPost] = this.validatePost([id, post]);

    return super.addItem(validPost, id);
  }

  protected async loadChunkNames(): Promise<string[]> {
    const files = await readdir(this.dirPath);

    return files
      .map((file) => /^(.*)\.yml$/.exec(file)?.[1])
      .filter((name): name is string => typeof name === 'string');
  }

  protected async loadChunkData(chunkName: string) {
    const filename = `${this.dirPath}/${chunkName}.yml`;

    if (!(await pathExists(filename))) {
      return [];
    }

    const data = await loadYaml(filename);

    if (typeof data !== 'object' || data === null) {
      throw new TypeError(`File "${filename}" expected to be the map of posts`);
    }

    return [...Object.entries(data)]
      .map((entry) => this.validatePost(entry))
      .sort(([id1], [id2]) => id1.localeCompare(id2));
  }

  protected async saveChunk(chunkName: string) {
    const chunk = await this.chunks.get(chunkName);
    const filename = `${this.dirPath}/${chunkName}.yml`;

    if (!chunk) {
      return;
    }

    const data = Object.fromEntries(chunk.entries());

    return saveYaml(filename, data);
  }

  private validatePost(value: [string, unknown]): [id: string, post: TPost | string] {
    const [id, post] = value;
    if (typeof post === 'string') {
      return [id, post];
    }

    const errors: string[] = [];

    if (!isPost(post, errors)) {
      throw new TypeError(`Post "${id}" is not valid: ${errors.join(', ')}`);
    }

    if (!this.checkPost(post, errors)) {
      throw new TypeError(`Post "${id}" is not valid: ${errors.join(', ')}`);
    }

    stripPostTags(post);

    return [id, post];
  }
}

export const posts = new LocalPostsManager<PublishablePost>({
  name: 'posts',
  dirPath: 'data/posts',
  checkPost: isPublishablePost,
  getItemChunkName: getPublishedPostChunkName,
});

export const inbox = new LocalPostsManager<InboxItem>({
  name: 'inbox',
  dirPath: 'data/inbox',
  checkPost: isInboxItem,
  getItemChunkName: getPostDraftChunkName,
});

// Allow trash to contain restorable inbox items temporarily
export const trash = new LocalPostsManager<TrashItem | InboxItem>({
  name: 'trash',
  dirPath: 'data/trash',
  checkPost: isTrashOrInboxItem,
  getItemChunkName: getPostDraftChunkName,
});

export function createPublishedPostId(post: PublishablePost, index?: number) {
  const created = getPostFirstPublished(post) ?? new Date();
  const dateStr = dateToString(created);
  const name = textToId(post.title);

  return [dateStr, index, name].filter((item) => Boolean(item)).join('-');
}

export function createRepostId(post: PublishablePost) {
  const created = new Date();
  const dateStr = dateToString(created);
  const name = textToId(post.title);

  return [dateStr, name].filter((item) => Boolean(item)).join('-');
}

export function createInboxItemId(creator: string | string[], date: Date, title: string, hash?: string): string {
  const firstCreator = asArray(creator)[0];
  return `${firstCreator}.${dateToString(date)}-${textToId(title)}${hash ? `-${hash}` : ''}`;
}

export function createPostRequestId(request: PostRequest) {
  const hash = getDataHash(request.request.text);

  return createInboxItemId(request.request.user, request.request.date, hash);
}

export const postsManagers: PostsManager[] = [posts, inbox, trash];
