import type { Post } from '../entities/post.js';
import { checkRules } from '../entities/rule.js';
import type { ServicePost } from '../entities/service-post.js';
import { needCertainType, needContent, needTitleRu } from '../rules/post-rules.js';

interface VKSuitablePost extends Post {
  titleRu: string;
  content: string;
  type: 'shot';
}

export type VKPost = ServicePost<number>;

export function isVKPost(servicePost: ServicePost<unknown>): servicePost is VKPost {
  return servicePost.service === id && typeof servicePost.id === 'number';
}

export const VK_GROUP_NAME = 'mwscr';
export const VK_GROUP_ID = -138249959;

export const id = 'vk';
export const name = 'VK';

export function canPublishPost(post: Post, errors: string[] = []): post is VKSuitablePost {
  return checkRules([needCertainType('shot'), needContent, needTitleRu], post, errors);
}

export function getServicePostUrl(servicePost: ServicePost<unknown>) {
  if (!isVKPost(servicePost)) {
    return;
  }
  return `https://vk.com/${VK_GROUP_NAME}?w=wall${VK_GROUP_ID}_${servicePost.id}`;
}

export function getUserProfileUrl(profileId: string) {
  return `https://vk.com/${profileId}`;
}
