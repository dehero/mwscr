import type { Post } from '../entities/post.js';
import type { Publication } from '../entities/publication.js';
import { checkRules } from '../entities/rule.js';
import type { PostingService } from '../entities/service.js';
import { needCertainType, needContent, needTitle } from '../rules/post-rules.js';

export interface InstagramSuitablePost extends Post {
  title: string;
  content: string;
  type: 'shot';
}

export type InstagramPost = Publication<string>;

export class Instagram implements PostingService<InstagramPost> {
  readonly id = 'ig';
  readonly name = 'Instagram';

  isPost(publication: Publication<unknown>): publication is InstagramPost {
    return publication.service === this.id && typeof publication.id === 'string';
  }

  canPublishPost(post: Post, errors: string[] = []): post is InstagramSuitablePost {
    return checkRules([needCertainType('shot', 'wallpaper', 'wallpaper-v'), needTitle, needContent], post, errors);
  }

  getPublicationUrl(publication: Publication<unknown>) {
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
