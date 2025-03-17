import type { ListManagerPatch, ListReaderChunk } from '../../core/entities/list-manager.js';
import type { Post } from '../../core/entities/post.js';
import type { PostsManagerName } from '../../core/entities/posts-manager.js';
import {
  getProposedPostChunkName,
  getPublishedPostChunkName,
  InboxItem,
  PostsManager,
  PostsManagerPatch,
  PublishablePost,
  TrashOrInboxItem,
} from '../../core/entities/posts-manager.js';
import type { Schema } from '../../core/entities/schema.js';
import { safeParseSchema } from '../../core/entities/schema.js';
import { jsonDateReviver } from '../../core/utils/date-utils.js';
import { isObject } from '../../core/utils/object-utils.js';
import { setStorageItemWithEvent } from '../utils/storage-utils.js';

interface SitePostsManagerProps<TPost extends Post> {
  name: PostsManagerName;
  getItemChunkName: (id: string) => string;
  ItemSchema: Schema<TPost>;
}

export class SitePostsManager<TPost extends Post = Post> extends PostsManager<TPost> {
  readonly name: PostsManagerName;
  readonly getItemChunkName: (id: string) => string;
  readonly ItemSchema: Schema<TPost>;

  constructor({ name, ItemSchema, getItemChunkName }: SitePostsManagerProps<TPost>) {
    super();
    this.name = name;
    this.ItemSchema = ItemSchema;
    this.getItemChunkName = getItemChunkName;

    if (typeof window !== 'undefined') {
      this.readLocalStorage();
      window.addEventListener('storage', (event) => {
        if (event.key !== `${this.name}.patch`) {
          return;
        }
        this.clearCache();
      });
    }
  }

  readLocalStorage() {
    const data = localStorage.getItem(`${this.name}.patch`);
    if (!data) {
      return;
    }

    // TODO: use patch schema based on TItem
    const patch = safeParseSchema(PostsManagerPatch, JSON.parse(data, jsonDateReviver));
    if (patch) {
      this.mergePatch(patch as ListManagerPatch<TPost>);
    }
  }

  updateLocalStorage() {
    setStorageItemWithEvent(localStorage, `${this.name}.patch`, this.patch ? JSON.stringify(this.patch) : null);
  }

  mergePatch(patch: ListManagerPatch<TPost>) {
    super.mergePatch(patch);
    this.updateLocalStorage();
  }

  clearPatch() {
    super.clearPatch();
    this.updateLocalStorage();
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

      return data as ListReaderChunk<TPost>;
    } catch (error) {
      throw new Error(`Failed to load chunk "${chunkName}": ${error}`);
    }
  }

  protected async removeChunkData(chunkName: string) {
    throw new Error(`Cannot remove chunk data "${chunkName}" on site.`);
  }

  protected async saveChunkData(chunkName: string) {
    throw new Error(`Cannot save chunk data "${chunkName}" on site.`);
  }
}

export const posts = new SitePostsManager<PublishablePost>({
  name: 'posts',
  getItemChunkName: getPublishedPostChunkName,
  ItemSchema: PublishablePost,
});

export const inbox = new SitePostsManager<InboxItem>({
  name: 'inbox',
  getItemChunkName: getProposedPostChunkName,
  ItemSchema: InboxItem,
});

export const trash = new SitePostsManager<TrashOrInboxItem>({
  name: 'trash',
  getItemChunkName: getProposedPostChunkName,
  ItemSchema: TrashOrInboxItem,
});

export const postsManagers: SitePostsManager[] = [posts, inbox, trash];
