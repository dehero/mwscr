import type { MatchFilters, RoutePreloadFuncArgs, RouteSectionProps } from '@solidjs/router';
import type { Component } from 'solid-js';
import { cleanupUndefinedProps } from '../utils/common-utils.js';

const SITE_ROUTE_FRAGMENT_REGEX = /^#([^?]+)(\?.+)?$/;

export interface SiteRouteMeta {
  title: string;
  description?: string;
  label?: string;
  imageUrl?: string | string[];
}

export type SiteRouteParams = Record<string, string | undefined>;

export interface SiteRoutePreloadArgs<TParams extends SiteRouteParams> extends RoutePreloadFuncArgs {
  params: TParams;
}

export type SiteRoutePreload<TParams extends SiteRouteParams, TData extends unknown> = (
  args: SiteRoutePreloadArgs<TParams>,
) => Promise<TData | undefined>;

export interface SiteRouteFragment {
  pathname?: string;
  searchParams?: Record<string, string | string[] | undefined>;
}

export interface SiteRouteParent<
  TRoute extends SiteRoute<any, any> = SiteRoute<any, any>,
  TParams extends SiteRouteParams = SiteRouteParams,
> {
  route: TRoute;
  params: TParams;
}

export interface SiteRoute<TParams extends SiteRouteParams = SiteRouteParams, TData extends unknown = unknown> {
  path: string;
  info: (params: TParams) => SiteRouteMeta;
  component: SiteRoutePage<TParams, TData>;
  preload?: SiteRoutePreload<TParams, TData>;
  createUrl: (params: TParams) => string;
  matchFilters?: MatchFilters<string>;
  parent?: (params: TParams) => SiteRouteParent<SiteRoute<any, any>> | undefined;
}

export interface SiteRoutePageProps<TParams extends SiteRouteParams, TData extends unknown>
  extends RouteSectionProps<Promise<TData | undefined>> {
  params: TParams;
}

export type SiteRoutePage<TParams extends SiteRouteParams, TData extends unknown> = Component<
  SiteRoutePageProps<TParams, TData>
>;

export function parseSiteRouteFragment(fragment: string): SiteRouteFragment {
  const [, pathname, search] = SITE_ROUTE_FRAGMENT_REGEX.exec(fragment) ?? [];
  const entries = [...new URLSearchParams(search)];
  const searchParams: Record<string, string | string[] | undefined> = {};

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
