import { z } from 'zod';
import { Post, PostContent, PostTitle, PostType } from '../entities/post.js';
import { Publication } from '../entities/publication.js';
import { checkRules } from '../entities/rule.js';
import type { PostingService } from '../entities/service.js';

export const InstagramPost = Post.extend({
  title: PostTitle,
  content: PostContent,
  type: PostType.extract(['shot', 'wallpaper', 'wallpaper-v', 'redrawing', 'shot-set']),
});

export const InstagramPublication = Publication.extend({
  id: z.string().nonempty(),
});

export type InstagramPost = z.infer<typeof InstagramPost>;
export type InstagramPublication = z.infer<typeof InstagramPublication>;

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
