import { z } from 'zod';
import { Post, PostContent, PostTitle, PostType } from '../entities/post.js';
import { Publication } from '../entities/publication.js';
import type { PostingService } from '../entities/service.js';

export const YouTubePost = Post.extend({
  title: PostTitle,
  content: PostContent,
  type: PostType.extract(['video']),
});

export const YouTubePublication = Publication.extend({
  id: z.string().nonempty(),
});

export type YouTubePost = z.infer<typeof YouTubePost>;
export type YouTubePublication = z.infer<typeof YouTubePublication>;

export class YouTube implements PostingService<YouTubePublication> {
  readonly id = 'yt';
  readonly name = 'YouTube';

  isPost(publication: Publication): publication is YouTubePublication {
    return publication.service === this.id && typeof publication.id === 'string';
  }

  canPublishPost(_post: Post, _errors?: string[]): _post is YouTubePost {
    return false;
  }

  getPublicationUrl(publication: Publication, embed?: boolean) {
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
