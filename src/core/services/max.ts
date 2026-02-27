import type { InferOutput } from 'valibot';
import { intersect, object, string, variant } from 'valibot';
import { Post, PostTitleRu } from '../entities/post.js';
import { Shot, VerticalWallpaper, Wallpaper } from '../entities/post-variant.js';
import { Publication } from '../entities/publication.js';
import { checkSchema } from '../entities/schema.js';
import type { PostingService } from '../entities/service.js';

export const MAX_CHAT_ID = -70980943197599;

export const MAXPost = intersect([
  object({ ...Post.entries, titleRu: PostTitleRu }),
  variant('type', [Shot, VerticalWallpaper, Wallpaper]),
]);

export const MAXPublication = object({
  ...Publication.entries,
  id: string(),
});

export type MAXPost = InferOutput<typeof MAXPost>;
export type MAXPublication = InferOutput<typeof MAXPublication>;

export class MAX implements PostingService<MAXPublication> {
  readonly id = 'mx';
  readonly name = 'MAX';
  readonly origin = 'https://max.ru';

  isPublication(publication: Publication): publication is MAXPublication {
    return checkSchema(MAXPublication, publication) && publication.service === this.id;
  }

  canPublishPost(post: Post, errors: string[] = []): post is MAXPost {
    return checkSchema(MAXPost, post, errors);
  }

  getPublicationUrl(publication: Publication) {
    if (!this.isPublication(publication)) {
      return;
    }

    // TODO: return `${this.origin}/c/${MAX_CHAT_ID}/<SHORTCODE>`;
    return `${this.origin}/c/${MAX_CHAT_ID}`;
  }

  getSubscriptionUrl(): string {
    return 'https://max.ru/join/-R4KQ7nJ2kzftusRbm5LAMU0tBAS-8w_mCg2NpxiDQc';
  }

  getUserProfileUrl(profileId: string) {
    return `${this.origin}/${profileId}`;
  }
}

export const max = new MAX();
