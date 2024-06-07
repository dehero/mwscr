import type { PageContext } from 'vike/types';
import type { Post } from '../../../core/entities/post.js';
import {
  comparePostEntriesById,
  comparePostEntriesByLikes,
  comparePostEntriesByRating,
} from '../../../core/entities/post.js';
import { isPostDraft, isPostRequest } from '../../../core/entities/post-variation.js';
import { createUserInfo } from '../../../core/entities/user.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { inbox, published, trash } from '../../../local/data-managers/posts.js';
import { users } from '../../../local/data-managers/users.js';
import type { UserPageData } from '../../components/UserPage/UserPage.js';
import { getPostInfo } from '../../utils/data-utils.js';

export async function data(pageContext: PageContext): Promise<UserPageData> {
  if (!pageContext.routeParams?.id) {
    return {};
  }

  const checkAuthor = (post: Post): post is Post => asArray(post.author).includes(pageContext.routeParams?.id || '');
  const checkRequester = (post: Post): post is Post => post.request?.user === pageContext.routeParams?.id;

  return {
    userInfo: await createUserInfo(await users.getEntry(pageContext.routeParams.id), published, inbox, trash),
    lastPostInfo: await getPostInfo(published, comparePostEntriesById('desc'), checkAuthor),
    firstPostInfo: await getPostInfo(published, comparePostEntriesById('asc'), checkAuthor),
    topRatedPostInfo: await getPostInfo(published, comparePostEntriesByRating('desc'), checkAuthor),
    topLikedPostInfo: await getPostInfo(published, comparePostEntriesByLikes('desc'), checkAuthor),
    lessLikedPostInfo: await getPostInfo(published, comparePostEntriesByLikes('asc'), checkAuthor),
    lastFulfilledPostInfo: await getPostInfo(published, comparePostEntriesById('desc'), checkRequester),
    lastProposedPostInfo: await getPostInfo(inbox, comparePostEntriesById('desc'), [isPostDraft, checkAuthor]),
    lastRequestedPostInfo: await getPostInfo(inbox, comparePostEntriesById('desc'), [isPostRequest, checkRequester]),
    lastRejectedPostInfo: await getPostInfo(trash, comparePostEntriesById('desc'), [isPostDraft, checkAuthor]),
    lastRejectedRequestInfo: await getPostInfo(trash, comparePostEntriesById('desc'), [isPostRequest, checkRequester]),
  };
}
