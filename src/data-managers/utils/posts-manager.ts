import { readdir } from 'fs/promises';
import type { Post, PostEntry } from '../../entities/post.js';
import { isPost } from '../../entities/post.js';
import { stripPostTags } from '../../entities/post-tag.js';
import { pathExists } from '../../utils/file-utils.js';
import { loadYaml, saveYaml } from './yaml.js';

type Chunk<TPost> = Map<string, TPost | string>;

export interface PostsManagerProps<TPost extends Post> {
  title: string;
  dirPath: string;
  checkPost: (post: Post, errors?: string[]) => post is TPost;
  getPostChunkName: (id: string) => string;
}

export class PostsManager<TPost extends Post = Post> {
  readonly title: string;
  readonly checkPost: (post: Post, errors?: string[]) => post is TPost;
  readonly getPostChunkName: (id: string) => string;
  readonly dirPath: string;
  private chunkNames: Set<string> | undefined;
  private chunks: Map<string, Chunk<TPost>> = new Map();

  constructor({ title, dirPath, checkPost, getPostChunkName }: PostsManagerProps<TPost>) {
    this.title = title;
    this.checkPost = checkPost;
    this.dirPath = dirPath;
    this.getPostChunkName = getPostChunkName;
  }

  addPost = async (id: string, post: Post | string) => {
    const [, validPost] = this.validatePost([id, post]);
    const chunkName = this.getPostChunkName(id);

    const chunk = await this.loadChunk(chunkName);
    chunk.set(id, validPost);

    return this.saveChunk(chunkName);
  };

  getPost = async (id: string): Promise<TPost | undefined> => {
    const chunkName = this.getPostChunkName(id);
    const chunk = await this.loadChunk(chunkName);
    const post = chunk.get(id);

    if (typeof post === 'string') {
      return this.getPost(post);
    }

    return post;
  };

  removePost = async (id: string) => {
    const chunkName = this.getPostChunkName(id);
    const chunk = await this.loadChunk(chunkName);

    chunk.delete(id);

    return this.saveChunk(chunkName);
  };

  getAllPosts = (skipReferences?: boolean) => this.yieldAllPosts(skipReferences);

  getChunkPosts = (chunkName: string, skipReferences?: boolean) => this.yieldChunkPosts(chunkName, skipReferences);

  getChunk = (chunkName: string): Chunk<TPost> | undefined => {
    return this.chunks.get(chunkName);
  };

  getChunkNames = async (): Promise<string[]> => {
    const currentChunkNames = this.chunkNames;
    if (!currentChunkNames) {
      const files = await readdir(this.dirPath);

      if (!this.chunkNames) {
        this.chunkNames = new Set();
        for (const file of files) {
          const [, chunkName] = /^(.*)\.yml$/.exec(file) || [];

          if (chunkName) {
            this.chunkNames.add(chunkName);
          }
        }
      }
    }

    return this.chunkNames ? [...this.chunkNames.values()] : [];
  };

  updatePost = async (id: string) => {
    const chunkName = this.getPostChunkName(id);
    const chunk = await this.loadChunk(chunkName);
    const post = chunk.get(id);

    const refId = typeof post === 'string' ? post : id;
    const refChunkName = this.getPostChunkName(refId);

    return this.saveChunk(refChunkName);
  };

  private async loadChunk(chunkName: string): Promise<Chunk<TPost>> {
    let chunk = this.chunks.get(chunkName);
    if (chunk) {
      return chunk;
    }

    const filename = `${this.dirPath}/${chunkName}.yml`;
    let entries: Iterable<[string, TPost | string]> | undefined;

    if (await pathExists(filename)) {
      try {
        const data = await loadYaml(filename);

        if (typeof data !== 'object' || data === null) {
          throw new TypeError(`File "${filename}" expected to be the map of posts`);
        }

        entries = [...Object.entries(data)]
          .map((entry) => this.validatePost(entry))
          .sort(([id1], [id2]) => id1.localeCompare(id2));
      } catch (error) {
        if (error instanceof Error) {
          throw new TypeError(`Cannot load chunk "${chunkName}" from "${this.dirPath}": ${error.message}`);
        }
      }
    }

    chunk = new Map(entries);

    this.chunkNames?.add(chunkName);
    this.chunks.set(chunkName, chunk);

    return chunk;
  }

  private async saveChunk(chunkName: string) {
    const chunkPosts = this.chunks.get(chunkName);
    const filename = `${this.dirPath}/${chunkName}.yml`;

    if (!chunkPosts) {
      return;
    }

    const data = Object.fromEntries(chunkPosts.entries());

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

  private async *yieldAllPosts(skipReferences?: boolean): AsyncGenerator<PostEntry<TPost>> {
    const chunkNames = await this.getChunkNames();

    for (const chunkName of chunkNames) {
      yield* this.yieldChunkPosts(chunkName, skipReferences);
    }
  }

  private async *yieldChunkPosts(chunkName: string, skipReferences?: boolean): AsyncGenerator<PostEntry<TPost>> {
    const chunk = await this.loadChunk(chunkName);

    for (const [key, value] of chunk) {
      if (typeof value === 'string') {
        if (!skipReferences) {
          const post = await this.getPost(value);
          if (!post) {
            throw new Error(`Post "${value}" not found`);
          }
          yield [key, post, value];
        }
      } else {
        yield [key, value];
      }
    }
  }
}
