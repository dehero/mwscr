import { listItems } from '../utils/common-utils.js';
import type { Post, PostEntry } from './post.js';

export type PostsManagerChunk<TPost> = Map<string, TPost | string>;

export abstract class PostsManager<TPost extends Post = Post> {
  abstract readonly title: string;
  abstract readonly getPostChunkName: (id: string) => string;

  abstract addPost: (id: string, post: Post | string) => Promise<void>;

  abstract getChunkNames: () => Promise<string[]>;

  abstract updatePost: (id: string) => Promise<void>;

  protected abstract loadChunk(chunkName: string): Promise<PostsManagerChunk<TPost>>;

  getPost = async (id: string): Promise<TPost | undefined> => {
    const chunkName = this.getPostChunkName(id);
    const chunk = await this.loadChunk(chunkName);
    const post = chunk.get(id);

    if (typeof post === 'string') {
      return this.getPost(post);
    }

    return post;
  };

  getAllPosts = (skipReferences?: boolean) => this.yieldAllPosts(skipReferences);

  getChunkPosts = (chunkName: string, skipReferences?: boolean) => this.yieldChunkPosts(chunkName, skipReferences);

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
