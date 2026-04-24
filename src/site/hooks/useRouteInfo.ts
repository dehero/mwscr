import { createMemo, createResource } from 'solid-js';
import type { SiteRoute, SiteRouteInfo, SiteRouteMeta, SiteRouteParams } from '../../core/entities/site-route.js';
import { dataManager } from '../data-managers/manager.js';
import { useLocalPatch } from './useLocalPatch.js';
import { useCurrentMatches } from '@solidjs/router';

export function useRouteInfo<TParams extends SiteRouteParams, TData, TMeta extends SiteRouteMeta>(
  route?: SiteRoute<TParams, TData, TMeta>,
): SiteRouteInfo<TParams, TData, TMeta> {
  const matches = useCurrentMatches();
  const currentMatch = createMemo(() => matches()[matches().length - 1]);

  const currentRoute = () => currentMatch()?.route.key as SiteRoute<TParams, TData, TMeta>;
  const params = () => currentMatch()?.params as TParams;

  const [clientData, { refetch: refetchClientData }] = createResource(
    () => (route && params() ? params() : false),
    async (params) => route!.getData(dataManager, params),
  );

  useLocalPatch(refetchClientData);

  const data = createMemo(() => clientData());
  const meta = createMemo(() => currentRoute()?.info(params, data()));

  const loading = createMemo(() => clientData.loading);

  return { meta, data, params, loading };
}
