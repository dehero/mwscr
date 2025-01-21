import type { ListManagerPatch } from '../../core/entities/list-manager.js';
import type { Post, PostPatch } from '../../core/entities/post.js';
import type { InboxItem, PostsManagerName, PublishablePost, TrashItem } from '../../core/entities/posts-manager.js';
import {
  getProposedPostChunkName,
  getPublishedPostChunkName,
  isInboxItem,
  isPublishablePost,
  isTrashOrInboxItem,
  PostsManager,
  PostsManagerPatch,
} from '../../core/entities/posts-manager.js';
import { safeParseSchema } from '../../core/entities/schema.js';
import { isObject } from '../../core/utils/common-utils.js';
import { jsonDateReviver } from '../../core/utils/date-utils.js';
import { setStorageItemWithEvent } from '../utils/storage-utils.js';

interface SitePostsManagerProps<TPost extends Post> {
  name: PostsManagerName;
  checkPost: (post: Post, errors?: string[]) => post is TPost;
  getItemChunkName: (id: string) => string;
}

export class SitePostsManager<TPost extends Post = Post> extends PostsManager<TPost> {
  readonly name: PostsManagerName;

  readonly checkPost: (post: Post, errors?: string[]) => post is TPost;
  readonly getItemChunkName: (id: string) => string;

  constructor({ name, checkPost, getItemChunkName }: SitePostsManagerProps<TPost>) {
    super();
    this.name = name;
    this.checkPost = checkPost;
    this.getItemChunkName = getItemChunkName;

    if (typeof window !== 'undefined') {
      this.readLocalStorage();
      window.addEventListener('storage', () => {
        this.clearCache();
      });
    }
  }

  readLocalStorage() {
    const data = localStorage.getItem(`${this.name}.patch`);
    if (!data) {
      return;
    }

    const patch = safeParseSchema(PostsManagerPatch, JSON.parse(data, jsonDateReviver));
    if (patch) {
      this.mergeLocalPatch(patch);
    }
  }

  updateLocalStorage() {
    const localPatch = this.getLocalPatch();
    setStorageItemWithEvent(localStorage, `${this.name}.patch`, localPatch ? JSON.stringify(localPatch) : null);
  }

  mergeLocalPatch(patch: Partial<ListManagerPatch<PostPatch>>) {
    super.mergeLocalPatch(patch);
    this.updateLocalStorage();
  }

  clearLocalPatch() {
    super.clearLocalPatch();
    this.updateLocalStorage();
  }

  async addItem(post: string | Post, id: string) {
    const [, validPost] = this.validatePost([id, post]);

    this.mergeLocalPatch({ [id]: validPost });
  }

  async removeItem(id: string) {
    this.mergeLocalPatch({ [id]: null });
  }

  async updateItem(id: string) {
    const item = await this.getItem(id);
    if (!item) {
      throw new Error(`Item "${id}" not found when trying to update.`);
    }
    this.mergeLocalPatch({ [id]: item });
  }

  async loadChunkNames() {
    const index = (await fetch('/data/index.json').then((r) => r.json())) as string[];

    return index
      .filter((pathname: string) => pathname.startsWith(`${this.name}/`))
      .map((pathname) => /\/([^/]+)\.json$/.exec(pathname)?.[1] || '');
  }

  protected async loadChunkData(chunkName: string) {
    const filename = `/data/${this.name}/${chunkName}.json`;

    if (!filename) {
      throw new Error(`Chunk "${chunkName}" not found`);
    }

    try {
      const data = JSON.parse(await fetch(filename).then((r) => r.text()), jsonDateReviver) as unknown;

      if (!isObject(data)) {
        throw new TypeError(`File "${filename}" expected to be the map of posts`);
      }

      return [...Object.entries(data as object)].sort(([id1], [id2]) => id1.localeCompare(id2));
    } catch (error) {
      throw new Error(`Failed to load chunk "${chunkName}": ${error}`);
    }
  }

  protected async saveChunk(chunkName: string) {
    throw new Error(`Cannot save chunk ${chunkName} on site.`);
  }
}

export const posts = new SitePostsManager<PublishablePost>({
  name: 'posts',
  checkPost: isPublishablePost,
  getItemChunkName: getPublishedPostChunkName,
});

export const inbox = new SitePostsManager<InboxItem>({
  name: 'inbox',
  checkPost: isInboxItem,
  getItemChunkName: getProposedPostChunkName,
});

export const trash = new SitePostsManager<TrashItem | InboxItem>({
  name: 'trash',
  checkPost: isTrashOrInboxItem,
  getItemChunkName: getProposedPostChunkName,
});

export const postsManagers: SitePostsManager[] = [posts, inbox, trash];
