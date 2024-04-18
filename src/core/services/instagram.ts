import type { Post } from '../entities/post.js';
import { checkRules } from '../entities/rule.js';
import type { ServicePost } from '../entities/service-post.js';
import { needCertainType, needContent, needTitle } from '../rules/post-rules.js';

export const id = 'ig';
export const name = 'Instagram';

export interface InstagramSuitablePost extends Post {
  title: string;
  content: string;
  type: 'shot';
}

export type InstagramPost = ServicePost<string>;

export function isInstagramPost(servicePost: ServicePost<unknown>): servicePost is InstagramPost {
  return servicePost.service === id && typeof servicePost.id === 'string';
}

export function canPublishPost(post: Post, errors: string[] = []): post is InstagramSuitablePost {
  return checkRules([needCertainType('shot'), needTitle, needContent], post, errors);
}

export function getServicePostUrl(servicePost: ServicePost<unknown>) {
  if (!isInstagramPost(servicePost)) {
    return;
  }
  return `https://instagram.com/p/${servicePost.id}/`;
}

export function getUserProfileUrl(profileId: string) {
  return `https://instagram.com/p/${profileId}/`;
}
