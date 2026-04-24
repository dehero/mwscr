import type { RoutePreloadFuncArgs, RouteSectionProps } from '@solidjs/router';
import { cleanupUndefinedProps } from '../utils/common-utils.js';
import type { Component, JSX } from 'solid-js';

const SITE_ROUTE_FRAGMENT_REGEX = /^#([^?]+)(\?.+)?$/;

export interface SiteRouteMeta {
  title: string;
  description?: string;
  label?: string;
  imageUrl?: string | string[];
}

export type SiteRouteParams = Record<string, string | undefined>; //string[] | undefined>;

export interface SiteRoutePreloadArgs<TParams extends SiteRouteParams> extends RoutePreloadFuncArgs {
  params: TParams;
}

export type SiteRoutePreload<TParams extends SiteRouteParams, TData extends unknown> = (
  args: SiteRoutePreloadArgs<TParams>,
) => Promise<TData | undefined>;

export interface SiteRouteFragment {
  pathname?: string;
  searchParams?: SiteRouteParams;
}

export interface SiteRoute<TParams extends SiteRouteParams = SiteRouteParams, TData extends unknown = unknown> {
  path: string;
  info: (params: TParams) => SiteRouteMeta;
  component: SiteRoutePage<TParams, TData>;
  preload: SiteRoutePreload<TParams, TData>;
  createUrl: (params: TParams, data?: TData) => string;
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
