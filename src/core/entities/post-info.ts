import { asArray, capitalizeFirstLetter, cleanupUndefinedProps } from '../utils/common-utils.js';
import { createLocationInfo, type LocationInfo } from './location-info.js';
import type { LocationsReader } from './locations-reader.js';
import type {
  Post,
  PostAddon,
  PostContent,
  PostEngine,
  PostEntry,
  PostMark,
  PostRequest,
  PostType,
  PostViolation,
} from './post.js';
import { getPostCommentCount, getPostRating, getPostTotalLikes, getPostTotalViews } from './post.js';
import { isPublishablePost } from './post-variation.js';
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
  publishableCheck?: string;
  commentCount: number;
  likes: number;
  views: number;
  rating: number;
  managerName: string;
}

export async function createPostInfo(
  [id, post, refId]: PostEntry<Post>,
  locationsReader: LocationsReader,
  usersManager: UsersManager,
  managerName: string,
): Promise<PostInfo> {
  const location = post.location ? await locationsReader.getItem(post.location) : undefined;
  const errors: string[] = [];
  isPublishablePost(post, errors);

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
    published: Boolean(post.posts),
    publishableCheck: errors.length > 0 ? capitalizeFirstLetter(errors.join(', ')) : undefined,
    commentCount: getPostCommentCount(post),
    likes: getPostTotalLikes(post),
    views: getPostTotalViews(post),
    rating: Number(getPostRating(post).toFixed(2)),
    managerName,
  });
}

export function comparePostInfosById(direction: 'asc' | 'desc'): (a: PostInfo, b: PostInfo) => number {
  return direction === 'asc' ? (a, b) => a.id.localeCompare(b.id) : (a, b) => b.id.localeCompare(a.id);
}

export function comparePostInfosByCommentCount(direction: 'asc' | 'desc'): (a: PostInfo, b: PostInfo) => number {
  const byId = comparePostInfosById(direction);

  return direction === 'asc'
    ? (a, b) => a.commentCount - b.commentCount || byId(a, b)
    : (a, b) => b.commentCount - a.commentCount || byId(a, b);
}

export function comparePostInfosByRating(direction: 'asc' | 'desc'): (a: PostInfo, b: PostInfo) => number {
  const byId = comparePostInfosById(direction);

  return direction === 'asc'
    ? (a, b) => a.rating - b.rating || byId(a, b)
    : (a, b) => b.rating - a.rating || byId(a, b);
}

export function comparePostInfosByLikes(direction: 'asc' | 'desc'): (a: PostInfo, b: PostInfo) => number {
  const byId = comparePostInfosById(direction);

  return direction === 'asc' ? (a, b) => a.likes - b.likes || byId(a, b) : (a, b) => b.likes - a.likes || byId(a, b);
}

export function comparePostInfosByViews(direction: 'asc' | 'desc'): (a: PostInfo, b: PostInfo) => number {
  const byId = comparePostInfosById(direction);

  return direction === 'asc' ? (a, b) => a.views - b.views || byId(a, b) : (a, b) => b.views - a.views || byId(a, b);
}

export function comparePostInfosByMark(direction: 'asc' | 'desc'): (a: PostInfo, b: PostInfo) => number {
  const byRating = comparePostInfosByRating(direction);

  return direction === 'asc'
    ? (a, b) => b.mark?.localeCompare(a.mark || '') || byRating(a, b)
    : (a, b) => a.mark?.localeCompare(b.mark || '') || byRating(a, b);
}
