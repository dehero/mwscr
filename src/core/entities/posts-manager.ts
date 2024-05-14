import { asArray } from '../utils/common-utils.js';
import { DataManager } from './data-manager.js';
import { isPostEqual, mergePostWith, type Post } from './post.js';

export type PostsManagerUsage = ReadonlyMap<string, number>;

export abstract class PostsManager<TPost extends Post = Post> extends DataManager<TPost> {
  // TODO: maybe remove isPostEqual and mergePostWith as separate functions

  protected isItemEqual = isPostEqual;

  protected mergeItemWith = mergePostWith;

  getUsedAuthors = async (): Promise<PostsManagerUsage> => {
    const usedAuthors = new Map<string, number>();

    for await (const [, post] of this.readAllEntries(true)) {
      asArray(post.author).forEach((author) => {
        usedAuthors.set(author, (usedAuthors.get(author) || 0) + 1);
      });
    }

    return usedAuthors;
  };

  getUsedLocations = async (): Promise<PostsManagerUsage> => {
    const usedLocations = new Map<string, number>();

    for await (const [, post] of this.readAllEntries(true)) {
      if (post.location) {
        usedLocations.set(post.location, (usedLocations.get(post.location) || 0) + 1);
      }
    }

    return usedLocations;
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
