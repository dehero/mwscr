import type { Post } from '../entities/post.js';
import type { Publication } from '../entities/publication.js';
import type { PostingService } from '../entities/service.js';

interface YouTubeSuitablePost extends Post {
  title: string;
  content: string;
  type: 'video';
}

export type YouTubePost = Publication<string>;

export class YouTube implements PostingService<YouTubePost> {
  readonly id = 'yt';
  readonly name = 'YouTube';

  isPost(publication: Publication<unknown>): publication is YouTubePost {
    return publication.service === this.id && typeof publication.id === 'string';
  }

  canPublishPost(_post: Post, _errors?: string[]): _post is YouTubeSuitablePost {
    return false;
  }

  getPublicationUrl(publication: Publication<unknown>, embed?: boolean) {
    if (!publication.id) {
      return;
    }
    if (embed) {
      return `https://www.youtube.com/embed/${publication.id}?rel=0`;
    }
    return `https://www.youtube.com/watch?v=${publication.id}`;
  }

  getSubscriptionUrl(): string {
    return `https://www.youtube.com/@mwscr?sub_confirmation=1`;
  }

  getUserProfileUrl(userId: string) {
    return `https://www.youtube.com/channel/${userId}`;
  }
}

export const youtube = new YouTube();
