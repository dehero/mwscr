import type { PageContext } from 'vike/types';
import {
  comparePostEntriesById,
  comparePostEntriesByLikes,
  comparePostEntriesByRating,
} from '../../../core/entities/post.js';
import { createUserInfo } from '../../../core/entities/user.js';
import { inbox, published, trash } from '../../../local/data-managers/posts.js';
import { users } from '../../../local/data-managers/users.js';
import type { UserPageData } from '../../components/UserPage/UserPage.js';
import { getUserPostInfo } from './+onBeforePrerenderStart.js';

export async function data(pageContext: PageContext): Promise<UserPageData> {
  if (!pageContext.routeParams?.id) {
    return {};
  }

  return {
    userInfo: await createUserInfo(await users.getEntry(pageContext.routeParams.id), published, inbox, trash),
    lastPostInfo: await getUserPostInfo(pageContext.routeParams.id, comparePostEntriesById('desc')),
    firstPostInfo: await getUserPostInfo(pageContext.routeParams.id, comparePostEntriesById('asc')),
    topRatedPostInfo: await getUserPostInfo(pageContext.routeParams.id, comparePostEntriesByRating('desc')),
    topLikedPostInfo: await getUserPostInfo(pageContext.routeParams.id, comparePostEntriesByLikes('desc')),
    lessLikedPostInfo: await getUserPostInfo(pageContext.routeParams.id, comparePostEntriesByLikes('asc')),
  };
}
