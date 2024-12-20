import { asArray } from '../utils/common-utils.js';
import type { ListReaderStats } from './list-manager.js';
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
import type { PostAction } from './post-action.js';

export interface PostsManagerInfo {
  name: string;
  title: string;
  label: string;
  actions: PostAction[];
}

export const POSTS_MANAGER_INFOS = [
  { name: 'posts', title: 'Posts', label: 'posted', actions: ['locate'] },
  { name: 'inbox', title: 'Inbox', label: 'pending', actions: ['locate', 'edit', 'review', 'merge'] },
  { name: 'trash', title: 'Trash', label: 'rejected', actions: ['locate', 'edit', 'review', 'merge'] },
] as const satisfies PostsManagerInfo[];

export type PostsManagerName = (typeof POSTS_MANAGER_INFOS)[number]['name'];

export abstract class PostsManager<TPost extends Post = Post> extends ListManager<TPost> {
  abstract readonly name: PostsManagerName;

  // TODO: maybe remove isPostEqual and mergePostWith as separate functions

  protected isItemEqual = isPostEqual;

  protected mergeItemWith = mergePostWith;

  async getAuthorsLikesStats(): Promise<ListReaderStats> {
    return this.createStatsCache(this.getAuthorsLikesStats.name, async () => {
      const stats = new Map<string, number>();

      for await (const entry of this.readAllEntries()) {
        const likes = getPostEntryLikes(entry);
        asArray(entry[1].author).forEach((author) => {
          stats.set(author, (stats.get(author) || 0) + likes);
        });
      }

      return stats;
    });
  }

  async getAuthorsViewsStats(): Promise<ListReaderStats> {
    return this.createStatsCache(this.getAuthorsViewsStats.name, async () => {
      const stats = new Map<string, number>();

      for await (const entry of this.readAllEntries()) {
        const views = getPostEntryViews(entry);
        asArray(entry[1].author).forEach((author) => {
          stats.set(author, (stats.get(author) || 0) + views);
        });
      }

      return stats;
    });
  }

  async getAuthorsEngagementStats(): Promise<ListReaderStats> {
    return this.createStatsCache(this.getAuthorsEngagementStats.name, async () => {
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
    });
  }

  async getAuthorsMarkScoreStats(): Promise<ListReaderStats> {
    return this.createStatsCache(this.getAuthorsMarkScoreStats.name, async () => {
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
    });
  }

  async getAuthorsRatingStats(): Promise<ListReaderStats> {
    return this.createStatsCache(this.getAuthorsRatingStats.name, async () => {
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
    });
  }

  async getAuthorsUsageStats(): Promise<ListReaderStats> {
    return this.createStatsCache(this.getAuthorsUsageStats.name, async () => {
      const stats = new Map<string, number>();

      for await (const [, post] of this.readAllEntries(true)) {
        asArray(post.author).forEach((author) => {
          stats.set(author, (stats.get(author) || 0) + 1);
        });
      }

      return stats;
    });
  }

  async getDrawersUsageStats(): Promise<ListReaderStats> {
    return this.createStatsCache(this.getDrawersUsageStats.name, async () => {
      const stats = new Map<string, number>();

      for await (const [, post] of this.readAllEntries(true)) {
        const drawer = getPostDrawer(post);
        if (drawer) {
          stats.set(drawer, (stats.get(drawer) || 0) + 1);
        }
      }

      return stats;
    });
  }

  async getLocationsUsageStats(): Promise<ListReaderStats> {
    return this.createStatsCache(this.getLocationsUsageStats.name, async () => {
      const stats = new Map<string, number>();

      for await (const [, post] of this.readAllEntries(true)) {
        asArray(post.location).forEach((location) => {
          stats.set(location, (stats.get(location) || 0) + 1);
        });
      }

      return stats;
    });
  }

  async getRequesterUsageStats(): Promise<ListReaderStats> {
    return this.createStatsCache(this.getRequesterUsageStats.name, async () => {
      const stats = new Map<string, number>();

      for await (const [, post] of this.readAllEntries(true)) {
        if (post.request?.user) {
          stats.set(post.request.user, (stats.get(post.request.user) || 0) + 1);
        }
      }

      return stats;
    });
  }

  async getTagsUsageStats(): Promise<ListReaderStats> {
    return this.createStatsCache(this.getTagsUsageStats.name, async () => {
      const stats = new Map<string, number>();

      for await (const [, post] of this.readAllEntries(true)) {
        post.tags?.forEach((tag) => {
          stats.set(tag, (stats.get(tag) || 0) + 1);
        });
      }

      return stats;
    });
  }
}
