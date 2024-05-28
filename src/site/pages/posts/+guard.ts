import { render } from 'vike/abort';
import type { GuardAsync } from 'vike/types';
import { postsRouteInfos } from '../../routes/posts-route.js';

export const guard: GuardAsync = async (pageContext): ReturnType<GuardAsync> => {
  const { managerName } = pageContext.routeParams;
  if (!managerName || !Object.keys(postsRouteInfos).includes(managerName)) {
    throw render(404);
  }
};
