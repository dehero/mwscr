import type { Post, PostEntry } from './post.js';
import type { Publication } from './publication.js';
import type { UserProfile } from './user.js';

export interface ServiceMessagingOptions {
  subject?: string;
  body?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  sponsorshipName?: string;
  origin?: string;
  merchOnly?: boolean;

  getSponsorshipUrl?: () => string;

  getPostUrl?: (postId: string, managerName: string) => string | undefined;

  getUserMessagingUrl?: (userId: string, options?: ServiceMessagingOptions) => string | undefined;

  getUserProfileUrl: (username: string) => string | undefined;
}

export interface PostingService<TPublication extends Publication = Publication> extends Service {
  isPublication(publication: Publication): publication is TPublication;

  getSubscriptionUrl(): string;

  getPublicationUrl: (publication: Publication, embed?: boolean) => string | undefined;

  canPublishPost: (post: Post, errors?: string[]) => boolean;
}

export interface PostingServiceManager<TPublication extends Publication = Publication>
  extends PostingService<TPublication> {
  postingStartDate?: Date;

  connect: () => Promise<unknown>;

  disconnect: () => Promise<void>;

  grabFollowerCount: () => Promise<number | undefined>;

  grabPosts: (afterPublication?: Publication) => Promise<Post[]>;

  publishPostEntry: (entry: PostEntry) => Promise<void>;

  updatePublication: (publication: Publication) => Promise<void>;

  updateUserProfile: (profile: UserProfile) => Promise<void>;
}
