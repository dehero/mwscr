import { asArray } from '../utils/common-utils.js';
import { getDaysPassed, getMinutesPassed } from '../utils/date-utils.js';
import { checkRules, needObject, needProperty } from './rule.js';

export interface Publication<TId> {
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
  comments?: PublicationComment[];
}

export interface PublicationComment {
  datetime: Date;
  author: string;
  text: string;
  replies?: PublicationComment[];
}

export function isPublicationComment(value: unknown, errors?: string[]): value is PublicationComment {
  return checkRules(
    [needObject, needProperty('author', 'string'), needProperty('text', 'string'), needProperty('datetime', Date)],
    value,
    errors,
  );
}

export function isPublicationComments(value: unknown, errors?: string[]): value is PublicationComment[] {
  return Array.isArray(value) && value.every((comment) => isPublicationComment(comment, errors));
}

export function isPublicationUpdatable(publication: Publication<unknown>): boolean {
  const updated = publication.updated ?? publication.published;

  const minutesSinceLastUpdate = getMinutesPassed(updated);
  const daysSinceLastUpdate = getDaysPassed(updated);
  const daysSincePublishing = getDaysPassed(publication.published);

  return (
    (daysSincePublishing <= 1 && minutesSinceLastUpdate >= 15) ||
    (daysSincePublishing <= 7 && daysSinceLastUpdate >= 1) ||
    (daysSincePublishing > 7 && daysSinceLastUpdate >= 7)
  );
}

export function isPublicationEqual(a: Publication<unknown>, b: Publication<unknown>) {
  return (
    a.service === b.service && (JSON.stringify(a.id) === JSON.stringify(b.id) || (a.mediaId && a.mediaId === b.mediaId))
  );
}
export function mergePublications(
  posts1: Publication<unknown>[] | undefined,
  posts2: Publication<unknown>[] | undefined,
) {
  const result = asArray(posts1);

  for (const publication2 of posts2 ?? []) {
    const publication1 = result.find((publication1) => isPublicationEqual(publication1, publication2));
    if (publication1) {
      publication1.code = publication2.code ?? publication1.code;
      publication1.mediaId = publication2.mediaId ?? publication1.mediaId;
      publication1.updated = publication2.updated ?? publication1.updated;
      publication1.followers = publication2.followers ?? publication1.followers;
      publication1.published = publication2.published;
      publication1.likes = publication2.likes ?? publication1.likes;
      publication1.views = publication2.views ?? publication1.views;
      publication1.reposts = publication2.reposts ?? publication1.reposts;
      publication1.comments = publication2.comments ?? publication1.comments;
    } else {
      result.push(publication2);
    }
  }

  return result.length > 0 ? result : undefined;
}
