export interface SiteRouteInfo {
  title: string;
  label?: string;
}

export type SiteRouteParams = Record<string, string>;

export interface SiteRoute<TParams extends SiteRouteParams | undefined, TInfo extends SiteRouteInfo = SiteRouteInfo> {
  path: string;
  createUrl: (params: TParams) => string;
  info: (params: TParams) => TInfo;
}
