import { createMemo, createResource, createSignal } from 'solid-js';
import { isServer } from 'solid-js/web';
import type { PageContext } from 'vike/types';
import type { SiteRoute, SiteRouteInfo, SiteRouteMeta, SiteRouteParams } from '../../core/entities/site-route.js';
import { dataManager } from '../data-managers/manager.js';
import { resolveFirstRoute } from '../routes/index.js';
import { useLocalPatch } from './useLocalPatch.js';

export function useRouteInfo<TParams extends SiteRouteParams, TData, TMeta extends SiteRouteMeta>(
  pageContext: PageContext,
  route?: SiteRoute<TParams, TData, TMeta>,
): SiteRouteInfo<TParams, TData, TMeta> {
  const currentRouteMatch = () => resolveFirstRoute(pageContext.urlPathname);
  const params = () => currentRouteMatch().params as TParams;

  const serverData = () => pageContext.data as TData;
  const [patchSize, setPatchSize] = createSignal(0);

  const [clientData, { refetch: refetchClientData }] = createResource(
    () => (!isServer && route && patchSize() > 0 ? params() : false),
    async (params) => route!.getData(dataManager, params),
    { initialValue: serverData(), ssrLoadFrom: 'initial' },
  );

  useLocalPatch((patchSize) => {
    setPatchSize(patchSize);
    refetchClientData();
  });

  const data = createMemo(() => (patchSize() > 0 ? clientData() : serverData()));

  const meta = createMemo(() => {
    const { route, params } = currentRouteMatch();
    return route.meta(params as TParams, data()) as TMeta;
  });

  const loading = createMemo(() => clientData.loading);

  return { meta, data, params, loading };
}
