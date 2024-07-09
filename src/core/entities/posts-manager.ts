import { asArray } from '../utils/common-utils.js';
import { DataManager } from './data-manager.js';
import { getPostDrawer, getPostTotalLikes, isPostEqual, mergePostWith, type Post } from './post.js';

export type PostsManagerUsage = ReadonlyMap<string, number>;

export abstract class PostsManager<TPost extends Post = Post> extends DataManager<TPost> {
  // TODO: maybe remove isPostEqual and mergePostWith as separate functions

  protected isItemEqual = isPostEqual;

  protected mergeItemWith = mergePostWith;

  async getLikedAuthorIds(): Promise<PostsManagerUsage> {
    const likedAuthorIds = new Map<string, number>();

    for await (const [, post] of this.readAllEntries(true)) {
      const likes = getPostTotalLikes(post);
      asArray(post.author).forEach((author) => {
        likedAuthorIds.set(author, (likedAuthorIds.get(author) || 0) + likes);
      });
    }

    return likedAuthorIds;
  }

  async getUsedAuthorIds(): Promise<PostsManagerUsage> {
    const usedAuthorIds = new Map<string, number>();

    for await (const [, post] of this.readAllEntries(true)) {
      asArray(post.author).forEach((author) => {
        usedAuthorIds.set(author, (usedAuthorIds.get(author) || 0) + 1);
      });
    }

    return usedAuthorIds;
  }

  async getUsedDrawerIds(): Promise<PostsManagerUsage> {
    const usedDrawerIds = new Map<string, number>();

    for await (const [, post] of this.readAllEntries(true)) {
      const drawer = getPostDrawer(post);
      if (drawer) {
        usedDrawerIds.set(drawer, (usedDrawerIds.get(drawer) || 0) + 1);
      }
    }

    return usedDrawerIds;
  }

  async getUsedLocationIds(): Promise<PostsManagerUsage> {
    const usedLocationIds = new Map<string, number>();

    for await (const [, post] of this.readAllEntries(true)) {
      if (post.location) {
        usedLocationIds.set(post.location, (usedLocationIds.get(post.location) || 0) + 1);
      }
    }

    return usedLocationIds;
  }

  async getUsedRequesterIds(): Promise<PostsManagerUsage> {
    const usedAuthorIds = new Map<string, number>();

    for await (const [, post] of this.readAllEntries(true)) {
      if (post.request?.user) {
        usedAuthorIds.set(post.request.user, (usedAuthorIds.get(post.request.user) || 0) + 1);
      }
    }

    return usedAuthorIds;
  }

  async getUsedTags(): Promise<PostsManagerUsage> {
    const usedTags = new Map<string, number>();

    for await (const [, post] of this.readAllEntries(true)) {
      post.tags?.forEach((tag) => {
        usedTags.set(tag, (usedTags.get(tag) || 0) + 1);
      });
    }

    return usedTags;
  }
}
