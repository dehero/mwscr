import { readdir, unlink } from 'fs/promises';
import type { ListReaderChunk } from '../../core/entities/list-manager.js';
import type { Post } from '../../core/entities/post.js';
import type { PostsManagerName, Reject } from '../../core/entities/posts-manager.js';
import {
  createPublishedPostId,
  Draft,
  getProposedPostChunkName,
  getPublishedPostChunkName,
  PostsManager,
  PublishablePost,
  RejectOrDraft,
} from '../../core/entities/posts-manager.js';
import type { Schema } from '../../core/entities/schema.js';
import { isObject } from '../../core/utils/object-utils.js';
import { pathExists } from '../utils/file-utils.js';
import { loadYaml, saveYaml } from './utils/yaml.js';

interface LocalPostsManagerProps<TPost extends Post> {
  name: PostsManagerName;
  dirPath: string;
  createItemId?: (item: TPost) => Promise<string>;
  getItemChunkName: (id: string) => string;
  ItemSchema: Schema<TPost>;
}

class LocalPostsManager<TPost extends Post = Post> extends PostsManager<TPost> {
  readonly name: PostsManagerName;
  readonly createItemId: (item: TPost) => Promise<string>;
  readonly getItemChunkName: (id: string) => string;
  readonly dirPath: string;
  readonly ItemSchema: Schema<TPost>;

  constructor({ name, dirPath, getItemChunkName, createItemId, ItemSchema }: LocalPostsManagerProps<TPost>) {
    super();
    this.name = name;
    this.dirPath = dirPath;
    this.createItemId = createItemId ?? ((item) => super.createItemId(item));
    this.getItemChunkName = getItemChunkName;
    this.ItemSchema = ItemSchema;
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
      return {};
    }

    const data = await loadYaml(filename);

    if (!isObject(data)) {
      // TODO:  add and use chunk schema
      throw new TypeError(`File "${filename}" expected to be the map of posts`);
    }

    return data as ListReaderChunk<TPost>;
  }

  protected async removeChunkData(chunkName: string) {
    const filename = `${this.dirPath}/${chunkName}.yml`;

    return unlink(filename);
  }

  protected async saveChunkData(chunkName: string, data: ListReaderChunk<TPost>) {
    const filename = `${this.dirPath}/${chunkName}.yml`;

    return saveYaml(filename, data);
  }
}

export const posts = new LocalPostsManager<PublishablePost>({
  name: 'posts',
  dirPath: 'data/posts',
  createItemId: createPublishedPostId,
  getItemChunkName: getPublishedPostChunkName,
  ItemSchema: PublishablePost,
});

export const extras = new LocalPostsManager<PublishablePost>({
  name: 'extras',
  dirPath: 'data/extras',
  createItemId: createPublishedPostId,
  getItemChunkName: getPublishedPostChunkName,
  ItemSchema: PublishablePost,
});

export const drafts = new LocalPostsManager<Draft>({
  name: 'drafts',
  dirPath: 'data/drafts',
  getItemChunkName: getProposedPostChunkName,
  ItemSchema: Draft,
});

// Allow rejects to contain restorable drafts temporarily
export const rejects = new LocalPostsManager<Reject | Draft>({
  name: 'rejects',
  dirPath: 'data/rejects',
  getItemChunkName: getProposedPostChunkName,
  ItemSchema: RejectOrDraft,
});

export const postsManagers: PostsManager[] = [posts, extras, drafts, rejects];
