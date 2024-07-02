import { isNestedLocation } from '../../core/entities/location.js';
import { POST_VIOLATIONS, type PostMark, type PostType, type PostViolation } from '../../core/entities/post.js';
import type { PostInfo, PostInfoComparator } from '../../core/entities/post-info.js';
import {
  comparePostInfosById,
  comparePostInfosByLikes,
  comparePostInfosByMark,
  comparePostInfosByRating,
  comparePostInfosByViews,
} from '../../core/entities/post-info.js';
import type { SortDirection } from '../../core/utils/common-types.js';
import { getSearchTokens, search } from '../../core/utils/common-utils.js';
import { ANY_OPTION, NONE_OPTION } from './ui-constants.js';

export interface SelectPostInfoSortOption {
  value: string;
  label: string;
  fn: (direction: SortDirection) => PostInfoComparator;
}

export const selectPostInfosSortOptions = [
  { value: 'id', label: 'ID', fn: comparePostInfosById },
  { value: 'likes', label: 'Likes', fn: comparePostInfosByLikes },
  { value: 'views', label: 'Views', fn: comparePostInfosByViews },
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
  sortKey: SelectPostInfosSortKey;
  sortDirection: SortDirection;
}

export const selectPostInfos = (postInfos: PostInfo[], params: SelectPostInfosParams): PostInfo[] => {
  const comparator =
    selectPostInfosSortOptions.find((comparator) => comparator.value === params.sortKey)?.fn ?? comparePostInfosById;
  const searchTokens = getSearchTokens(params.search);

  return [...postInfos]
    .sort(comparator(params.sortDirection))
    .filter((info) =>
      Boolean(
        (typeof params.publishable === 'undefined' || params.publishable !== Boolean(info.publishableErrors?.length)) &&
          (typeof params.requester === 'undefined' ||
            (params.requester === ANY_OPTION.value && info.requesterEntry) ||
            (params.requester === NONE_OPTION.value && !info.requesterEntry) ||
            info.requesterEntry?.[0] === params.requester) &&
          (typeof params.original === 'undefined' || params.original !== Boolean(info.refId)) &&
          (typeof params.type === 'undefined' || info.type === params.type) &&
          (typeof params.tag === 'undefined' || info.tags?.includes(params.tag)) &&
          (typeof params.author === 'undefined' || info.authorEntries.some(([id]) => id === params.author)) &&
          (typeof params.location === 'undefined' ||
            (params.location === ANY_OPTION.value && info.location) ||
            (params.location === NONE_OPTION.value && !info.location) ||
            (info.location && isNestedLocation(info.location.title, params.location))) &&
          (typeof params.mark === 'undefined' || info.mark === params.mark) &&
          (typeof params.violation === 'undefined' ||
            (params.violation === ANY_OPTION.value && info.violation) ||
            (params.violation === NONE_OPTION.value && !info.violation) ||
            info.violation === params.violation) &&
          search(searchTokens, [info.title, info.titleRu, info.description, info.descriptionRu]),
      ),
    );
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

  if (params.type) {
    result.push(`${params.type}${count !== 1 ? 's' : ''}`);
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

  if (params.requester) {
    if (params.requester === ANY_OPTION.value) {
      result.push('requested');
    } else if (params.requester === NONE_OPTION.value) {
      result.push('unprompted');
    } else {
      result.push(`requested by "${params.requester}"`);
    }
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
      result.push(`with "${POST_VIOLATIONS[params.violation].title}" violation`);
    }
  }

  if (sortOption) {
    result.push(`sorted by "${sortOption.label}" ${params.sortDirection === 'asc' ? 'ascending' : 'descending'}`);
  }

  return result.join(' ');
}
