import { texts } from '../texts/index.js';
import type { DateRange, EntitySelection, SortDirection } from '../utils/common-types.js';
import { asArray, cleanupUndefinedProps, getSearchTokens, search } from '../utils/common-utils.js';
import { dateToString, formatDate, isDateInRange, isValidDate } from '../utils/date-utils.js';
import { localize } from '../utils/intl-utils.js';
import type { DataManager } from './data-manager.js';
import type { Locale } from './intl.js';
import { type ListReaderItemStatus, listReaderItemStatusDescriptors } from './list-manager.js';
import { createLocationOption, isNestedLocation } from './location.js';
import { aspectRatioToReadableText } from './media.js';
import type { Option } from './option.js';
import { ANY_OPTION, NONE_OPTION } from './option.js';
import type {
  PostAddon,
  PostAspectRatio,
  PostContent,
  PostEngine,
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
  getPostTypeUnitText,
  postAddonDescriptors,
  postPlacementDescriptors,
  postViolationDescriptors,
} from './post.js';
import type { PostsManagerName } from './posts-manager.js';
import { getPostsManagerUnitTitle as getPostsManagerUnitText, isPublishablePost, isReject } from './posts-manager.js';
import { createUserOption } from './user.js';

export interface PostInfo {
  id: string;
  refId?: string;
  title?: string;
  titleRu?: string;
  description?: string;
  descriptionRu?: string;
  locationOptions?: Option[];
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
  { value: 'date', label: texts.common.date, fn: comparePostInfosByDate },
  { value: 'id', label: texts.field.id, fn: comparePostInfosById },
  { value: 'likes', label: texts.metrics.likes, fn: comparePostInfosByLikes },
  { value: 'views', label: texts.metrics.views, fn: comparePostInfosByViews },
  { value: 'engagement', label: texts.metrics.engagement, fn: comparePostInfosByEngagement },
  { value: 'rating', label: texts.metrics.rating, fn: comparePostInfosByRating },
  { value: 'mark', label: texts.field.mark, fn: comparePostInfosByMark },
  { value: 'located', label: texts.post.located, fn: comparePostInfosByLocated },
  { value: 'requested', label: texts.post.requested, fn: comparePostInfosByRequested },
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
        locationOptions: (await dataManager.locations.getEntries(asArray(post.location))).map(createLocationOption),
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
          (params.location === ANY_OPTION.value && info.locationOptions) ||
          (params.location === NONE_OPTION.value && !info.locationOptions) ||
          (info.locationOptions &&
            asArray(info.locationOptions).some((location) =>
              isNestedLocation(location.value ?? '', params.location!),
            ))) &&
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

