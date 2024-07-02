export interface SiteRouteInfo {
  title: string;
  description?: string;
  label?: string;
}

export type SiteRouteParams = Record<string, string | undefined>;

export interface SiteRoute<
  TParams extends SiteRouteParams = SiteRouteParams,
  TData extends unknown = unknown,
  TInfo extends SiteRouteInfo = SiteRouteInfo,
> {
  path: string;
  guard?: (params: TParams) => boolean;
  createUrl: (params: TParams) => string;
  info: (params: TParams, data?: TData) => TInfo;
  mapParams?: (params: Record<string, string>) => TParams;
}
