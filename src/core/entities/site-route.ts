import type { RouteDefinition } from '@solidjs/router';

export interface SiteRouteInfo {
  label: string;
  title?: string;
}

export type SiteRouteParams = Record<string, string>;

export interface SiteRoute<TParams extends SiteRouteParams = SiteRouteParams> extends RouteDefinition {
  createUrl: (params: TParams) => string;
  info: SiteRouteInfo;
}
