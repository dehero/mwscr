import type { Post, PostEntry } from './post.js';
import type { Publication } from './publication.js';

export interface ServiceMessagingOptions {
  subject?: string;
  body?: string;
}

export interface Service {
  id: string;
  name: string;
  donationName?: string;
  origin?: string;

  getDonationUrl?: () => string;

  getPostUrl?: (postId: string) => string | undefined;

  getUserMessagingUrl?: (userId: string, options?: ServiceMessagingOptions) => string | undefined;

  getUserProfileUrl: (userId: string) => string | undefined;
}

export interface PostingService<TPublication extends Publication<unknown> = Publication<unknown>> extends Service {
  isPost(publication: Publication<unknown>): publication is TPublication;

  getSubscriptionUrl(): string;

  getPublicationUrl: (publication: Publication<unknown>, embed?: boolean) => string | undefined;

  canPublishPost: (post: Post, errors?: string[]) => boolean;
}

export interface PostingServiceManager<TPublication extends Publication<unknown> = Publication<unknown>>
  extends PostingService<TPublication> {
  connect: () => Promise<unknown>;

  disconnect: () => Promise<void>;

  grabFollowerCount: () => Promise<number | undefined>;

  grabPosts: (afterPublication?: Publication<unknown>) => Promise<Post[]>;

  publishPostEntry: (entry: PostEntry) => Promise<void>;

  updatePublication: (publication: Publication<unknown>) => Promise<void>;
}
