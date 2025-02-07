import type { DateRange, EntitySelection, SortDirection } from '../utils/common-types.js';
import { asArray, cleanupUndefinedProps, getSearchTokens, search } from '../utils/common-utils.js';
import { dateToString, formatDate, isDateInRange, isValidDate } from '../utils/date-utils.js';
import type { ListReaderItemStatus } from './list-manager.js';
import { isNestedLocation } from './location.js';
import type { Option } from './option.js';
import { ANY_OPTION, NONE_OPTION } from './option.js';
import type {
  PostAddon,
  PostContent,
  PostEngine,
  PostEntry,
  PostLocation,
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
  postTypeDescriptors,
  postViolationDescriptors,
} from './post.js';
import type { PostsManager, PostsManagerName } from './posts-manager.js';
import { isPublishablePost, isTrashItem } from './posts-manager.js';
import { createUserOption } from './user.js';
import type { UsersManager } from './users-manager.js';

export interface PostInfo {
  id: string;
  refId?: string;
  title?: string;
  titleRu?: string;
  description?: string;
  descriptionRu?: string;
  location?: PostLocation;
  content?: PostContent;
  type: PostType;
  authorOptions: Option[];
  tags?: string[];
  engine?: PostEngine;
  addon?: PostAddon;
  requesterOption?: Option;
  // TODO: don't include request.user, use requesterOption
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
  managerName: PostsManagerName;
  status?: ListReaderItemStatus;
}

export type PostInfoComparator = (a: PostInfo, b: PostInfo) => number;

export interface SelectPostInfoSortOption extends Option {
  fn: (direction: SortDirection) => PostInfoComparator;
}

export const selectPostInfosSortOptions = [
  { value: 'date', label: 'Date', fn: comparePostInfosByDate },
  { value: 'id', label: 'ID', fn: comparePostInfosById },
  { value: 'likes', label: 'Likes', fn: comparePostInfosByLikes },
  { value: 'views', label: 'Views', fn: comparePostInfosByViews },
  { value: 'engagement', label: 'Engagement', fn: comparePostInfosByEngagement },
  { value: 'rating', label: 'Rating', fn: comparePostInfosByRating },
  { value: 'mark', label: "Editor's Mark", fn: comparePostInfosByMark },
] as const satisfies SelectPostInfoSortOption[];

export type SelectPostInfosSortKey = (typeof selectPostInfosSortOptions)[number]['value'];

export interface SelectPostInfosParams {
  type?: PostType;
  tag?: string;
  location?: string;
  search?: string;
  author?: string;
  requester?: string;
  mark?: PostMark;
  violation?: PostViolation | typeof ANY_OPTION.value | typeof NONE_OPTION.value;
  publishable?: boolean;
  original?: boolean;
  sortKey?: SelectPostInfosSortKey;
  sortDirection?: SortDirection;
  date?: DateRange;
  status?: ListReaderItemStatus | typeof ANY_OPTION.value | typeof NONE_OPTION.value;
}

export type PostInfoSelection = EntitySelection<PostInfo, SelectPostInfosParams>;

