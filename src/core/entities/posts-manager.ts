import type { InferOutput } from 'valibot';
import { intersect, notValue, object, picklist, pipe, union } from 'valibot';
import { asArray, getRevisionHash, textToId } from '../utils/common-utils.js';
import { dateToString } from '../utils/date-utils.js';
import type { ListReaderStats } from './list-manager.js';
import { ListManager, ListManagerPatch } from './list-manager.js';
import {
  comparePostEntriesByDate,
  getPostDateById,
  getPostDrawer,
  getPostEntryStats,
  getPostFirstPublished,
  getPostRating,
  mergePostWith,
  Post,
  PostAuthor,
  PostContent,
  postMarkDescriptors,
  PostRequest,
  PostTitle,
  PostTitleRu,
  PostType,
  PostViolation,
} from './post.js';
import type { PostAction } from './post-action.js';
import { PostVariant } from './post-variant.js';
import { getRecentPublications } from './publication.js';
import type { Schema } from './schema.js';
import { checkSchema, safeParseSchema } from './schema.js';

export const ViolatingProposal = object({
  ...Post.entries,
  violation: PostViolation,
  type: pipe(PostType, notValue('outtakes')),
});
export const RejectedProposal = object({
  ...Post.entries,
  mark: picklist(['D', 'F']),
  type: pipe(PostType, notValue('outtakes')),
});
export const DraftProposal = object({ ...Post.entries, content: PostContent, author: PostAuthor });
export const RequestProposal = object({ ...Post.entries, request: PostRequest });

export const TrashItem = union([ViolatingProposal, RejectedProposal]);
export const InboxItem = union([DraftProposal, RequestProposal]);
export const TrashOrInboxItem = union([TrashItem, InboxItem]);

export const PublishablePost = intersect([
  object({
    ...Post.entries,
    title: PostTitle,
    titleRu: PostTitleRu,
    author: PostAuthor,
    content: PostContent,
    mark: picklist(['A1', 'A2', 'B1', 'B2', 'C', 'E']),
  }),
  PostVariant,
]);

export type ViolatingProposal = InferOutput<typeof ViolatingProposal>;
export type RejectedProposal = InferOutput<typeof RejectedProposal>;
export type DraftProposal = InferOutput<typeof DraftProposal>;
export type RequestProposal = InferOutput<typeof RequestProposal>;

export type TrashItem = InferOutput<typeof TrashItem>;
export type InboxItem = InferOutput<typeof InboxItem>;
export type TrashOrInboxItem = InferOutput<typeof TrashOrInboxItem>;
export type PublishablePost = InferOutput<typeof PublishablePost>;

export const PostsManagerName = picklist(['posts', 'extras', 'inbox', 'trash']);
export type PostsManagerName = InferOutput<typeof PostsManagerName>;

export const PostsManagerPatch = ListManagerPatch<Post>(Post);
export type PostsManagerPatch = InferOutput<typeof PostsManagerPatch>;

export interface PostsManagerDescriptor {
  title: string;
  label: string;
  actions: PostAction[];
}

export const postsManagerDescriptors = Object.freeze<Record<PostsManagerName, PostsManagerDescriptor>>({
  posts: { title: 'Posts', label: 'posted', actions: ['locate', 'precise'] },
  extras: { title: 'Extras', label: 'extras', actions: ['precise'] },
  inbox: { title: 'Inbox', label: 'pending', actions: ['edit', 'merge'] },
  trash: { title: 'Trash', label: 'rejected', actions: ['edit', 'merge'] },
});

export function isTrashItem(post: Post, errors?: string[]): post is TrashItem {
  return checkSchema(TrashItem, post, errors);
}

export function isPublishablePost(post: Post, errors?: string[]): post is PublishablePost {
  return checkSchema(PublishablePost, post, errors);
}

export function getPublishedPostChunkName(id: string) {
  const chunkName = id.slice(0, 4);

  if (!chunkName) {
    throw new Error(`Cannot get year from post id: ${id}`);
  }
  return chunkName;
}

export function getProposedPostChunkName(id: string) {
  return id.split('.')[1]?.split('-')[0] ?? new Date().getFullYear().toString();
}

export function createNewPostId(post: PublishablePost, index?: number) {
  const created = getPostFirstPublished(post) ?? new Date();
  const dateStr = dateToString(created);
  const name = textToId(post.title);

  return [dateStr, index, name].filter((item) => Boolean(item)).join('-');
}

export function createRepostId(post: PublishablePost) {
  return createNewPostId({ ...post, posts: undefined });
}

export function createInboxItemId(creator: string | string[], date: Date, title: string, hash?: string): string {
  const firstCreator = asArray(creator)[0];
  return `${firstCreator}.${dateToString(date)}-${textToId(title)}${hash ? `-${hash}` : ''}`;
}

