import type { OnBeforePrerenderStartAsync } from 'vike/types';
import { createUserLinks } from '../../../core/entities/user.js';
import { createUserInfo } from '../../../core/entities/user-info.js';
import { services } from '../../../core/services/index.js';
import { localDataExtractor } from '../../../local/data-managers/extractor.js';
import { postsManagers } from '../../../local/data-managers/posts.js';
import { users } from '../../../local/data-managers/users.js';
import type { UserPageData } from '../../components/UserPage/UserPage.js';
import { userRoute } from '../../routes/user-route.js';

export async function onBeforePrerenderStart(): ReturnType<OnBeforePrerenderStartAsync<UserPageData>> {
  const entries = await users.getAllEntries(true);

  return Promise.all(
    entries.map(async (userEntry) => {
      const userInfo = await createUserInfo(userEntry, postsManagers);
      const userLinks = await createUserLinks(userEntry, services);

      return {
        url: userRoute.createUrl({ id: userInfo.id }),
        pageContext: {
          data: {
            userInfo,
            userLinks,
            lastPostInfo: await localDataExtractor.selectPostInfo('posts', {
              author: userInfo.id,
              sortKey: 'date',
              sortDirection: 'desc',
            }),
            lastOriginalPostInfo: await localDataExtractor.selectPostInfo('posts', {
              author: userInfo.id,
              original: true,
              sortKey: 'date',
              sortDirection: 'desc',
            }),
            firstPostInfo: await localDataExtractor.selectPostInfo('posts', {
              author: userInfo.id,
              sortKey: 'date',
              sortDirection: 'asc',
            }),
            topRatedPostInfo: await localDataExtractor.selectPostInfo('posts', {
              author: userInfo.id,
              sortKey: 'rating',
              sortDirection: 'desc',
            }),
            editorsChoicePostInfo: await localDataExtractor.selectPostInfo('posts', {
              author: userInfo.id,
              original: true,
              sortKey: 'mark',
              sortDirection: 'desc',
            }),
            topLikedPostInfo: await localDataExtractor.selectPostInfo('posts', {
              author: userInfo.id,
              sortKey: 'likes',
              sortDirection: 'desc',
            }),
            lessLikedPostInfo: await localDataExtractor.selectPostInfo('posts', {
              author: userInfo.id,
              sortKey: 'likes',
              sortDirection: 'asc',
            }),
            lastFulfilledPostInfo: await localDataExtractor.selectPostInfo('posts', {
              author: userInfo.id,
              requester: 'any',
              sortKey: 'date',
              sortDirection: 'desc',
            }),
            lastProposedPostInfo: await localDataExtractor.selectPostInfo('inbox', {
              author: userInfo.id,
              requester: 'none',
              sortKey: 'date',
              sortDirection: 'desc',
            }),
            lastRequestedPostInfo: await localDataExtractor.selectPostInfo('inbox', {
              requester: userInfo.id,
              sortKey: 'date',
              sortDirection: 'desc',
            }),
            lastRejectedPostInfo: await localDataExtractor.selectPostInfo('trash', {
              author: userInfo.id,
              sortKey: 'date',
              sortDirection: 'desc',
            }),
            lastRejectedRequestInfo: await localDataExtractor.selectPostInfo('trash', {
              requester: userInfo.id,
              sortKey: 'date',
              sortDirection: 'desc',
            }),
          },
        },
      };
    }),
  );
}
