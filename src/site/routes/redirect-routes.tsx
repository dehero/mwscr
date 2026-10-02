import type { RouteDefinition } from '@solidjs/router';
import { Navigate } from '@solidjs/router';

export type RedirectMap = Record<string, string>;

export const redirects: RedirectMap = {
  '/help/shot-set': '/help/compilation/',
  '/help/wallpaper-v': '/help/wallpaper/',
};

export function createRedirectRoutes(redirectMap: RedirectMap): RouteDefinition[] {
  return Object.entries(redirectMap).map(([path, href]) => ({
    path,
    component: () => <Navigate href={href} />,
  }));
}

export const redirectRoutes = createRedirectRoutes(redirects);
