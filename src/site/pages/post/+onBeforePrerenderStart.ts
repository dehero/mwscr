import type { OnBeforePrerenderStartAsync } from 'vike/types';
// import { SITE_ROUTE_ALL } from '../../../core/entities/site-route.js';
import { postsManagers } from '../../../local/data-managers/posts.js';
import { postRoute } from '../../routes/post-route.js';

export async function onBeforePrerenderStart(): ReturnType<OnBeforePrerenderStartAsync> {
  return (
    await Promise.all(
      postsManagers.map(async (manager) => {
        const entries = await manager.getAllEntries(true);

        return entries.map(([id]) => postRoute.createUrl({ managerName: manager.name, id }));
      }),
    )
  ).flatMap((value) => value);
  // return postsManagers.map((manager) => postRoute.createUrl({ managerName: manager.name, id: SITE_ROUTE_ALL }));
}
