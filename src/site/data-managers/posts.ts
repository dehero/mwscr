import { posix } from 'path';
import type { Post } from '../../core/entities/post.js';
import type { InboxItem, PublishablePost, TrashItem } from '../../core/entities/post-variation.js';
import { getPostDraftChunkName, getPublishedPostChunkName } from '../../core/entities/post-variation.js';
import { PostsManager } from '../../core/entities/posts-manager.js';

type ChunkLoader = () => Promise<unknown>;

interface SitePostsManagerProps {
  name: string;
  chunksLoaders: Record<string, ChunkLoader>;
  getItemChunkName: (id: string) => string;
}

class SitePostsManager<TPost extends Post = Post> extends PostsManager<TPost> {
  readonly name: string;
  readonly chunksLoaders: Record<string, ChunkLoader>;
  readonly getItemChunkName: (id: string) => string;

  constructor({ name, chunksLoaders, getItemChunkName }: SitePostsManagerProps) {
    super();
    this.name = name;
    this.chunksLoaders = chunksLoaders;
    this.getItemChunkName = getItemChunkName;
  }

  addItem = async (post: string | Post, id: string | undefined) => {
    console.log('addPost', id, post);
  };

  removeItem = async (id: string) => {
    console.log('removePost', id);
  };

  updateItem = async (id: string) => {
    console.log('updatePost', id);
  };

  async loadChunkNames() {
    return Object.keys(this.chunksLoaders).map((name) => posix.parse(name).name);
  }

  protected async loadChunkData(chunkName: string) {
    const filename = Object.entries(this.chunksLoaders).find(([name]) => name.endsWith(`/${chunkName}.yml`))?.[0];

    if (!filename) {
      throw new Error(`Chunk "${chunkName}" not found`);
    }

    try {
      const data = await this.chunksLoaders[filename]?.();

      if (typeof data !== 'object' || data === null) {
        throw new TypeError(`File "${filename}" expected to be the map of posts`);
      }

      return [...Object.entries(data)].sort(([id1], [id2]) => id1.localeCompare(id2));
    } catch (error) {
      throw new Error(`Failed to load chunk "${chunkName}": ${error}`);
    }
  }

  protected async saveChunk(chunkName: string) {
    console.log('Saving chunk', chunkName);
  }
}

export const published = new SitePostsManager<PublishablePost>({
  name: 'published',
  chunksLoaders: import.meta.glob('../../../data/published/*.yml', { import: 'default' }),
  getItemChunkName: getPublishedPostChunkName,
});

export const inbox = new SitePostsManager<InboxItem>({
  name: 'inbox',
  chunksLoaders: import.meta.glob('../../../data/inbox/*.yml', { import: 'default' }),
  getItemChunkName: getPostDraftChunkName,
});

export const trash = new SitePostsManager<TrashItem | InboxItem>({
  name: 'trash',
  chunksLoaders: import.meta.glob('../../../data/trash/*.yml', { import: 'default' }),
  getItemChunkName: getPostDraftChunkName,
});
