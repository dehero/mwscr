import { render } from 'vike/abort';
import type { GuardAsync } from 'vike/types';
import { postsPageInfos } from '../../components/PostsPage/PostsPage.js';

export const guard: GuardAsync = async (pageContext): ReturnType<GuardAsync> => {
  const { managerName } = pageContext.routeParams;
  if (!managerName || !Object.keys(postsPageInfos).includes(managerName)) {
    throw render(404);
  }
};
