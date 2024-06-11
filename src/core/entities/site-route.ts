export interface SiteRouteInfo {
  title: string;
  label?: string;
}

export type SiteRouteParams = Record<string, string>;

export interface SiteRoute<
  TParams extends SiteRouteParams | undefined,
  TData extends unknown = unknown,
  TInfo extends SiteRouteInfo = SiteRouteInfo,
> {
  path: string;
  createUrl: (params: TParams) => string;
  info: (params: TParams, data?: TData) => TInfo;
  mapParams?: (params: Record<string, string>) => TParams;
}
