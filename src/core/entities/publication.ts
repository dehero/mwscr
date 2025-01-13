import { z } from 'zod';
import { asArray } from '../utils/common-utils.js';
import { getDaysPassed, getMinutesPassed } from '../utils/date-utils.js';

const BaseComment = z.object({ datetime: z.date(), author: z.string().nonempty(), text: z.string().trim() });

export const PublicationComment = BaseComment.extend({
  replies: z.array(BaseComment).optional(),
});
export type PublicationComment = z.infer<typeof PublicationComment>;

export const Publication = z.object({
  service: z.string().nonempty(),
  id: z.unknown(),
  code: z.string().nonempty().optional(),
  mediaId: z.string().nonempty().optional(),
  published: z.date(),
  updated: z.date().optional(),
  followers: z.number().positive().optional(),
  likes: z.number().positive().optional(),
  views: z.number().positive().optional(),
  reposts: z.number().positive().optional(),
  comments: z.array(PublicationComment).optional(),
});
export type Publication = z.infer<typeof Publication>;

export function isPublicationUpdatable(publication: Publication): boolean {
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

export function isPublicationEqual(a: Publication, b: Publication) {
  return (
    a.service === b.service && (JSON.stringify(a.id) === JSON.stringify(b.id) || (a.mediaId && a.mediaId === b.mediaId))
  );
}
export function mergePublications(posts1: Publication[] | undefined, posts2: Publication[] | undefined) {
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

export function getPublicationEngagement(info?: Publication) {
  const reactions = (info?.likes ?? 0) + (info?.reposts ?? 0);

  if (!reactions || !info?.followers) {
    return 0;
  }

  return info.followers >= 50 ? (reactions / info.followers) * 100 : reactions;
}
