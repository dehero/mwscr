import { render } from 'vike/abort';
import type { GuardAsync } from 'vike/types';
import type { PostsRouteParams } from '../../routes/posts-route.js';
import { postsRoute } from '../../routes/posts-route.js';

export const guard: GuardAsync = async (pageContext): ReturnType<GuardAsync> => {
  if (!postsRoute.guard?.(pageContext.routeParams as PostsRouteParams)) {
    throw render(404);
  }
};
