import type { DateRange, EntitySelection, SortDirection } from '../utils/common-types.js';
import { asArray, cleanupUndefinedProps, getSearchTokens, search } from '../utils/common-utils.js';
import { dateToString, formatDate, isDateInRange, isValidDate } from '../utils/date-utils.js';
import type { DataManager } from './data-manager.js';
import type { ListReaderItemStatus } from './list-manager.js';
import { isNestedLocation } from './location.js';
import { aspectRatioToReadableText } from './media.js';
import type { Option } from './option.js';
import { ANY_OPTION, NONE_OPTION } from './option.js';
import type {
  PostAddon,
  PostAspectRatio,
  PostContent,
  PostEngine,
  PostLocation,
  PostMark,
  PostNote,
  PostPlacement,
  PostType,
  PostViolation,
  PostViolations,
} from './post.js';
import {
  comparePostEntriesByDate,
  getPostDateById,
  getPostEntriesFromSource,
  getPostEntryStats,
  getPostRating,
  postAddonDescriptors,
  postTypeDescriptors,
  postViolationDescriptors,
} from './post.js';
import type { PostsManagerName } from './posts-manager.js';
import { isPublishablePost, isReject } from './posts-manager.js';
import { createUserOption } from './user.js';

export interface PostInfo {
  id: string;
  refId?: string;
  title?: string;
  titleRu?: string;
  description?: string;
  descriptionRu?: string;
  location?: PostLocation;
  placement?: PostPlacement;
  content?: PostContent;
  snapshot?: PostContent;
  type: PostType;
  aspect?: PostAspectRatio;
  authorOptions: Option[];
  locatorOption?: Option;
  // TODO: don't include full note
  locating?: PostNote;
  tags?: string[];
  engine?: PostEngine;
  addon?: PostAddon;
  requesterOption?: Option;
  // TODO: don't include request.user, use requesterOption
  request?: PostNote;
  mark?: PostMark;
  violation?: PostViolations;
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
  created?: Date;
  located?: Date;
  requested?: Date;
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
  { value: 'located', label: 'Located', fn: comparePostInfosByLocated },
  { value: 'requested', label: 'Requested', fn: comparePostInfosByRequested },
] as const satisfies SelectPostInfoSortOption[];

export type SelectPostInfosSortKey = (typeof selectPostInfosSortOptions)[number]['value'];

export interface SelectPostInfosParams {
  type?: PostType;
  tag?: string;
  location?: string;
  placement?: PostPlacement | typeof ANY_OPTION.value | typeof NONE_OPTION.value;
  search?: string;
  author?: string;
  locator?: string;
  requester?: string;
  mark?: PostMark;
  violation?: PostViolation | typeof ANY_OPTION.value | typeof NONE_OPTION.value;
  publishable?: boolean;
  original?: boolean;
  official?: boolean;
  sortKey?: SelectPostInfosSortKey;
  sortDirection?: SortDirection;
  date?: DateRange;
  status?: ListReaderItemStatus | typeof ANY_OPTION.value | typeof NONE_OPTION.value;
  addon?: PostAddon | typeof ANY_OPTION.value | typeof NONE_OPTION.value;
  aspect?: PostAspectRatio;
}

export type PostInfoSelection = EntitySelection<PostInfo, SelectPostInfosParams>;

