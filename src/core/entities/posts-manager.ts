import { asArray } from '../utils/common-utils.js';
import { ListManager } from './list-manager.js';
import type { Post } from './post.js';
import {
  getPostDrawer,
  getPostEntryEngagement,
  getPostEntryLikes,
  getPostEntryViews,
  getPostMarkScore,
  getPostRating,
  isPostEqual,
  mergePostWith,
} from './post.js';

export type PostsManagerStats = ReadonlyMap<string, number>;

export abstract class PostsManager<TPost extends Post = Post> extends ListManager<TPost> {
  // TODO: maybe remove isPostEqual and mergePostWith as separate functions

  protected isItemEqual = isPostEqual;

  protected mergeItemWith = mergePostWith;

  async getAuthorsLikesStats(): Promise<PostsManagerStats> {
    const stats = new Map<string, number>();

    for await (const entry of this.readAllEntries()) {
      const likes = getPostEntryLikes(entry);
      asArray(entry[1].author).forEach((author) => {
        stats.set(author, (stats.get(author) || 0) + likes);
      });
    }

    return stats;
  }

  async getAuthorsViewsStats(): Promise<PostsManagerStats> {
    const stats = new Map<string, number>();

    for await (const entry of this.readAllEntries()) {
      const views = getPostEntryViews(entry);
      asArray(entry[1].author).forEach((author) => {
        stats.set(author, (stats.get(author) || 0) + views);
      });
    }

    return stats;
  }

  async getAuthorsEngagementStats(): Promise<PostsManagerStats> {
    const map = new Map<string, number[]>();

    for await (const entry of this.readAllEntries(true)) {
      const engagement = getPostEntryEngagement(entry);
      if (!engagement) {
        continue;
      }
      asArray(entry[1].author).forEach((author) => {
        map.set(author, [...(map.get(author) ?? []), engagement]);
      });
    }

    return new Map(
      [...map].map(([author, engagements]) => [author, engagements.reduce((a, b) => a + b, 0) / engagements.length]),
    );
  }

  async getAuthorsMarkScoreStats(): Promise<PostsManagerStats> {
    const map = new Map<string, number[]>();

    for await (const [, post] of this.readAllEntries(true)) {
      const mark = post.mark;
      if (!mark) {
        continue;
      }
      const score = getPostMarkScore(mark);
      if (typeof score === 'undefined') {
        continue;
      }
      asArray(post.author).forEach((author) => {
        map.set(author, [...(map.get(author) ?? []), score]);
      });
    }

    return new Map([...map].map(([author, scores]) => [author, scores.reduce((a, b) => a + b, 0) / scores.length]));
  }

  async getAuthorsRatingStats(): Promise<PostsManagerStats> {
    const ratings = new Map<string, number[]>();

    for await (const [, post] of this.readAllEntries(true)) {
      const rating = getPostRating(post);
      if (!rating) {
        continue;
      }
      asArray(post.author).forEach((author) => {
        ratings.set(author, [...(ratings.get(author) ?? []), rating]);
      });
    }

    return new Map(
      [...ratings].map(([author, ratings]) => [author, ratings.reduce((a, b) => a + b, 0) / ratings.length]),
    );
  }

  async getAuthorsUsageStats(): Promise<PostsManagerStats> {
    const stats = new Map<string, number>();

    for await (const [, post] of this.readAllEntries(true)) {
      asArray(post.author).forEach((author) => {
        stats.set(author, (stats.get(author) || 0) + 1);
      });
    }

    return stats;
  }

  async getDrawersUsageStats(): Promise<PostsManagerStats> {
    const stats = new Map<string, number>();

    for await (const [, post] of this.readAllEntries(true)) {
      const drawer = getPostDrawer(post);
      if (drawer) {
        stats.set(drawer, (stats.get(drawer) || 0) + 1);
      }
    }

    return stats;
  }

  async getLocationsUsageStats(): Promise<PostsManagerStats> {
    const stats = new Map<string, number>();

    for await (const [, post] of this.readAllEntries(true)) {
      if (post.location) {
        stats.set(post.location, (stats.get(post.location) || 0) + 1);
      }
    }

    return stats;
  }

  async getRequesterUsageStats(): Promise<PostsManagerStats> {
    const stats = new Map<string, number>();

    for await (const [, post] of this.readAllEntries(true)) {
      if (post.request?.user) {
        stats.set(post.request.user, (stats.get(post.request.user) || 0) + 1);
      }
    }

    return stats;
  }

  async getTagsUsageStats(): Promise<PostsManagerStats> {
    const stats = new Map<string, number>();

    for await (const [, post] of this.readAllEntries(true)) {
      post.tags?.forEach((tag) => {
        stats.set(tag, (stats.get(tag) || 0) + 1);
      });
    }

    return stats;
  }
}
