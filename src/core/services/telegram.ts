import { z } from 'zod';
import { Post, PostContent, PostTitle, PostType } from '../entities/post.js';
import { Publication } from '../entities/publication.js';
import { checkRules } from '../entities/rule.js';
import type { PostingService } from '../entities/service.js';

export const TelegramPost = Post.extend({
  title: PostTitle,
  content: PostContent,
  type: PostType.extract(['shot', 'wallpaper', 'wallpaper-v', 'redrawing', 'shot-set']),
});

export const TelegramPublication = Publication.extend({
  id: z.number().or(z.number().array()),
});

export type TelegramPost = z.infer<typeof TelegramPost>;
export type TelegramPublication = z.infer<typeof TelegramPublication>;

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
