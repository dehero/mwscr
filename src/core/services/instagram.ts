import type { Post } from '../entities/post.js';
import { checkRules } from '../entities/rule.js';
import type { PostingService } from '../entities/service.js';
import type { ServicePost } from '../entities/service-post.js';
import { needCertainType, needContent, needTitle } from '../rules/post-rules.js';

export interface InstagramSuitablePost extends Post {
  title: string;
  content: string;
  type: 'shot';
}

export type InstagramPost = ServicePost<string>;

export class Instagram implements PostingService<InstagramPost> {
  readonly id = 'ig';
  readonly name = 'Instagram';

  isPost(servicePost: ServicePost<unknown>): servicePost is InstagramPost {
    return servicePost.service === this.id && typeof servicePost.id === 'string';
  }

  canPublishPost(post: Post, errors: string[] = []): post is InstagramSuitablePost {
    return checkRules([needCertainType('shot', 'wallpaper', 'wallpaper-v'), needTitle, needContent], post, errors);
  }

  getServicePostUrl(servicePost: ServicePost<unknown>) {
    if (!this.isPost(servicePost)) {
      return;
    }
    return `https://instagram.com/p/${servicePost.id}/`;
  }

  getUserProfileUrl(profileId: string) {
    return `https://instagram.com/p/${profileId}/`;
  }
}

export const instagram = new Instagram();
