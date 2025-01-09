// import { createResource } from 'solid-js';
// import { isServer } from 'solid-js/web';
// import { resolveRoute } from 'vike/routing';
import { createMemo } from 'solid-js';
import type { PageContext } from 'vike/types';
import type { SiteRoute, SiteRouteInfo, SiteRouteMeta, SiteRouteParams } from '../../core/entities/site-route.js';
import { dataManager } from '../data-managers/manager.js';
import { resolveFirstRoute } from '../routes/index.js';

// const isPatched = false;

export function useRouteInfo<TParams extends SiteRouteParams, TData, TMeta extends SiteRouteMeta>(
  pageContext: PageContext,
  _route?: SiteRoute<TParams, TData, TMeta>,
  _dataExtractor?: DataExtractor,
): SiteRouteInfo<TParams, TData, TMeta> {
  const pathname = () => pageContext.urlPathname;
  const currentRouteMatch = () => resolveFirstRoute(pageContext.urlPathname);
  const params = () => currentRouteMatch().params as TParams;

  const serverData = () => pageContext.data as TData;
  // ?? useData<TData>();
  // const [clientData] = createResource(
  //   // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  //   () => (dataExtractor && !isServer && isPatched ? params() : false),
  //   (params) => (dataExtractor ? route.getData(dataExtractor, params) : serverData),
  // );

  const data =
    // clientData.state !== 'unresolved' && clientData.state !== 'pending' && clientData.state !== 'errored'
    //   ? clientData
    // :
    serverData;

  const meta = createMemo(() => {
    const { route, params } = currentRouteMatch();
    return route.meta(params as TParams, data()) as TMeta;
  });

  return { meta, data, params, pathname };
}
