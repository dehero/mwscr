import type { Post } from '../entities/post.js';
import type { Publication } from '../entities/publication.js';
import { checkRules } from '../entities/rule.js';
import type { PostingService } from '../entities/service.js';
import { needCertainType, needContent, needTitle } from '../rules/post-rules.js';

interface TelegramSuitablePost extends Post {
  title: string;
  content: string;
  type: 'shot';
}

export type TelegramPost = Publication<number | number[]>;

export const TELEGRAM_CHANNEL = 'mwscr';

export const TELEGRAM_BOT_NAME = 'mwscrbot';

export class Telegram implements PostingService<TelegramPost> {
  readonly id = 'tg';
  readonly name = 'Telegram';

  isPost(publication: Publication<unknown>): publication is TelegramPost {
    return (
      publication.service === this.id &&
      (typeof publication.id === 'number' ||
        (Array.isArray(publication.id) && publication.id.every((item) => typeof item === 'number')))
    );
  }

  canPublishPost(post: Post, errors: string[] = []): post is TelegramSuitablePost {
    return checkRules([needCertainType('shot', 'wallpaper', 'wallpaper-v'), needTitle, needContent], post, errors);
  }

  getPublicationUrl(publication: Publication<unknown>) {
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
