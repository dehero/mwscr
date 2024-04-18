import { asArray } from '../utils/common-utils.js';
import { getDaysPassed, getMinutesPassed } from '../utils/date-utils.js';
import { checkRules, needObject, needProperty } from './rule.js';

export interface ServicePost<TId> {
  service: string;
  id: TId;
  code?: string;
  mediaId?: string;
  published: Date;
  updated?: Date;
  followers?: number;
  likes?: number;
  views?: number;
  reposts?: number;
  comments?: ServicePostComment[];
}

export interface ServicePostComment {
  datetime: Date;
  author: string;
  text: string;
  replies?: ServicePostComment[];
}

export function isServicePostComment(value: unknown, errors?: string[]): value is ServicePostComment {
  return checkRules(
    [needObject, needProperty('author', 'string'), needProperty('text', 'string'), needProperty('datetime', Date)],
    value,
    errors,
  );
}

export function isServicePostComments(value: unknown, errors?: string[]): value is ServicePostComment[] {
  return Array.isArray(value) && value.every((comment) => isServicePostComment(comment, errors));
}

export function isServicePostUpdatable(servicePost: ServicePost<unknown>): boolean {
  const updated = servicePost.updated ?? servicePost.published;

  const minutesSinceLastUpdate = getMinutesPassed(updated);
  const daysSinceLastUpdate = getDaysPassed(updated);
  const daysSincePublishing = getDaysPassed(servicePost.published);

  return (
    (daysSincePublishing <= 1 && minutesSinceLastUpdate >= 15) ||
    (daysSincePublishing <= 7 && daysSinceLastUpdate >= 1) ||
    (daysSincePublishing > 7 && daysSinceLastUpdate >= 7)
  );
}

export function isServicePostEqual(a: ServicePost<unknown>, b: ServicePost<unknown>) {
  return (
    a.service === b.service && (JSON.stringify(a.id) === JSON.stringify(b.id) || (a.mediaId && a.mediaId === b.mediaId))
  );
}
export function mergeServicePosts(
  posts1: ServicePost<unknown>[] | undefined,
  posts2: ServicePost<unknown>[] | undefined,
) {
  const result = asArray(posts1);

  for (const servicePost2 of posts2 ?? []) {
    const servicePost1 = result.find((servicePost1) => isServicePostEqual(servicePost1, servicePost2));
    if (servicePost1) {
      servicePost1.code = servicePost2.code ?? servicePost1.code;
      servicePost1.mediaId = servicePost2.mediaId ?? servicePost1.mediaId;
      servicePost1.updated = servicePost2.updated ?? servicePost1.updated;
      servicePost1.followers = servicePost2.followers ?? servicePost1.followers;
      servicePost1.published = servicePost2.published;
      servicePost1.likes = servicePost2.likes ?? servicePost1.likes;
      servicePost1.views = servicePost2.views ?? servicePost1.views;
      servicePost1.reposts = servicePost2.reposts ?? servicePost1.reposts;
      servicePost1.comments = servicePost2.comments ?? servicePost1.comments;
    } else {
      result.push(servicePost2);
    }
  }

  return result.length > 0 ? result : undefined;
}
