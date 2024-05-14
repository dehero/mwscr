import { posix } from 'path';
import type { DataReaderChunk } from '../../../core/entities/data-manager.js';
import type { Post } from '../../../core/entities/post.js';
import { PostsManager } from '../../../core/entities/posts-manager.js';

type ChunkLoader = () => Promise<unknown>;

export interface WebPostsManagerProps {
  name: string;
  chunksLoaders: Record<string, ChunkLoader>;
  getItemChunkName: (id: string) => string;
}

export class WebPostsManager<TPost extends Post = Post> extends PostsManager<TPost> {
  readonly name: string;
  readonly chunksLoaders: Record<string, ChunkLoader>;
  readonly getItemChunkName: (id: string) => string;
  private chunks: Map<string, DataReaderChunk<TPost>> = new Map();

  constructor({ name, chunksLoaders, getItemChunkName }: WebPostsManagerProps) {
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

  getChunkNames = async (): Promise<string[]> => {
    return Object.keys(this.chunksLoaders).map((name) => posix.parse(name).name);
  };

  protected async loadChunk(chunkName: string) {
    let chunk = this.chunks.get(chunkName);
    if (chunk) {
      return chunk;
    }

    const filename = Object.entries(this.chunksLoaders).find(([name]) => name.endsWith(`/${chunkName}.yml`))?.[0];
    let entries: Iterable<[string, TPost | string]> | undefined;

    if (!filename) {
      throw new Error(`Chunk "${chunkName}" not found`);
    }

    try {
      const data = await this.chunksLoaders[filename]?.();

      if (typeof data !== 'object' || data === null) {
        throw new TypeError(`File "${filename}" expected to be the map of posts`);
      }

      entries = [...Object.entries(data)].sort(([id1], [id2]) => id1.localeCompare(id2));
    } catch (error) {
      throw new Error(`Failed to load chunk "${chunkName}": ${error}`);
    }

    chunk = new Map(entries);

    // TODO: do we need this?
    // this.chunkNames?.add(chunkName);
    this.chunks.set(chunkName, chunk);

    return chunk;
  }

  protected async saveChunk(chunkName: string) {
    console.log('Saving chunk', chunkName);
  }
}
