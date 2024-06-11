import { usePageContext } from 'vike-solid/usePageContext';
import type { SiteRoute, SiteRouteParams } from '../../../core/entities/site-route.js';
import { resolveFirstRoute } from '../../routes/index.js';
import type { ButtonProps } from '../Button/Button.js';
import { Button } from '../Button/Button.js';

export interface RouteButtonPropsWithParams<TParams extends SiteRouteParams, TData> {
  route: SiteRoute<TParams, TData>;
  params: TParams;
  title?: string;
  matchParams?: boolean;
}

export interface RouteButtonPropsWithoutParams {
  route: SiteRoute<undefined>;
  title?: string;
}

export type RouteButtonProps<TParams extends SiteRouteParams, TData> = Omit<
  ButtonProps,
  'href' | 'children' | 'active'
> &
  (RouteButtonPropsWithParams<TParams, TData> | RouteButtonPropsWithoutParams);

export function RouteButton<TParams extends SiteRouteParams, TData = unknown>(props: RouteButtonProps<TParams, TData>) {
  const location = usePageContext().urlParsed;
  const params = () => ('params' in props ? props.params : undefined);
  const info = () => props.route.info(params() as never, undefined as never);
  const url = () => props.route.createUrl(params() as never);
  const current = () => resolveFirstRoute(location.pathname);

  return (
    <Button
      href={url()}
      active={
        props.route.path === current().route?.path &&
        (!('matchParams' in props) ||
          !props.matchParams ||
          Object.entries(params() || {}).every(([key, value]) => current().params?.[key] === value))
      }
    >
      {props.title || info().label || info().title}
    </Button>
  );
}
