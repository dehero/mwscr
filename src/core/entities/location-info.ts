import { texts } from '../texts/index.ts';
import type { SortDirection } from '../utils/common-types.ts';
import { arrayFromAsync, asArray, cleanupUndefinedProps, getSearchTokens, search } from '../utils/common-utils.ts';
import { localField, localize } from '../utils/intl-utils.ts';
import type { DataManager } from './data-manager.ts';
import type { IntlText, Locale } from './intl.ts';
import type { Location, LocationCell, LocationType } from './location.ts';
import { isNestedLocation } from './location.ts';
import type { Option } from './option.ts';
import { type PostAddon, postAddonDescriptors } from './post.ts';
import type { PostsUsage } from './posts-usage.ts';
import { createPostsUsage } from './posts-usage.ts';
import { locationToWorldMapPolygonSvg } from './world-map.ts';

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
  fn: (direction: SortDirection, locale: Locale) => LocationInfoComparator;
}

export interface SelectLocationInfosParams {
  discovered?: boolean;
  type?: LocationType;
  search?: string;
  sortKey: SelectLocationInfosSortKey;
  sortDirection: SortDirection;
  locale: Locale;
}

export const selectLocationInfosSortOptions = [
  { value: 'title', label: texts.location.title, fn: compareLocationInfosByTitle },
  { value: 'postCount', label: texts.metrics.postCount, fn: compareLocationInfosByPostCount },
] as const satisfies SelectLocationInfoSortOption[];

export type SelectLocationInfosSortKey = (typeof selectLocationInfosSortOptions)[number]['value'];

export async function createLocationInfos(dataManager: DataManager): Promise<LocationInfo[]> {
  const unofficialLocations: Map<string, PostAddon> = new Map();

  for (const manager of dataManager.postsManagers) {
    const entries = await manager.getAllEntries();
    for (const [, post] of entries) {
      if (
        post.addon &&
        !postAddonDescriptors[post.addon].official &&
        typeof post.location === 'string' &&
        !unofficialLocations.has(post.location)
      ) {
        unofficialLocations.set(post.location, post.addon);
      }
    }
  }

  const entries = [
    ...(await arrayFromAsync(dataManager.locations.readAllEntries())),
    ...[...unofficialLocations].map(([title, addon]): [string, Location] => [title, { title, type: 'virtual', addon }]),
  ];

  return Promise.all(
    entries.map(async (entry) => {
      const [id, location] = entry;
      const discovered = await createPostsUsage(dataManager.postsManagers, 'getLocationsUsageStats', (location) =>
        isNestedLocation(location, id),
      );

      return cleanupUndefinedProps({
        title: location.title,
        titleRu: location.titleRu,
        type: location.type,
        addon: location.addon,
        cell: location.cell,
        discovered,
        worldMapSvg: locationToWorldMapPolygonSvg(location),
      });
    }),
  );
}

export function findWorldMapLocationInfo(
  locationInfos: LocationInfo[],
  titles: string | string[],
): LocationInfo | undefined {
  const worldMapLocationInfos = locationInfos
    .filter((info) => info.cell)
    .sort((a, b) => b.title.length - a.title.length);
  const ids = new Set(asArray(titles));
  const matchingLocationInfos = locationInfos.filter((info) => ids.has(info.title));

  if (matchingLocationInfos.length === 0) {
    return undefined;
  }

  for (const info of matchingLocationInfos) {
    if (!info.cell) {
      const result = worldMapLocationInfos.find((worldMapInfo) => isNestedLocation(info.title, worldMapInfo.title));
      if (result) {
        return result;
      }
    } else {
      return info;
    }
  }

  return undefined;
}

export function compareLocationInfosByTitle(direction: SortDirection, locale: Locale): LocationInfoComparator {
  const getTitle = (info: LocationInfo) => localField(info, 'title', locale) ?? '';

  return direction === 'asc'
    ? (a, b) => getTitle(a).localeCompare(getTitle(b))
    : (a, b) => getTitle(b).localeCompare(getTitle(a));
}

export function compareLocationInfosByPostCount(direction: SortDirection, locale: Locale): LocationInfoComparator {
  const byTitle = compareLocationInfosByTitle(direction, locale);

  return direction === 'asc'
    ? (a, b) => (a.discovered?.posts ?? 0) - (b.discovered?.posts ?? 0) || byTitle(a, b)
    : (a, b) => (b.discovered?.posts ?? 0) - (a.discovered?.posts ?? 0) || byTitle(a, b);
}

export function selectLocationInfos(locationInfos: LocationInfo[], params: SelectLocationInfosParams) {
  const comparator =
    selectLocationInfosSortOptions.find((comparator) => comparator.value === params.sortKey)?.fn ??
    compareLocationInfosByTitle;
  const searchTokens = getSearchTokens(params.search);

  return locationInfos
    .filter(
      (info) =>
        (typeof params.discovered === 'undefined' || Boolean(info.discovered?.posts) === params.discovered) &&
        (typeof params.type === 'undefined' || info.type === params.type) &&
        search(searchTokens, [info.title, info.titleRu]),
    )
    .sort(comparator(params.sortDirection, params.locale));
}

export function getLocationTypeUnitText(type: LocationType, count: number, locale: Locale) {
  const entries = {
    interior: texts.locationFilter.interiorUnit,
    exterior: texts.locationFilter.exteriorUnit,
    region: texts.locationFilter.regionUnit,
    virtual: texts.locationFilter.groupUnit,
  } as const satisfies Record<LocationType, IntlText>;

  return localize(entries[type], locale, { count });
}

export function selectLocationInfosResultToString(count: number, params: SelectLocationInfosParams) {
  const result: string[] = [count.toString()];
  const sortOption = selectLocationInfosSortOptions.find((comparator) => comparator.value === params.sortKey);

  if (typeof params.discovered !== 'undefined') {
    result.push(
      localize(params.discovered ? texts.locationFilter.visited : texts.locationFilter.unvisited, params.locale, {
        count,
      }),
    );
  }

  if (params.type) {
    result.push(getLocationTypeUnitText(params.type, count, params.locale));
  } else {
    result.push(localize(texts.locationFilter.locationUnit, params.locale, { count }));
  }

  if (params.search) {
    result.push(localize(texts.locationFilter.withSearch, params.locale, { search: params.search }));
  }

  if (sortOption) {
    const label = localize(sortOption.label, params.locale);
    const direction = localize(
      params.sortDirection === 'asc' ? texts.locationFilter.asc : texts.locationFilter.desc,
      params.locale,
    );

    result.push(localize(texts.locationFilter.sortedBy, params.locale, { label, direction }));
  }

  return result.join(' ');
}
