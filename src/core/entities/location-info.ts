import type { EntitySelection, SortDirection } from '../utils/common-types.js';
import { cleanupUndefinedProps, getSearchTokens, search } from '../utils/common-utils.js';
import type { ListReaderEntry } from './list-manager.js';
import type { Location, LocationCell, LocationType } from './location.js';
import { isNestedLocation } from './location.js';
import type { Option } from './option.js';
import type { PostAddon } from './post.js';
import type { PostsManager } from './posts-manager.js';
import type { PostsUsage } from './posts-usage.js';
import { createPostsUsage } from './posts-usage.js';
import { locationCellToWorldMapPolygon } from './world-map.js';

export interface LocationInfo {
  title: string;
  titleRu?: string;
  type: LocationType;
  addon?: PostAddon;
  cell?: LocationCell | LocationCell[];
  discovered?: PostsUsage;
  worldMapSvg?: string;
}

export type LocationInfoComparator = (a: LocationInfo, b: LocationInfo) => number;

export interface SelectLocationInfoSortOption extends Option {
  fn: (direction: SortDirection) => LocationInfoComparator;
}

export interface SelectLocationInfosParams {
  discovered?: boolean;
  type?: LocationType;
  search?: string;
  sortKey: SelectLocationInfosSortKey;
  sortDirection: SortDirection;
}

export type LocationInfoSelection = EntitySelection<LocationInfo, SelectLocationInfosParams>;

export const selectLocationInfosSortOptions = [
  { value: 'title', label: 'Title', fn: compareLocationInfosByTitle },
  { value: 'postCount', label: 'Post Count', fn: compareLocationInfosByPostCount },
] as const satisfies SelectLocationInfoSortOption[];

export type SelectLocationInfosSortKey = (typeof selectLocationInfosSortOptions)[number]['value'];

export async function createLocationInfo(
  locationEntry: ListReaderEntry<Location>,
  postManagers?: PostsManager[],
): Promise<LocationInfo> {
  const [id, location] = locationEntry;
  let discovered;

  if (postManagers) {
    discovered = await createPostsUsage(postManagers, 'getLocationsUsageStats', (location) =>
      isNestedLocation(location, id),
    );
  }

  return cleanupUndefinedProps({
    title: location.title,
    titleRu: location.titleRu,
    type: location.type,
    addon: location.addon,
    cell: location.cell,
    discovered,
    worldMapSvg: locationCellToWorldMapPolygon(location.cell)?.svg(),
  });
}

export function compareLocationInfosByTitle(direction: SortDirection): LocationInfoComparator {
  return direction === 'asc' ? (a, b) => a.title.localeCompare(b.title) : (a, b) => b.title.localeCompare(a.title);
}

export function compareLocationInfosByPostCount(direction: SortDirection): LocationInfoComparator {
  const byTitle = compareLocationInfosByTitle(direction);

  return direction === 'asc'
    ? (a, b) => (a.discovered?.posts ?? 0) - (b.discovered?.posts ?? 0) || byTitle(a, b)
    : (a, b) => (b.discovered?.posts ?? 0) - (a.discovered?.posts ?? 0) || byTitle(a, b);
}

export function selectLocationInfos(locationInfos: LocationInfo[], params: SelectLocationInfosParams, limit?: number) {
  const localParams: SelectLocationInfosParams = { ...params, sortKey: 'title', sortDirection: 'desc' };

  const comparator =
    selectLocationInfosSortOptions.find((comparator) => comparator.value === params.sortKey)?.fn ??
    compareLocationInfosByTitle;
  const searchTokens = getSearchTokens(params.search);

  const items = locationInfos
    .filter(
      (info) =>
        (typeof params.discovered === 'undefined' || Boolean(info.discovered?.posts) === params.discovered) &&
        (typeof params.type === 'undefined' || info.type === params.type) &&
        search(searchTokens, [info.title]),
    )
    .sort(comparator(params.sortDirection));

  return {
    items: typeof limit === 'undefined' ? items : items.slice(0, limit),
    params: localParams,
    totalCount: items.length,
  };
}

export function selectLocationInfosResultToString(count: number, params: SelectLocationInfosParams) {
  const result: string[] = [count.toString()];
  const sortOption = selectLocationInfosSortOptions.find((comparator) => comparator.value === params.sortKey);

  if (typeof params.discovered !== 'undefined') {
    if (params.discovered) {
      result.push('discovered');
    } else {
      result.push('uncharted');
    }
  }

  if (params.type) {
    result.push(`${params.type}${count !== 1 ? 's' : ''}`);
  } else {
    result.push(`location${count !== 1 ? 's' : ''}`);
  }

  if (params.search) {
    result.push(`with "${params.search}" in title`);
  }

  if (sortOption) {
    result.push(`sorted by "${sortOption.label}" ${params.sortDirection === 'asc' ? 'ascending' : 'descending'}`);
  }

  return result.join(' ');
}