export async function createPostInfos(managerName: string, dataManager: DataManager): Promise<PostInfo[]> {
  const manager = dataManager.findPostsManager(managerName);
  if (!manager) {
    throw new Error(`Cannot find posts manager "${managerName}"`);
  }
  const entries = [
    ...(await getPostEntriesFromSource(() => manager.readAllEntries(false), comparePostEntriesByDate('desc'))),
    ...(await manager.getRemovedEntries()),
  ];

  const followersStats = await manager.getFollowersCountStats();

  return Promise.all(
    entries.map(async (entry) => {
      const [id, post, , refId] = entry;
      const errors: string[] = [];

      const status = await manager.getItemStatus(id);

      if (manager.name === 'drafts' && status !== 'removed' && !isReject(post)) {
        isPublishablePost(post, errors);
      }

      const stats = getPostEntryStats(entry);

      return cleanupUndefinedProps({
        id,
        refId,
        title: post.title,
        titleRu: post.titleRu,
        description: post.description,
        descriptionRu: post.descriptionRu,
        location: post.location,
        placement: post.placement,
        content: post.content,
        snapshot: post.snapshot,
        type: post.type,
        aspect: post.aspect,
        authorOptions: (await dataManager.users.getEntries(asArray(post.author))).map(createUserOption),
        locatorOption: post.locating?.user
          ? createUserOption(await dataManager.users.getEntry(post.locating.user))
          : undefined,
        located: post.locating?.date,
        locating: post.locating,
        tags: post.tags,
        engine: post.engine,
        addon: post.addon,
        requesterOption: post.request?.user
          ? createUserOption(await dataManager.users.getEntry(post.request.user))
          : undefined,
        request: post.request,
        mark: post.mark,
        violation: post.violation,
        published: Boolean(post.posts?.length),
        publishableErrors: errors.length > 0 ? errors : undefined,
        created: post.created,
        commentCount: stats.commentCount,
        likes: stats.likes,
        views: stats.views,
        followers: followersStats.get(id),
        engagement: Number(stats.engagement.toFixed(2)),
        rating: Number(getPostRating(post).toFixed(2)),
        managerName: manager.name,
        status,
      });
    }),
  );
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

export function comparePostInfosByLocated(direction: SortDirection): PostInfoComparator {
  const byId = comparePostInfosById(direction);

  return direction === 'asc'
    ? (a, b) => (a.located?.getTime() || 0) - (b.located?.getTime() || 0) || byId(a, b)
    : (a, b) => (b.located?.getTime() || 0) - (a.located?.getTime() || 0) || byId(a, b);
}

export function comparePostInfosByRequested(direction: SortDirection): PostInfoComparator {
  const byId = comparePostInfosById(direction);

  return direction === 'asc'
    ? (a, b) => (a.requested?.getTime() || 0) - (b.requested?.getTime() || 0) || byId(a, b)
    : (a, b) => (b.requested?.getTime() || 0) - (a.requested?.getTime() || 0) || byId(a, b);
}

export const selectPostInfos = (
  postInfos: PostInfo[],
  params: SelectPostInfosParams,
  limit?: number,
): PostInfoSelection => {
  const localParams: SelectPostInfosParams = {
    ...params,
    sortKey: params.sortKey ?? 'date',
    sortDirection: params.sortDirection ?? 'desc',
  };

  const comparator =
    selectPostInfosSortOptions.find((comparator) => comparator.value === localParams.sortKey)?.fn ??
    comparePostInfosByDate;
  const searchTokens = getSearchTokens(params.search);

  const items = [...postInfos].sort(comparator(localParams.sortDirection ?? 'desc')).filter((info) => {
    const date = getPostDateById(info.id);

    return Boolean(
      (typeof params.publishable === 'undefined' ||
        params.publishable !== Boolean(info.status === 'removed' || info.publishableErrors?.length)) &&
        (typeof params.requester === 'undefined' ||
          (params.requester === ANY_OPTION.value && info.requesterOption) ||
          (params.requester === NONE_OPTION.value && !info.requesterOption) ||
          info.requesterOption?.value === params.requester) &&
        (typeof params.date === 'undefined' ||
          (isValidDate(date) ? isDateInRange(date, params.date, 'date') : false)) &&
        (typeof params.official === 'undefined' ||
          params.official === (info.addon ? postAddonDescriptors[info.addon].official : true)) &&
        (typeof params.original === 'undefined' || params.original !== Boolean(info.refId)) &&
        (typeof params.status === 'undefined' ||
          (params.status === ANY_OPTION.value && info.status) ||
          (params.status === NONE_OPTION.value && !info.status) ||
          info.status === params.status) &&
        (typeof params.placement === 'undefined' ||
          (params.placement === ANY_OPTION.value && info.placement) ||
          (params.placement === NONE_OPTION.value && !info.placement) ||
          info.placement === params.placement) &&
        (typeof params.addon === 'undefined' ||
          (params.addon === ANY_OPTION.value && info.addon) ||
          (params.addon === NONE_OPTION.value && !info.addon) ||
          info.addon === params.addon) &&
        (typeof params.type === 'undefined' || info.type === params.type) &&
        (typeof params.aspect === 'undefined' || info.aspect === params.aspect) &&
        (typeof params.tag === 'undefined' || info.tags?.includes(params.tag)) &&
        (typeof params.author === 'undefined' || info.authorOptions.some((option) => option.value === params.author)) &&
        (typeof params.locator === 'undefined' ||
          (params.locator === ANY_OPTION.value && info.locatorOption) ||
          (params.locator === NONE_OPTION.value && !info.locatorOption) ||
          info.locatorOption?.value === params.locator) &&
        (typeof params.location === 'undefined' ||
          (params.location === ANY_OPTION.value && info.location) ||
          (params.location === NONE_OPTION.value && !info.location) ||
          (info.location && asArray(info.location).some((location) => isNestedLocation(location, params.location!)))) &&
        (typeof params.mark === 'undefined' || info.mark === params.mark) &&
        (typeof params.violation === 'undefined' ||
          (params.violation === ANY_OPTION.value && info.violation) ||
          (params.violation === NONE_OPTION.value && !info.violation) ||
          (info.violation && asArray(info.violation).includes(params.violation as PostViolation))) &&
        search(searchTokens, [info.title, info.titleRu, info.description, info.descriptionRu]),
    );
  });

  return {
    items: typeof limit === 'undefined' ? items : items.slice(0, limit),
    params: localParams,
    totalCount: items.length,
  };
};

export function selectPostInfosResultToString(count: number, params: SelectPostInfosParams) {
  const result: string[] = [count.toString()];
  const sortOption = selectPostInfosSortOptions.find((comparator) => comparator.value === params.sortKey);

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
    const { title, titleMultiple } = postTypeDescriptors[params.type];
    result.push((count !== 1 ? titleMultiple : title).toLocaleLowerCase());
  } else {
    result.push(`post${count !== 1 ? 's' : ''}`);
  }

  if (params.aspect) {
    result.push(`with "${aspectRatioToReadableText(params.aspect)}" aspect ratio`);
  }

  if (typeof params.official !== 'undefined') {
    result.push(params.official ? 'without third-party expansions' : 'with third-party expansions');
  }

  if (params.status) {
    if (params.status === ANY_OPTION.value) {
      result.push('with any unsaved status');
    } else if (params.status === NONE_OPTION.value) {
      result.push('with no unsaved status');
    } else {
      result.push(`with "${params.status} status`);
    }
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

  if (params.placement) {
    if (params.placement === ANY_OPTION.value) {
      result.push('with any placement');
    } else if (params.placement === NONE_OPTION.value) {
      result.push('with unknown placement');
    } else if (params.placement === 'Mixed') {
      result.push('with mixed placement');
    } else {
      result.push(`placed ${params.placement.toLocaleLowerCase()}`);
    }
  }

  if (params.addon) {
    if (params.addon === ANY_OPTION.value) {
      result.push('with any addon');
    } else if (params.addon === NONE_OPTION.value) {
      result.push('with no addon');
    } else {
      result.push(`with "${params.addon.toLocaleLowerCase()}" addon`);
    }
  }

  if (params.tag) {
    result.push(`with "${params.tag}" tag`);
  }

  if (params.author) {
    result.push(`by "${params.author}"`);
  }

  if (params.locator && params.locator !== ANY_OPTION.value && params.locator !== NONE_OPTION.value) {
    result.push(`located by "${params.locator}"`);
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
