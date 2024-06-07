import type { OnBeforePrerenderStartAsync } from 'vike/types';
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
import { userRoute } from '../../routes/user-route.js';
import { getPostInfo } from '../../utils/data-utils.js';

export async function onBeforePrerenderStart(): ReturnType<OnBeforePrerenderStartAsync<UserPageData>> {
  const entries = await users.getAllEntries(true);
  const userInfos = await Promise.all(entries.map((entry) => createUserInfo(entry, published, inbox, trash)));

  return Promise.all(
    userInfos.map(async (userInfo) => {
      const checkAuthor = (post: Post): post is Post => asArray(post.author).includes(userInfo.id);
      const checkRequester = (post: Post): post is Post => post.request?.user === userInfo.id;

      return {
        url: userRoute.createUrl({ id: userInfo.id }),
        pageContext: {
          data: {
            userInfo,
            lastPostInfo: await getPostInfo(published, comparePostEntriesById('desc'), checkAuthor),
            lastOriginalPostInfo: await getPostInfo(published, comparePostEntriesById('desc'), checkAuthor, true),
            firstPostInfo: await getPostInfo(published, comparePostEntriesById('asc'), checkAuthor),
            topRatedPostInfo: await getPostInfo(published, comparePostEntriesByRating('desc'), checkAuthor),
            topLikedPostInfo: await getPostInfo(published, comparePostEntriesByLikes('desc'), checkAuthor),
            lessLikedPostInfo: await getPostInfo(published, comparePostEntriesByLikes('asc'), checkAuthor),
            lastFulfilledPostInfo: await getPostInfo(published, comparePostEntriesById('desc'), checkRequester),
            lastProposedPostInfo: await getPostInfo(inbox, comparePostEntriesById('desc'), [isPostDraft, checkAuthor]),
            lastRequestedPostInfo: await getPostInfo(inbox, comparePostEntriesById('desc'), [
              isPostRequest,
              checkRequester,
            ]),
            lastRejectedPostInfo: await getPostInfo(trash, comparePostEntriesById('desc'), [isPostDraft, checkAuthor]),
            lastRejectedRequestInfo: await getPostInfo(trash, comparePostEntriesById('desc'), [
              isPostRequest,
              checkRequester,
            ]),
          },
        },
      };
    }),
  );
}
