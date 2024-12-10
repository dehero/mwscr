import type { DataExtractor } from './data-extractor.js';

export interface SiteRouteMeta {
  title: string;
  description?: string;
  label?: string;
  imageUrl?: string | string[];
}

export type SiteRouteParams = Record<string, string | undefined>;

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
  getData: (dataExtractor: DataExtractor, params: TParams) => Promise<TData>;
}

export interface SiteRouteInfo<TParams extends SiteRouteParams, TData, TMeta extends SiteRouteMeta> {
  meta: () => TMeta;
  data: () => TData;
  params: () => TParams;
  pathname: () => string;
}
