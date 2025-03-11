import { makeEventListener } from '@solid-primitives/event-listener';
import type { Resource, ResourceFetcher } from 'solid-js';
import { createResource } from 'solid-js';

export function useData<TData>(fetcher: ResourceFetcher<true, TData>): Resource<TData> {
  const [data, { refetch }] = createResource<TData>(fetcher);

  makeEventListener(window, 'storage', refetch);

  return data;
}