export function createRequestProposalId(request: RequestProposal) {
  const hash = getRevisionHash(request.request.text);

  return createInboxItemId(request.request.user, request.request.date, hash);
}

export function createPostPath(managerName: PostsManagerName, id: string) {
  return `${managerName}/${id}`;
}

export function parsePostPath(path: string): { managerName?: PostsManagerName; id?: string } {
  const parts = path.split('/').filter(Boolean);
  const managerName = safeParseSchema(PostsManagerName, parts[0]);
  const id = parts[1];

  return { managerName, id };
}

export abstract class PostsManager<TPost extends Post = Post> extends ListManager<TPost> {
  abstract readonly name: PostsManagerName;

  readonly ItemSchema: Schema<TPost> = Post as Schema<TPost>;

  protected mergeItemWith = mergePostWith;

  get descriptor(): PostsManagerDescriptor {
    return postsManagerDescriptors[this.name];
  }

  async getAuthorsStats(): Promise<{ likes: ListReaderStats; views: ListReaderStats; engagement: ListReaderStats }> {
    return this.createCache(this.getAuthorsStats.name, async () => {
      const likes = new Map<string, number>();
      const views = new Map<string, number>();
      const groupedEngagement = new Map<string, number[]>();

      for await (const entry of this.readAllEntries()) {
        const stats = getPostEntryStats(entry);

        if (!entry[2])
          asArray(entry[1].author).forEach((author) => {
            likes.set(author, (likes.get(author) || 0) + stats.likes);
            views.set(author, (views.get(author) || 0) + stats.views);
            if (stats.engagement) {
              groupedEngagement.set(author, [...(groupedEngagement.get(author) ?? []), stats.engagement]);
            }
          });
      }

      const engagement = new Map(
        [...groupedEngagement].map(([author, engagements]) => [
          author,
          engagements.reduce((a, b) => a + b, 0) / engagements.length,
        ]),
      );

      return { likes, views, engagement };
    });
  }

  async getAuthorsLikesStats(): Promise<ListReaderStats> {
    return (await this.getAuthorsStats()).likes;
  }

  async getAuthorsViewsStats(): Promise<ListReaderStats> {
    return (await this.getAuthorsStats()).views;
  }

  async getAuthorsEngagementStats(): Promise<ListReaderStats> {
    return (await this.getAuthorsStats()).engagement;
  }

  async getAuthorsMarkScoreStats(): Promise<ListReaderStats> {
    return this.createCache(this.getAuthorsMarkScoreStats.name, async () => {
      const map = new Map<string, number[]>();

      for await (const [, post] of this.readAllEntries(true)) {
        const mark = post.mark;
        if (!mark) {
          continue;
        }
        const score = postMarkDescriptors[mark].score;
        asArray(post.author).forEach((author) => {
          map.set(author, [...(map.get(author) ?? []), score]);
        });
      }

      return new Map([...map].map(([author, scores]) => [author, scores.reduce((a, b) => a + b, 0) / scores.length]));
    });
  }

  async getAuthorsRatingStats(): Promise<ListReaderStats> {
    return this.createCache(this.getAuthorsRatingStats.name, async () => {
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
    return this.createCache(this.getAuthorsUsageStats.name, async () => {
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
    return this.createCache(this.getDrawersUsageStats.name, async () => {
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
    return this.createCache(this.getLocationsUsageStats.name, async () => {
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
    return this.createCache(this.getRequesterUsageStats.name, async () => {
      const stats = new Map<string, number>();

      for await (const [, post] of this.readAllEntries(true)) {
        if (post.request?.user) {
          stats.set(post.request.user, (stats.get(post.request.user) || 0) + 1);
        }
      }

      return stats;
    });
  }

  async getFollowersCountStats(): Promise<ListReaderStats> {
    return this.createCache(this.getFollowersCountStats.name, async () => {
      const lastStats = new Map<string, number>();
      const stats = new Map<string, number>();
      const entries = (await this.getAllEntries()).sort(comparePostEntriesByDate('asc'));

      for await (const [id, post] of entries) {
        const date = getPostDateById(id);
        if (date && post.posts) {
          const publications = getRecentPublications(post.posts, date);

          for (const publication of publications) {
            if (publication.followers) {
              lastStats.set(publication.service, publication.followers);
            }
          }
        }

        stats.set(
          id,
          [...lastStats.values()].reduce((a, b) => a + b, 0),
        );
      }

      return stats;
    });
  }

  async getTagsUsageStats(): Promise<ListReaderStats> {
    return this.createCache(this.getTagsUsageStats.name, async () => {
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