export function selectPostInfosResultToString(
  count: number,
  params: SelectPostInfosParams,
  locale: Locale,
  managerName: PostsManagerName,
) {
  const result: string[] = [count.toString()];
  const sortOption = selectPostInfosSortOptions.find((comparator) => comparator.value === params.sortKey);

  if (typeof params.original !== 'undefined') {
    result.push(localize(params.original ? texts.postFilter.original : texts.postFilter.reposted, locale, { count }));
  }

  if (typeof params.publishable !== 'undefined') {
    result.push(
      localize(params.publishable ? texts.postFilter.publishable : texts.postFilter.notPublishable, locale, { count }),
    );
  }

  if (params.requester) {
    if (params.requester === ANY_OPTION.value) {
      result.push(localize(texts.postFilter.requested, locale, { count }));
    } else if (params.requester === NONE_OPTION.value) {
      result.push(localize(texts.postFilter.unprompted, locale, { count }));
    }
  }

  if (params.type) {
    result.push(getPostTypeUnitText(params.type, count, locale));
  } else {
    result.push(getPostsManagerUnitText(managerName, count, locale));
  }

  if (params.aspect) {
    result.push(localize(texts.postFilter.withAspect, locale, { aspect: aspectRatioToReadableText(params.aspect) }));
  }

  if (typeof params.official !== 'undefined') {
    result.push(
      localize(
        params.official ? texts.postFilter.withoutThirdPartyExpansions : texts.postFilter.withThirdPartyExpansions,
        locale,
      ),
    );
  }

  if (params.status) {
    if (params.status === ANY_OPTION.value) {
      result.push(localize(texts.postFilter.withAnyStatus, locale));
    } else if (params.status === NONE_OPTION.value) {
      result.push(localize(texts.postFilter.withNoStatus, locale));
    } else {
      result.push(
        localize(texts.postFilter.withStatus, locale, {
          status: localize(listReaderItemStatusDescriptors[params.status].title, locale),
        }),
      );
    }
  }

  if (params.search) {
    result.push(localize(texts.postFilter.withSearch, locale, { search: params.search }));
  }

  if (params.location) {
    if (params.location === ANY_OPTION.value) {
      result.push(localize(texts.postFilter.withAnyLocation, locale));
    } else if (params.location === NONE_OPTION.value) {
      result.push(localize(texts.postFilter.withUnknownLocation, locale));
    } else {
      result.push(localize(texts.postFilter.withLocation, locale, { location: params.location }));
    }
  }

  if (params.placement) {
    if (params.placement === ANY_OPTION.value) {
      result.push(localize(texts.postFilter.withAnyPlacement, locale));
    } else if (params.placement === NONE_OPTION.value) {
      result.push(localize(texts.postFilter.withUnknownPlacement, locale));
    } else if (params.placement === 'Mixed') {
      result.push(localize(texts.postFilter.withMixedPlacement, locale));
    } else {
      result.push(
        localize(texts.postFilter.withPlacement, locale, {
          placement: localize(postPlacementDescriptors[params.placement].title, locale).toLocaleLowerCase(),
        }),
      );
    }
  }

  if (params.addon) {
    if (params.addon === ANY_OPTION.value) {
      result.push(localize(texts.postFilter.withAnyAddon, locale));
    } else if (params.addon === NONE_OPTION.value) {
      result.push(localize(texts.postFilter.withNoAddon, locale));
    } else {
      result.push(localize(texts.postFilter.withAddon, locale, { addon: params.addon.toLocaleLowerCase() }));
    }
  }

  if (params.tag) {
    result.push(localize(texts.postFilter.withTag, locale, { tag: params.tag }));
  }

  if (params.author) {
    result.push(localize(texts.postFilter.byUser, locale, { user: params.author }));
  }

  if (params.locator && params.locator !== ANY_OPTION.value && params.locator !== NONE_OPTION.value) {
    result.push(localize(texts.postFilter.locatedByUser, locale, { user: params.locator }));
  }

  if (params.requester && params.requester !== ANY_OPTION.value && params.requester !== NONE_OPTION.value) {
    result.push(localize(texts.postFilter.requestedByUser, locale, { user: params.requester }));
  }

  if (params.mark) {
    result.push(localize(texts.postFilter.markedWith, locale, { mark: params.mark }));
  }

  if (params.violation) {
    if (params.violation === ANY_OPTION.value) {
      result.push(localize(texts.postFilter.withAnyViolation, locale));
    } else if (params.violation === NONE_OPTION.value) {
      result.push(localize(texts.postFilter.withNoViolation, locale));
    } else {
      result.push(
        localize(texts.postFilter.withViolation, locale, {
          violation: localize(postViolationDescriptors[params.violation].title, locale),
        }),
      );
    }
  }

  if (params.date) {
    if (params.date[1] && dateToString(params.date[0]) !== dateToString(params.date[1])) {
      result.push(
        localize(texts.postFilter.postedFromTo, locale, {
          from: formatDate(params.date[0], locale),
          to: formatDate(params.date[1], locale),
        }),
      );
    } else {
      result.push(localize(texts.postFilter.postedOn, locale, { date: formatDate(params.date[0], locale) }));
    }
  }

  if (sortOption) {
    const sortLabel = localize(sortOption.label, locale);
    const direction = localize(params.sortDirection === 'asc' ? texts.postFilter.asc : texts.postFilter.desc, locale);

    result.push(localize(texts.postFilter.sortedBy, locale, { label: sortLabel, direction }));
  }

  return result.join(' ');
}
