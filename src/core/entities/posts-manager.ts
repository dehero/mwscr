import { asArray } from '../utils/common-utils.js';
import { DataManager } from './data-manager.js';
import { isPostEqual, mergePostWith, type Post } from './post.js';

export type PostsManagerUsage = ReadonlyMap<string, number>;

export abstract class PostsManager<TPost extends Post = Post> extends DataManager<TPost> {
  // TODO: maybe remove isPostEqual and mergePostWith as separate functions

  protected isItemEqual = isPostEqual;

  protected mergeItemWith = mergePostWith;

  getUsedAuthorIds = async (): Promise<PostsManagerUsage> => {
    const usedAuthorIds = new Map<string, number>();

    for await (const [, post] of this.readAllEntries(true)) {
      asArray(post.author).forEach((author) => {
        usedAuthorIds.set(author, (usedAuthorIds.get(author) || 0) + 1);
      });
    }

    return usedAuthorIds;
  };

  getUsedLocationIds = async (): Promise<PostsManagerUsage> => {
    const usedLocationIds = new Map<string, number>();

    for await (const [, post] of this.readAllEntries(true)) {
      if (post.location) {
        usedLocationIds.set(post.location, (usedLocationIds.get(post.location) || 0) + 1);
      }
    }

    return usedLocationIds;
  };

  getUsedTags = async (): Promise<PostsManagerUsage> => {
    const usedTags = new Map<string, number>();

    for await (const [, post] of this.readAllEntries(true)) {
      post.tags?.forEach((tag) => {
        usedTags.set(tag, (usedTags.get(tag) || 0) + 1);
      });
    }

    return usedTags;
  };
}
