import { posix } from 'path';
import type { Post } from '../../../core/entities/post.js';
import { PostsManager, type PostsManagerChunk } from '../../../core/entities/posts-manager.js';

type ChunkLoader = () => Promise<unknown>;

export interface WebPostsManagerProps {
  title: string;
  chunksLoaders: Record<string, ChunkLoader>;
  getPostChunkName: (id: string) => string;
}

export class WebPostsManager<TPost extends Post = Post> extends PostsManager<TPost> {
  readonly title: string;
  readonly chunksLoaders: Record<string, ChunkLoader>;
  readonly getPostChunkName: (id: string) => string;
  private chunks: Map<string, PostsManagerChunk<TPost>> = new Map();

  constructor({ title, chunksLoaders, getPostChunkName }: WebPostsManagerProps) {
    super();
    this.title = title;
    this.chunksLoaders = chunksLoaders;
    this.getPostChunkName = getPostChunkName;

    console.log(chunksLoaders);
  }

  addPost = async (id: string, post: string | Post) => {
    console.log('addPost', id, post);
  };

  removePost = async (id: string) => {
    console.log('removePost', id);
  };

  updatePost = async (id: string) => {
    console.log('updatePost', id);
  };

  getChunkNames = async (): Promise<string[]> => {
    return Object.keys(this.chunksLoaders).map((name) => posix.parse(name).name);
  };

  protected async loadChunk(chunkName: string): Promise<PostsManagerChunk<TPost>> {
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
}
