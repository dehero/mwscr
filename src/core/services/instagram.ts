import type { InferOutput } from 'valibot';
import { nonEmpty, object, pipe, string, variant } from 'valibot';
import type { Post } from '../entities/post.js';
import { RedrawingPost, ShotPost, ShotSetPost, WallpaperPost, WallpaperVPost } from '../entities/post-variation.js';
import { Publication } from '../entities/publication.js';
import { checkRules } from '../entities/rule.js';
import type { PostingService } from '../entities/service.js';

export const InstagramPost = variant('type', [ShotPost, ShotSetPost, RedrawingPost, WallpaperPost, WallpaperVPost]);

export const InstagramPublication = object({ ...Publication.entries, id: pipe(string(), nonEmpty()) });

export type InstagramPost = InferOutput<typeof InstagramPost>;
export type InstagramPublication = InferOutput<typeof InstagramPublication>;

export class Instagram implements PostingService<InstagramPublication> {
  readonly id = 'ig';
  readonly name = 'Instagram';

  isPost(publication: Publication): publication is InstagramPublication {
    return publication.service === this.id && typeof publication.id === 'string';
  }

  canPublishPost(post: Post, errors: string[] = []): post is InstagramPost {
    return checkRules([InstagramPost], post, errors);
  }

  getPublicationUrl(publication: Publication) {
    if (!this.isPost(publication)) {
      return;
    }
    return `https://instagram.com/p/${publication.id}/`;
  }

  getSubscriptionUrl(): string {
    return `https://instagram.com/mwscr/`;
  }

  getUserProfileUrl(profileId: string) {
    return `https://instagram.com/${profileId}/`;
  }
}

export const instagram = new Instagram();
