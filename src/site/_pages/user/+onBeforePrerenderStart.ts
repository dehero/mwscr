import type { OnBeforePrerenderStartAsync } from 'vike/types';
import { users } from '../../../scripts/data-managers/users.js';
import { userRoute } from '../../routes/user-route.js';

export async function onBeforePrerenderStart(): ReturnType<OnBeforePrerenderStartAsync> {
  const entries = await users.getAllEntries(true);

  return entries.map(([id]) => userRoute.createUrl({ id }));
}
