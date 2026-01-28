import type { OnBeforePrerenderStartAsync } from 'vike/types';
import { postsManagers } from '../../../scripts/data-managers/posts.js';
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
}
