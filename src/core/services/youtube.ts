import type { InferOutput } from 'valibot';
import { nonEmpty, object, pipe, string } from 'valibot';
import type { Post } from '../entities/post.js';
import { Video } from '../entities/post-variant.js';
import { Publication } from '../entities/publication.js';
import type { PostingService } from '../entities/service.js';

export const YouTubePost = Video;

export const YouTubePublication = object({ ...Publication.entries, id: pipe(string(), nonEmpty()) });

export type YouTubePost = InferOutput<typeof YouTubePost>;
export type YouTubePublication = InferOutput<typeof YouTubePublication>;

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