export async function createPostInfo(
  entry: PostEntry,
  usersManager: UsersManager,
  manager: PostsManager,
): Promise<PostInfo> {
  const [id, post, refId] = entry;
  const errors: string[] = [];

  const status = await manager.getItemStatus(id);

  if (status !== 'removed' && !isTrashItem(post)) {
    isPublishablePost(post, errors);
  }

  return cleanupUndefinedProps({
    id,
    refId,
    title: post.title,
    titleRu: post.titleRu,
    description: post.description,
    location: post.location,
    content: post.content,
    type: post.type,
    authorOptions: (await usersManager.getEntries(asArray(post.author))).map(createUserOption),
    tags: post.tags,
    engine: post.engine,
    addon: post.addon,
    requesterOption: post.request?.user ? createUserOption(await usersManager.getEntry(post.request.user)) : undefined,
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
    managerName: manager.name,
    status,
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

export const selectPostInfos = (
  postInfos: PostInfo[],
  params: SelectPostInfosParams,
  limit?: number,
): PostInfoSelection => {
  const localParams: SelectPostInfosParams = { ...params, sortKey: 'date', sortDirection: 'desc' };

  const comparator =
    selectPostInfosSortOptions.find((comparator) => comparator.value === params.sortKey)?.fn ?? comparePostInfosByDate;
  const searchTokens = getSearchTokens(params.search);

  const items = [...postInfos].sort(comparator(params.sortDirection ?? 'desc')).filter((info) => {
    const date = getPostDateById(info.id);

    return Boolean(
      (typeof params.publishable === 'undefined' || params.publishable !== Boolean(info.publishableErrors?.length)) &&
        (typeof params.requester === 'undefined' ||
          (params.requester === ANY_OPTION.value && info.requesterOption) ||
          (params.requester === NONE_OPTION.value && !info.requesterOption) ||
          info.requesterOption?.value === params.requester) &&
        (typeof params.date === 'undefined' ||
          (isValidDate(date) ? isDateInRange(date, params.date, 'date') : false)) &&
        (typeof params.original === 'undefined' || params.original !== Boolean(info.refId)) &&
        (typeof params.status === 'undefined' ||
          (params.status === ANY_OPTION.value && info.status) ||
          (params.status === NONE_OPTION.value && !info.status) ||
          info.status === params.status) &&
        (typeof params.type === 'undefined' || info.type === params.type) &&
        (typeof params.tag === 'undefined' || info.tags?.includes(params.tag)) &&
        (typeof params.author === 'undefined' || info.authorOptions.some((option) => option.value === params.author)) &&
        (typeof params.location === 'undefined' ||
          (params.location === ANY_OPTION.value && info.location) ||
          (params.location === NONE_OPTION.value && !info.location) ||
          (info.location && asArray(info.location).some((location) => isNestedLocation(location, params.location!)))) &&
        (typeof params.mark === 'undefined' || info.mark === params.mark) &&
        (typeof params.violation === 'undefined' ||
          (params.violation === ANY_OPTION.value && info.violation) ||
          (params.violation === NONE_OPTION.value && !info.violation) ||
          info.violation === params.violation) &&
        search(searchTokens, [info.title, info.titleRu, info.description, info.descriptionRu]),
    );
  });

  return {
    items: typeof limit === 'undefined' ? items : items.slice(0, limit),
    params: localParams,
    totalCount: items.length,
  };
};

export function selectPostInfosResultToString(count: number, params: SelectPostInfosParams, selected: number) {
  const result: string[] = [count.toString()];
  const sortOption = selectPostInfosSortOptions.find((comparator) => comparator.value === params.sortKey);

  if (selected) {
    if (selected === count) {
      result.unshift('Selected all');
    } else {
      result.unshift(`Selected ${selected} of`);
    }
  }

  if (params.status) {
    if (params.status === ANY_OPTION.value) {
      result.push('with any unsaved status');
    } else if (params.status === NONE_OPTION.value) {
      result.push('with no unsaved status');
    } else {
      result.push(params.status);
    }
  }

  if (typeof params.original !== 'undefined') {
    result.push(params.original ? 'original' : 'reposted');
  }

  if (typeof params.publishable !== 'undefined') {
    result.push(params.publishable ? 'publishable' : 'not publishable');
  }

  if (params.requester) {
    if (params.requester === ANY_OPTION.value) {
      result.push('requested');
    } else if (params.requester === NONE_OPTION.value) {
      result.push('unprompted');
    }
  }

  if (params.type) {
    result.push(`${postTypeDescriptors[params.type].title.toLocaleLowerCase()}${count !== 1 ? 's' : ''}`);
  } else {
    result.push(`post${count !== 1 ? 's' : ''}`);
  }

  if (params.search) {
    result.push(`with "${params.search}" in title or description`);
  }

  if (params.location) {
    if (params.location === ANY_OPTION.value) {
      result.push('in any location');
    } else if (params.location === NONE_OPTION.value) {
      result.push('in unknown location');
    } else {
      result.push(`in "${params.location}"`);
    }
  }

  if (params.tag) {
    result.push(`with "${params.tag}" tag`);
  }

  if (params.author) {
    result.push(`by "${params.author}"`);
  }

  if (params.requester && params.requester !== ANY_OPTION.value && params.requester !== NONE_OPTION.value) {
    result.push(`requested by "${params.requester}"`);
  }

  if (params.mark) {
    result.push(`marked with ${params.mark}`);
  }

  if (params.violation) {
    if (params.violation === ANY_OPTION.value) {
      result.push('with any violation');
    } else if (params.violation === NONE_OPTION.value) {
      result.push('with no violations');
    } else {
      result.push(`with "${postViolationDescriptors[params.violation].title}" violation`);
    }
  }

  if (params.date) {
    if (params.date[1] && dateToString(params.date[0]) !== dateToString(params.date[1])) {
      result.push(`from ${formatDate(params.date[0])} to ${formatDate(params.date[1])}`);
    } else {
      result.push(`on ${formatDate(params.date[0])}`);
    }
  }

  if (sortOption) {
    result.push(`sorted by "${sortOption.label}" ${params.sortDirection === 'asc' ? 'ascending' : 'descending'}`);
  }

  return result.join(' ');
}
