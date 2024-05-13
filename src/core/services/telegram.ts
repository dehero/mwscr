import type { Post } from '../entities/post.js';
import { checkRules } from '../entities/rule.js';
import type { PostingService } from '../entities/service.js';
import type { ServicePost } from '../entities/service-post.js';
import { needCertainType, needContent, needTitle } from '../rules/post-rules.js';

interface TelegramSuitablePost extends Post {
  title: string;
  content: string;
  type: 'shot';
}

export type TelegramPost = ServicePost<number | number[]>;

export const TELEGRAM_CHANNEL = 'mwscr';

export class Telegram implements PostingService<TelegramPost> {
  readonly id = 'tg';
  readonly name = 'Telegram';

  isPost(servicePost: ServicePost<unknown>): servicePost is TelegramPost {
    return (
      servicePost.service === this.id &&
      (typeof servicePost.id === 'number' ||
        (Array.isArray(servicePost.id) && servicePost.id.every((item) => typeof item === 'number')))
    );
  }

  canPublishPost(post: Post, errors: string[] = []): post is TelegramSuitablePost {
    return checkRules([needCertainType('shot'), needTitle, needContent], post, errors);
  }

  getServicePostUrl(servicePost: ServicePost<unknown>) {
    if (!this.isPost(servicePost)) {
      return;
    }
    return `https://t.me/${TELEGRAM_CHANNEL}/${servicePost.id}`;
  }

  getUserProfileUrl(profileId: string) {
    return `https://t.me/${profileId}`;
  }
}

export const telegram = new Telegram();
