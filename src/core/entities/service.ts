import type { Post } from './post.js';
import type { ServicePost } from './service-post.js';

export interface Service {
  id: string;
  name: string;

  getUserProfileUrl: (userId: string) => string | undefined;
}

export interface PostingService<TServicePost extends ServicePost<unknown> = ServicePost<unknown>> extends Service {
  isPost(servicePost: ServicePost<unknown>): servicePost is TServicePost;

  getServicePostUrl: (servicePost: ServicePost<unknown>, embed?: boolean) => string | undefined;

  canPublishPost: (post: Post, errors?: string[]) => boolean;
}

export interface PostingServiceManager<TServicePost extends ServicePost<unknown> = ServicePost<unknown>>
  extends PostingService<TServicePost> {
  connect: () => Promise<unknown>;

  disconnect: () => Promise<void>;

  grabFollowerCount: () => Promise<number | undefined>;

  grabPosts: (afterServicePost?: ServicePost<unknown>) => Promise<Post[]>;

  publishPost: (post: Post) => Promise<void>;

  updateServicePost: (servicePost: ServicePost<unknown>) => Promise<void>;
}
