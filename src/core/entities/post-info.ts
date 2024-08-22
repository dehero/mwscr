import type { SortDirection } from '../utils/common-types.js';
import { asArray, cleanupUndefinedProps } from '../utils/common-utils.js';
import { createLocationInfo, type LocationInfo } from './location-info.js';
import type { LocationsReader } from './locations-reader.js';
import type {
  PostAddon,
  PostContent,
  PostEngine,
  PostEntry,
  PostMark,
  PostRequest,
  PostType,
  PostViolation,
} from './post.js';
import {
  getPostCommentCount,
  getPostDateById,
  getPostEntryEngagement,
  getPostEntryFollowers,
  getPostEntryLikes,
  getPostEntryViews,
  getPostRating,
} from './post.js';
import { isPublishablePost, isTrashItem } from './post-variation.js';
import type { UserEntry } from './user.js';
import type { UsersManager } from './users-manager.js';

export interface PostInfo {
  id: string;
  refId?: string;
  title?: string;
  titleRu?: string;
  description?: string;
  descriptionRu?: string;
  location?: LocationInfo;
  content?: PostContent;
  type: PostType;
  authorEntries: UserEntry[];
  tags?: string[];
  engine?: PostEngine;
  addon?: PostAddon;
  requesterEntry?: UserEntry;
  request?: PostRequest;
  mark?: PostMark;
  violation?: PostViolation;
  published: boolean;
  publishableErrors?: string[];
  commentCount: number;
  likes: number;
  views: number;
  followers?: number;
  engagement: number;
  rating: number;
  managerName: string;
}

export type PostInfoComparator = (a: PostInfo, b: PostInfo) => number;

export async function createPostInfo(
  entry: PostEntry,
  locationsReader: LocationsReader,
  usersManager: UsersManager,
  managerName: string,
): Promise<PostInfo> {
  const [id, post, refId] = entry;
  const location = post.location ? await locationsReader.getItem(post.location) : undefined;
  const errors: string[] = [];

  if (!isTrashItem(post)) {
    isPublishablePost(post, errors);
  }

  return cleanupUndefinedProps({
    id,
    refId,
    title: post.title,
    titleRu: post.titleRu,
    description: post.description,
    location: location ? createLocationInfo(location) : undefined,
    content: post.content,
    type: post.type,
    authorEntries: await usersManager.getEntries(asArray(post.author)),
    tags: post.tags,
    engine: post.engine,
    addon: post.addon,
    requesterEntry: post.request?.user ? await usersManager.getEntry(post.request.user) : undefined,
    request: post.request,
    mark: post.mark,
    violation: post.violation,
    published: Boolean(post.posts?.length),
    publishableErrors: errors.length > 0 ? errors : undefined,
    commentCount: getPostCommentCount(post),
    likes: getPostEntryLikes(entry),
    views: getPostEntryViews(entry),
    followers: getPostEntryFollowers(entry),
    engagement: Number(getPostEntryEngagement(entry).toFixed(2)),
    rating: Number(getPostRating(post).toFixed(2)),
    managerName,
  });
}

export function comparePostInfosById(direction: SortDirection): PostInfoComparator {
  return direction === 'asc' ? (a, b) => a.id.localeCompare(b.id) : (a, b) => b.id.localeCompare(a.id);
}

export function comparePostInfosByCommentCount(direction: SortDirection): PostInfoComparator {
  const byId = comparePostInfosById(direction);

  return direction === 'asc'
    ? (a, b) => a.commentCount - b.commentCount || byId(a, b)
    : (a, b) => b.commentCount - a.commentCount || byId(a, b);
}

export function comparePostInfosByRating(direction: SortDirection): PostInfoComparator {
  const byId = comparePostInfosById(direction);

  return direction === 'asc'
    ? (a, b) => a.rating - b.rating || byId(a, b)
    : (a, b) => b.rating - a.rating || byId(a, b);
}

export function comparePostInfosByEngagement(direction: SortDirection): PostInfoComparator {
  const byId = comparePostInfosById(direction);

  return direction === 'asc'
    ? (a, b) => a.engagement - b.engagement || byId(a, b)
    : (a, b) => b.engagement - a.engagement || byId(a, b);
}

export function comparePostInfosByLikes(direction: SortDirection): PostInfoComparator {
  const byId = comparePostInfosById(direction);

  return direction === 'asc' ? (a, b) => a.likes - b.likes || byId(a, b) : (a, b) => b.likes - a.likes || byId(a, b);
}

export function comparePostInfosByViews(direction: SortDirection): PostInfoComparator {
  const byId = comparePostInfosById(direction);

  return direction === 'asc' ? (a, b) => a.views - b.views || byId(a, b) : (a, b) => b.views - a.views || byId(a, b);
}

export function comparePostInfosByMark(direction: SortDirection): PostInfoComparator {
  const byRating = comparePostInfosByRating(direction);

  return direction === 'asc'
    ? (a, b) => b.mark?.localeCompare(a.mark || '') || byRating(a, b)
    : (a, b) => a.mark?.localeCompare(b.mark || '') || byRating(a, b);
}

export function comparePostInfosByDate(direction: SortDirection): PostInfoComparator {
  const byId = comparePostInfosById(direction);

  return direction === 'asc'
    ? (a, b) => (getPostDateById(a.id)?.getTime() || 0) - (getPostDateById(b.id)?.getTime() || 0) || byId(a, b)
    : (a, b) => (getPostDateById(b.id)?.getTime() || 0) - (getPostDateById(a.id)?.getTime() || 0) || byId(a, b);
}
