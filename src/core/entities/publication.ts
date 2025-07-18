import type { InferOutput } from 'valibot';
import { array, date, minValue, nonEmpty, number, object, optional, picklist, pipe, string, unknown } from 'valibot';
import { asArray } from '../utils/common-utils.js';
import { getDaysPassed, getMinutesPassed, isDateInRange } from '../utils/date-utils.js';
import type { CommentsComparator } from './comment.js';
import { Comment } from './comment.js';

export const PUBLICATION_IS_RECENT_DAYS = 31;
export const PUBLICATION_MINIMUM_GAP_HOURS = 2;

export const PublicationType = picklist(['story']);
export type PublicationType = InferOutput<typeof PublicationType>;

export const PublicationComment = object({
  ...Comment.entries,
  replies: optional(array(Comment)),
});
export type PublicationComment = InferOutput<typeof PublicationComment>;

export const PublicationComments = array(PublicationComment);
export type PublicationComments = InferOutput<typeof PublicationComments>;

export const Publication = object({
  service: pipe(string(), nonEmpty()),
  id: unknown(),
  code: optional(pipe(string(), nonEmpty())),
  mediaId: optional(pipe(string(), nonEmpty())),
  type: optional(PublicationType),
  published: date(),
  updated: optional(date()),
  followers: optional(pipe(number(), minValue(0))),
  likes: optional(pipe(number(), minValue(0))),
  views: optional(pipe(number(), minValue(0))),
  reposts: optional(pipe(number(), minValue(0))),
  comments: optional(array(PublicationComment)),
});
export type Publication = InferOutput<typeof Publication>;

export interface PublicationCommentWithService extends PublicationComment {
  service: string;
}

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
  const result = [...asArray(posts1)];

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

export function getPublicationsTotalFollowers(publications: Publication[]) {
  const serviceFollowers = Object.entries(
    Object.fromEntries(
      [...publications]
        .sort((a, b) => (a.followers ?? 0) - (b.followers ?? 0))
        .map((post) => [post.service, post.followers ?? 0]),
    ),
  );
  if (serviceFollowers.length === 0 || serviceFollowers.some(([, followers]) => !followers)) {
    return;
  }

  return serviceFollowers.reduce((acc, [, followers]) => acc + followers, 0);
}

export function getPublicationsAverageEngagement(publications: Publication[]) {
  const engagements: number[] = publications
    .map((post) => getPublicationEngagement(post))
    .filter((engagement) => engagement > 0);

  // Need at least 2 posting service ratings to calculate average rating
  if (engagements.length < 2) {
    return 0;
  }

  return engagements.reduce((acc, number) => acc + number, 0) / engagements.length;
}

export function getPublicationsTotalLikes(publications: Publication[]) {
  return publications.reduce((acc, publication) => acc + (publication.likes ?? 0), 0);
}

export function getPublicationsTotalViews(publications: Publication[]) {
  return publications.reduce((acc, publication) => acc + (publication.views ?? 0), 0);
}

export function getPublicationsCommentCount(publications: Publication[]) {
  return (
    publications.reduce(
      (total, publication) =>
        total + (publication.comments?.reduce((total, comment) => total + 1 + (comment.replies?.length ?? 0), 0) ?? 0),
      0,
    ) || 0
  );
}

export function getPublicationsCommentsWithService(
  publications: Publication[],
  sorter: CommentsComparator,
): PublicationCommentWithService[] {
  return publications.flatMap(
    (publication) =>
      publication.comments
        ?.map((comment) => ({
          ...comment,
          service: publication.service,
          replies: [...(comment.replies ?? [])].sort(sorter),
        }))
        .sort(sorter) ?? [],
  );
}

export function getRecentPublications(publications: Publication[], date: Date): Publication[] {
  const secondDate = new Date(date);
  secondDate.setDate(secondDate.getDate() + PUBLICATION_IS_RECENT_DAYS);

  return publications.filter((publication) => isDateInRange(publication.published, [date, secondDate], 'date'));
}

export function getPublicationsStats(publications: Publication[]) {
  return {
    likes: getPublicationsTotalLikes(publications),
    followers: getPublicationsTotalFollowers(publications),
    views: getPublicationsTotalViews(publications),
    engagement: getPublicationsAverageEngagement(publications),
    commentCount: getPublicationsCommentCount(publications),
  };
}
