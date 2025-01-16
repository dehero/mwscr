import type { InferOutput } from 'valibot';
import { array, intersect, number, object, union, variant } from 'valibot';
import { Post, PostTitle } from '../entities/post.js';
import { Redrawing, Shot, ShotSet, VerticalWallpaper, Wallpaper } from '../entities/post-variant.js';
import { Publication } from '../entities/publication.js';
import { checkRules } from '../entities/rule.js';
import type { PostingService } from '../entities/service.js';

export const TelegramPost = intersect([
  object({ ...Post.entries, title: PostTitle }),
  variant('type', [Redrawing, Shot, ShotSet, Wallpaper, VerticalWallpaper]),
]);

export const TelegramPublication = object({
  ...Publication.entries,
  id: union([number(), array(number())]),
});

export type TelegramPost = InferOutput<typeof TelegramPost>;
export type TelegramPublication = InferOutput<typeof TelegramPublication>;

export const TELEGRAM_CHANNEL = 'mwscr';

export const TELEGRAM_BOT_NAME = 'mwscrbot';

export class Telegram implements PostingService<TelegramPublication> {
  readonly id = 'tg';
  readonly name = 'Telegram';

  isPost(publication: Publication): publication is TelegramPublication {
    return (
      publication.service === this.id &&
      (typeof publication.id === 'number' ||
        (Array.isArray(publication.id) && publication.id.every((item) => typeof item === 'number')))
    );
  }

  canPublishPost(post: Post, errors: string[] = []): post is TelegramPost {
    return checkRules([TelegramPost], post, errors);
  }

  getPublicationUrl(publication: Publication) {
    if (!this.isPost(publication)) {
      return;
    }
    return `https://t.me/${TELEGRAM_CHANNEL}/${publication.id}`;
  }

  getSubscriptionUrl(): string {
    return `https://t.me/${TELEGRAM_CHANNEL}`;
  }

  getUserProfileUrl(profileId: string) {
    return `https://t.me/${profileId}`;
  }
}

export const telegram = new Telegram();
