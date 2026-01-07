import type { InferOutput } from 'valibot';
import { intersect, number, object, variant } from 'valibot';
import { Post, PostTitleRu } from '../entities/post.js';
import {
  Achievement,
  Mention,
  News,
  Outtakes,
  Photoshop,
  Redrawing,
  Shot,
  ShotSet,
  VerticalWallpaper,
  Wallpaper,
} from '../entities/post-variant.js';
import { Publication } from '../entities/publication.js';
import { checkSchema } from '../entities/schema.js';
import type { PostingService } from '../entities/service.js';

export const VK_GROUP_NAME = 'mwscr';
export const VK_GROUP_ID = -138249959;

export const VKPost = intersect([
  object({ ...Post.entries, titleRu: PostTitleRu }),
  variant('type', [
    Redrawing,
    Shot,
    ShotSet,
    VerticalWallpaper,
    Wallpaper,
    Outtakes,
    News,
    Photoshop,
    Mention,
    Achievement,
  ]),
]);

export const VKPublication = object({
  ...Publication.entries,
  id: number(),
});

export type VKPost = InferOutput<typeof VKPost>;
export type VKPublication = InferOutput<typeof VKPublication>;

export class VK implements PostingService<VKPublication> {
  readonly id = 'vk';
  readonly name = 'VK';
  readonly sponsorshipName = 'VK Donut';

  isPublication(publication: Publication): publication is VKPublication {
    return publication.service === this.id && typeof publication.id === 'number';
  }

  canPublishPost(post: Post, errors: string[] = []): post is VKPost {
    return checkSchema(VKPost, post, errors);
  }

  getSponsorshipUrl() {
    return `https://vk.com/${VK_GROUP_NAME}`;
  }

  getPublicationUrl(publication: Publication) {
    if (!this.isPublication(publication)) {
      return;
    }

    if (publication.type === 'story') {
      return `https://vk.com/${VK_GROUP_NAME}?w=story${VK_GROUP_ID}_${publication.id}`;
    }

    if (publication.type === 'product') {
      return `https://vk.com/market${VK_GROUP_ID}?w=product${VK_GROUP_ID}_${publication.id}`;
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
