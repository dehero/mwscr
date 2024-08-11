import type { OnBeforePrerenderStartAsync } from 'vike/types';
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
import { userRoute } from '../../routes/user-route.js';

export async function onBeforePrerenderStart(): ReturnType<OnBeforePrerenderStartAsync<UserPageData>> {
  const entries = await users.getAllEntries(true);

  return Promise.all(
    entries.map(async (userEntry) => {
      const userInfo = await createUserInfo(userEntry, posts, inbox, trash);
      const userLinks = await createUserLinks(userEntry, services);
      const checkAuthor = (post: Post): post is Post => asArray(post.author).includes(userInfo.id);
      const checkRequester = (post: Post): post is Post => post.request?.user === userInfo.id;

      return {
        url: userRoute.createUrl({ id: userInfo.id }),
        pageContext: {
          data: {
            userInfo,
            userLinks,
            lastPostInfo: await getPostInfo(posts, comparePostEntriesByDate('desc'), checkAuthor),
            lastOriginalPostInfo: await getPostInfo(posts, comparePostEntriesByDate('desc'), checkAuthor, true),
            firstPostInfo: await getPostInfo(posts, comparePostEntriesByDate('asc'), checkAuthor),
            topRatedPostInfo: await getPostInfo(posts, comparePostEntriesByRating('desc'), checkAuthor),
            editorsChoicePostInfo: await getPostInfo(posts, comparePostEntriesByMark('desc'), checkAuthor, true),
            topLikedPostInfo: await getPostInfo(posts, comparePostEntriesByLikes('desc'), checkAuthor),
            lessLikedPostInfo: await getPostInfo(posts, comparePostEntriesByLikes('asc'), checkAuthor),
            lastFulfilledPostInfo: await getPostInfo(posts, comparePostEntriesByDate('desc'), checkRequester),
            lastProposedPostInfo: await getPostInfo(inbox, comparePostEntriesByDate('desc'), [
              isPostDraft,
              checkAuthor,
            ]),
            lastRequestedPostInfo: await getPostInfo(inbox, comparePostEntriesByDate('desc'), [
              isPostRequest,
              checkRequester,
            ]),
            lastRejectedPostInfo: await getPostInfo(trash, comparePostEntriesByDate('desc'), [
              isPostDraft,
              checkAuthor,
            ]),
            lastRejectedRequestInfo: await getPostInfo(trash, comparePostEntriesByDate('desc'), [
              isPostRequest,
              checkRequester,
            ]),
          },
        },
      };
    }),
  );
}
