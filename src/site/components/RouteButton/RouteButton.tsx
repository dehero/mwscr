import { splitProps } from 'solid-js';
import { usePageContext } from 'vike-solid/usePageContext';
import type { SiteRoute, SiteRouteParams } from '../../../core/entities/site-route.js';
import { resolveFirstRoute } from '../../routes/index.js';
import type { ButtonProps } from '../Button/Button.js';
import { Button } from '../Button/Button.js';

export interface RouteButtonProps<TParams extends SiteRouteParams | never, TData>
  extends Omit<ButtonProps, 'href' | 'children' | 'active'> {
  route: SiteRoute<TParams, TData>;
  params?: TParams;
  title?: string;
  matchParams?: TParams extends SiteRouteParams ? boolean : never;
  activeRoutes?: Pick<SiteRoute<TParams>, 'path'>[];
}

export function RouteButton<TParams extends SiteRouteParams, TData = unknown>(props: RouteButtonProps<TParams, TData>) {
  const [local, rest] = splitProps(props, ['route', 'activeRoutes', 'params', 'title', 'matchParams']);

  const location = usePageContext().urlParsed;
  const params = () => ('params' in local ? local.params : undefined);
  const info = () => local.route.info(params() as never, undefined as never);
  const url = () => local.route.createUrl(params() as never);
  const current = () => resolveFirstRoute(location.pathname);
  const activeRoutes = () => local.activeRoutes || [local.route];

  return (
    <Button
      href={url()}
      active={
        activeRoutes().some((route) => route.path === current().route?.path) &&
        (!('matchParams' in local) ||
          !local.matchParams ||
          Object.entries(params() || {}).every(([key, value]) => current().params?.[key] === value))
      }
      {...rest}
    >
      {local.title || info().label || info().title}
    </Button>
  );
}
