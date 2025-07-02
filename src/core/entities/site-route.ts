import { cleanupUndefinedProps } from '../utils/common-utils.js';
import type { DataManager } from './data-manager.js';

const SITE_ROUTE_FRAGMENT_REGEX = /^#([^?]+)(\?.+)?$/;

export interface SiteRouteMeta {
  title: string;
  description?: string;
  label?: string;
  imageUrl?: string | string[];
}

export type SiteRouteParams = Record<string, string | string[] | undefined>;

export interface SiteRouteFragment {
  pathname?: string;
  searchParams?: SiteRouteParams;
}

export interface SiteRoute<
  TParams extends SiteRouteParams = SiteRouteParams,
  TData extends unknown = unknown,
  TMeta extends SiteRouteMeta = SiteRouteMeta,
> {
  path: string;
  guard?: (params: TParams) => boolean;
  createUrl: (params: TParams) => string;
  meta: (params: TParams, data?: TData) => TMeta;
  mapParams?: (params: Record<string, string>) => TParams;
  getData: (dataManager: DataManager, params: TParams) => Promise<TData>;
  // dynamic?: boolean;
}

export interface SiteRouteInfo<TParams extends SiteRouteParams, TData, TMeta extends SiteRouteMeta> {
  meta: () => TMeta;
  data: () => TData;
  params: () => TParams;
  loading: () => boolean;
}

export function parseSiteRouteFragment(fragment: string): SiteRouteFragment {
  const [, pathname, search] = SITE_ROUTE_FRAGMENT_REGEX.exec(fragment) ?? [];
  const entries = [...new URLSearchParams(search)];
  const searchParams: SiteRouteParams = {};

  for (const [key, value] of entries) {
    const searchParam = searchParams[key];
    if (typeof searchParam === 'undefined') {
      searchParams[key] = value;
    } else if (Array.isArray(searchParam)) {
      searchParams[key] = [...searchParam, value];
    } else {
      searchParams[key] = [searchParam, value];
    }
  }

  return { pathname, searchParams };
}

export function stringifySiteRouteFragment(fragment: SiteRouteFragment): string {
  const searchParams = new URLSearchParams(
    Object.entries(cleanupUndefinedProps(fragment.searchParams as Record<string, unknown>)).flatMap(([key, value]) =>
      Array.isArray(value) ? value.map((item) => [key, item]) : [[key, value]],
    ),
  );

  return fragment.pathname ? `#${fragment.pathname}${searchParams.size > 0 ? `?${searchParams}` : ''}` : '';
}
