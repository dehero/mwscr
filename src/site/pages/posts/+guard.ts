import { render } from 'vike/abort';
import type { GuardAsync } from 'vike/types';
import type { PostsPageParams } from '../../components/PostsPage/PostsPage.data.js';
import { postsRoute } from '../../routes/posts-route.js';

export const guard: GuardAsync = async (pageContext): ReturnType<GuardAsync> => {
  if (!postsRoute.guard?.(pageContext.routeParams as PostsPageParams)) {
    throw render(404);
  }
};
