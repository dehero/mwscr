import type { Post } from './post.js';
import type { ServicePost } from './service-post.js';

export interface Service {
  id: string;
  name: string;

  getUserProfileUrl: (userId: string) => string | undefined;
}

export interface PostingService extends Service {
  connect: () => Promise<unknown>;

  disconnect: () => Promise<void>;

  grabFollowerCount: () => Promise<number | undefined>;

  grabPosts: (afterServicePost?: ServicePost<unknown>) => Promise<Post[]>;

  getServicePostUrl: (servicePost: ServicePost<unknown>) => string | undefined;

  canPublishPost: (post: Post, errors?: string[]) => boolean;

  publishPost: (post: Post) => Promise<void>;

  updateServicePost: (servicePost: ServicePost<unknown>) => Promise<void>;
}
