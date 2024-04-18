import type { Post } from '../entities/post.js';
import { checkRules } from '../entities/rule.js';
import type { ServicePost } from '../entities/service-post.js';
import { needCertainType, needContent, needTitle } from '../rules/post-rules.js';

interface TelegramSuitablePost extends Post {
  title: string;
  content: string;
  type: 'shot';
}

export type TelegramPost = ServicePost<number | number[]>;

export function isTelegramPost(servicePost: ServicePost<unknown>): servicePost is TelegramPost {
  return (
    servicePost.service === id &&
    (typeof servicePost.id === 'number' ||
      (Array.isArray(servicePost.id) && servicePost.id.every((item) => typeof item === 'number')))
  );
}

export const TELEGRAM_CHANNEL = 'mwscr';

export const id = 'tg';
export const name = 'Telegram';

export function canPublishPost(post: Post, errors: string[] = []): post is TelegramSuitablePost {
  return checkRules([needCertainType('shot'), needTitle, needContent], post, errors);
}

export function getServicePostUrl(servicePost: ServicePost<unknown>) {
  if (!isTelegramPost(servicePost)) {
    return;
  }
  return `https://t.me/${TELEGRAM_CHANNEL}/${servicePost.id}`;
}

export function getUserProfileUrl(profileId: string) {
  return `https://t.me/${profileId}`;
}
