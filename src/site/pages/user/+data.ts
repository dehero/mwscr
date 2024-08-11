import type { PageContext } from 'vike/types';
import type { Post } from '../../../core/entities/post.js';
import {
  comparePostEntriesByDate,
  comparePostEntriesByLikes,
  comparePostEntriesByMark,
  comparePostEntriesByRating,
} from '../../../core/entities/post.js';
import { isPostDraft, isPostRequest } from '../../../core/entities/post-variation.js';
import { createUserInfo, createUserLinks } from '../../../core/entities/user.js';
import { services } from '../../../core/services/index.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { getPostInfo, inbox, posts, trash } from '../../../local/data-managers/posts.js';
import { users } from '../../../local/data-managers/users.js';
import type { UserPageData } from '../../components/UserPage/UserPage.js';

export async function data(pageContext: PageContext): Promise<UserPageData> {
  if (!pageContext.routeParams?.id) {
    return {};
  }

  const userEntry = await users.getEntry(pageContext.routeParams.id);
  const checkAuthor = (post: Post): post is Post => asArray(post.author).includes(pageContext.routeParams?.id || '');
  const checkRequester = (post: Post): post is Post => post.request?.user === pageContext.routeParams?.id;

  return {
    userInfo: await createUserInfo(userEntry, posts, inbox, trash),
    userLinks: await createUserLinks(userEntry, services),
    lastPostInfo: await getPostInfo(posts, comparePostEntriesByDate('desc'), checkAuthor),
    lastOriginalPostInfo: await getPostInfo(posts, comparePostEntriesByDate('desc'), checkAuthor, true),
    firstPostInfo: await getPostInfo(posts, comparePostEntriesByDate('asc'), checkAuthor),
    topRatedPostInfo: await getPostInfo(posts, comparePostEntriesByRating('desc'), checkAuthor),
    editorsChoicePostInfo: await getPostInfo(posts, comparePostEntriesByMark('desc'), [checkAuthor], true),
    topLikedPostInfo: await getPostInfo(posts, comparePostEntriesByLikes('desc'), checkAuthor),
    lessLikedPostInfo: await getPostInfo(posts, comparePostEntriesByLikes('asc'), checkAuthor),
    lastFulfilledPostInfo: await getPostInfo(posts, comparePostEntriesByDate('desc'), checkRequester),
    lastProposedPostInfo: await getPostInfo(inbox, comparePostEntriesByDate('desc'), [isPostDraft, checkAuthor]),
    lastRequestedPostInfo: await getPostInfo(inbox, comparePostEntriesByDate('desc'), [isPostRequest, checkRequester]),
    lastRejectedPostInfo: await getPostInfo(trash, comparePostEntriesByDate('desc'), [isPostDraft, checkAuthor]),
    lastRejectedRequestInfo: await getPostInfo(trash, comparePostEntriesByDate('desc'), [
      isPostRequest,
      checkRequester,
    ]),
  };
}
