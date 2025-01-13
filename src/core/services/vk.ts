import { z } from 'zod';
import { Post, PostContent, PostTitleRu, PostType } from '../entities/post.js';
import { Publication } from '../entities/publication.js';
import { checkRules } from '../entities/rule.js';
import type { PostingService } from '../entities/service.js';

export const VKPost = Post.extend({
  titleRu: PostTitleRu,
  content: PostContent,
  type: PostType.extract(['shot', 'wallpaper', 'wallpaper-v', 'redrawing', 'shot-set']),
});

export const VKPublication = Publication.extend({
  id: z.number(),
});

export type VKPost = z.infer<typeof VKPost>;
export type VKPublication = z.infer<typeof VKPublication>;

export const VK_GROUP_NAME = 'mwscr';
export const VK_GROUP_ID = -138249959;

export class VK implements PostingService<VKPublication> {
  readonly id = 'vk';
  readonly name = 'VK';
  readonly donationName = 'VK Donut';

  isPost(publication: Publication): publication is VKPublication {
    return publication.service === this.id && typeof publication.id === 'number';
  }

  canPublishPost(post: Post, errors: string[] = []): post is VKPost {
    return checkRules([VKPost], post, errors);
  }

  getDonationUrl() {
    return `https://vk.com/donut/${VK_GROUP_NAME}`;
  }

  getPublicationUrl(publication: Publication) {
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
