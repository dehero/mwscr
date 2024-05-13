import type { Post } from '../entities/post.js';
import type { PostingService } from '../entities/service.js';
import type { ServicePost } from '../entities/service-post.js';

interface YouTubeSuitablePost extends Post {
  title: string;
  content: string;
  type: 'video';
}

export type YouTubePost = ServicePost<string>;

export class YouTube implements PostingService<YouTubePost> {
  readonly id = 'yt';
  readonly name = 'YouTube';

  isPost(servicePost: ServicePost<unknown>): servicePost is YouTubePost {
    return servicePost.service === this.id && typeof servicePost.id === 'string';
  }

  canPublishPost(_post: Post, _errors?: string[]): _post is YouTubeSuitablePost {
    return false;
  }

  getServicePostUrl(servicePost: ServicePost<unknown>) {
    if (!servicePost.id) {
      return;
    }
    return `https://www.youtube.com/watch?v=${servicePost.id}`;
  }

  getUserProfileUrl(userId: string) {
    return `https://www.youtube.com/channel/${userId}`;
  }
}

export const youtube = new YouTube();
