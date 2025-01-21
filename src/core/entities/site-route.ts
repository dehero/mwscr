import { cleanupUndefinedProps } from '../utils/common-utils.js';
import type { DataManager } from './data-manager.js';

const SITE_ROUTE_FRAGMENT_REGEX = /^#([^?]+)(\?.+)?$/;

export interface SiteRouteMeta {
  title: string;
  description?: string;
  label?: string;
  imageUrl?: string | string[];
}

export type SiteRouteParams = Record<string, string | undefined>;

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
}

export interface SiteRouteInfo<TParams extends SiteRouteParams, TData, TMeta extends SiteRouteMeta> {
  meta: () => TMeta;
  data: () => TData;
  params: () => TParams;
}

export function parseSiteRouteFragment(fragment: string): SiteRouteFragment {
  const [, pathname, search] = SITE_ROUTE_FRAGMENT_REGEX.exec(fragment) ?? [];
  const searchParams = Object.fromEntries(new URLSearchParams(search));

  return { pathname, searchParams };
}

export function stringifySiteRouteFragment(fragment: SiteRouteFragment): string {
  return fragment.pathname
    ? `#${fragment.pathname}${
        fragment.searchParams && Object.keys(fragment.searchParams).length > 0
          ? `?${new URLSearchParams(cleanupUndefinedProps(fragment.searchParams) as Record<string, string>)}`
          : ''
      }`
    : '';
}
