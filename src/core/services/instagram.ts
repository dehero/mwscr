import type { InferOutput } from 'valibot';
import { intersect, nonEmpty, object, pipe, string, variant } from 'valibot';
import { Post, PostTitle } from '../entities/post.js';
import {
  Achievement,
  Compilation,
  Mention,
  News,
  Outtakes,
  Photoshop,
  Redrawing,
  Shot,
  Wallpaper,
} from '../entities/post-variant.js';
import { Publication } from '../entities/publication.js';
import { checkSchema } from '../entities/schema.js';
import type { PostingService } from '../entities/service.js';

export const INSTAGRAM_HIGHLIGHTS_ALBUM_ID = 'aGlnaGxpZ2h0OjE3OTkzNTcwNTM3Mzg1MTA3';
export const INSTAGRAM_ACCOUNT_ID = '4170501247';
export const INSTAGRAM_USERNAME = 'mwscr';

export const InstagramPost = intersect([
  object({ ...Post.entries, title: PostTitle }),
  variant('type', [Redrawing, Shot, Compilation, Wallpaper, Outtakes, News, Photoshop, Mention, Achievement]),
]);

export const InstagramPublication = object({ ...Publication.entries, id: pipe(string(), nonEmpty()) });

export type InstagramPost = InferOutput<typeof InstagramPost>;
export type InstagramPublication = InferOutput<typeof InstagramPublication>;

export class Instagram implements PostingService<InstagramPublication> {
  readonly id = 'ig';
  readonly name = 'Instagram';

  isPublication(publication: Publication): publication is InstagramPublication {
    return (
      publication.service === this.id &&
      (typeof publication.id === 'string' || (publication.type === 'story' && typeof publication.mediaId === 'string'))
    );
  }

  canPublishPost(post: Post, errors: string[] = []): post is InstagramPost {
    return checkSchema(InstagramPost, post, errors);
  }

  getPublicationUrl(publication: Publication) {
    if (!this.isPublication(publication)) {
      return;
    }
    if (publication.type === 'story') {
      return `https://instagram.com/s/${INSTAGRAM_HIGHLIGHTS_ALBUM_ID}?story_media_id=${publication.mediaId}_${INSTAGRAM_ACCOUNT_ID}`;
    }

    return `https://instagram.com/p/${publication.id}/`;
  }

  getSubscriptionUrl(): string {
    return this.getUserProfileUrl(INSTAGRAM_USERNAME);
  }

  getUserProfileUrl(profileId: string) {
    return `https://instagram.com/${profileId}/`;
  }
}

export const instagram = new Instagram();
