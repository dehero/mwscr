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
}

export async function createPostInfo(
  [id, post]: PostEntry<Post>,
  locationsReader: LocationsReader,
  usersManager: UsersManager,
): Promise<PostInfo> {
  const location = post.location ? await locationsReader.getItem(post.location) : undefined;
  const errors: string[] = [];
  isPublishablePost(post, errors);

  return cleanupUndefinedProps({
    id,
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
  });
}

export function comparePostInfosById(direction: 'asc' | 'desc'): (a: PostInfo, b: PostInfo) => number {
  return direction === 'asc' ? (a, b) => a.id.localeCompare(b.id) : (a, b) => b.id.localeCompare(a.id);
}

export function comparePostInfosByCommentCount(direction: 'asc' | 'desc'): (a: PostInfo, b: PostInfo) => number {
  return direction === 'asc' ? (a, b) => a.commentCount - b.commentCount : (a, b) => b.commentCount - a.commentCount;
}

export function comparePostInfosByRating(direction: 'asc' | 'desc'): (a: PostInfo, b: PostInfo) => number {
  return direction === 'asc' ? (a, b) => a.rating - b.rating : (a, b) => b.rating - a.rating;
}

export function comparePostInfosByLikes(direction: 'asc' | 'desc'): (a: PostInfo, b: PostInfo) => number {
  return direction === 'asc' ? (a, b) => a.likes - b.likes : (a, b) => b.likes - a.likes;
}

export function comparePostInfosByViews(direction: 'asc' | 'desc'): (a: PostInfo, b: PostInfo) => number {
  return direction === 'asc' ? (a, b) => a.views - b.views : (a, b) => b.views - a.views;
}
