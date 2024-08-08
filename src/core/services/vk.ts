import type { Post } from '../entities/post.js';
import { checkRules } from '../entities/rule.js';
import type { PostingService } from '../entities/service.js';
import type { ServicePost } from '../entities/service-post.js';
import { needCertainType, needContent, needTitleRu } from '../rules/post-rules.js';

interface VKSuitablePost extends Post {
  titleRu: string;
  content: string;
  type: 'shot';
}

export type VKPost = ServicePost<number>;

export const VK_GROUP_NAME = 'mwscr';
export const VK_GROUP_ID = -138249959;

export class VK implements PostingService<VKPost> {
  readonly id = 'vk';
  readonly name = 'VK';

  isPost(servicePost: ServicePost<unknown>): servicePost is VKPost {
    return servicePost.service === this.id && typeof servicePost.id === 'number';
  }

  canPublishPost(post: Post): post is VKSuitablePost {
    return checkRules([needCertainType('shot', 'wallpaper', 'wallpaper-v'), needContent, needTitleRu], post);
  }

  getServicePostUrl(servicePost: ServicePost<unknown>) {
    if (!this.isPost(servicePost)) {
      return;
    }
    return `https://vk.com/${VK_GROUP_NAME}?w=wall${VK_GROUP_ID}_${servicePost.id}`;
  }

  getUserProfileUrl(profileId: string) {
    return `https://vk.com/${profileId}`;
  }
}

export const vk = new VK();
