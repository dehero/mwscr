import type { Post } from '../entities/post.js';
import type { Publication } from '../entities/publication.js';
import { checkRules } from '../entities/rule.js';
import type { PostingService } from '../entities/service.js';
import { needCertainType, needContent, needTitleRu } from '../rules/post-rules.js';

interface VKSuitablePost extends Post {
  titleRu: string;
  content: string;
  type: 'shot';
}

export type VKPost = Publication<number>;

export const VK_GROUP_NAME = 'mwscr';
export const VK_GROUP_ID = -138249959;

export class VK implements PostingService<VKPost> {
  readonly id = 'vk';
  readonly name = 'VK';

  isPost(publication: Publication<unknown>): publication is VKPost {
    return publication.service === this.id && typeof publication.id === 'number';
  }

  canPublishPost(post: Post): post is VKSuitablePost {
    return checkRules([needCertainType('shot', 'wallpaper', 'wallpaper-v'), needContent, needTitleRu], post);
  }

  getDonationUrl() {
    return `https://vk.com/donut/${VK_GROUP_NAME}`;
  }

  getPublicationUrl(publication: Publication<unknown>) {
    if (!this.isPost(publication)) {
      return;
    }
    return `https://vk.com/${VK_GROUP_NAME}?w=wall${VK_GROUP_ID}_${publication.id}`;
  }

  getSubscriptionUrl(): string {
    return `https://vk.com/widget_community.php?act=a_subscribe_box&oid=${VK_GROUP_ID}&state=1`;
  }

  getUserProfileUrl(profileId: string) {
    return `https://vk.com/${profileId}`;
  }
}

export const vk = new VK();
