import type { PageContext } from 'vike/types';
import { createUserLinks } from '../../../core/entities/user.js';
import { createUserInfo } from '../../../core/entities/user-info.js';
import { services } from '../../../core/services/index.js';
import { localDataExtractor } from '../../../local/data-managers/extractor.js';
import { postsManagers } from '../../../local/data-managers/posts.js';
import { users } from '../../../local/data-managers/users.js';
import type { UserPageData } from '../../components/UserPage/UserPage.js';

export async function data(pageContext: PageContext): Promise<UserPageData> {
  if (!pageContext.routeParams?.id) {
    return {};
  }

  const userEntry = await users.getEntry(pageContext.routeParams.id);

  return {
    userInfo: await createUserInfo(userEntry, postsManagers),
    userLinks: await createUserLinks(userEntry, services),
    lastPostInfo: await localDataExtractor.selectPostInfo('posts', {
      author: pageContext.routeParams.id,
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastOriginalPostInfo: await localDataExtractor.selectPostInfo('posts', {
      author: pageContext.routeParams.id,
      original: true,
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    firstPostInfo: await localDataExtractor.selectPostInfo('posts', {
      author: pageContext.routeParams.id,
      sortKey: 'date',
      sortDirection: 'asc',
    }),
    topRatedPostInfo: await localDataExtractor.selectPostInfo('posts', {
      author: pageContext.routeParams.id,
      sortKey: 'rating',
      sortDirection: 'desc',
    }),
    editorsChoicePostInfo: await localDataExtractor.selectPostInfo('posts', {
      author: pageContext.routeParams.id,
      original: true,
      sortKey: 'mark',
      sortDirection: 'desc',
    }),
    topLikedPostInfo: await localDataExtractor.selectPostInfo('posts', {
      author: pageContext.routeParams.id,
      sortKey: 'likes',
      sortDirection: 'desc',
    }),
    lessLikedPostInfo: await localDataExtractor.selectPostInfo('posts', {
      author: pageContext.routeParams.id,
      sortKey: 'likes',
      sortDirection: 'asc',
    }),
    lastFulfilledPostInfo: await localDataExtractor.selectPostInfo('posts', {
      author: pageContext.routeParams.id,
      requester: 'any',
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastProposedPostInfo: await localDataExtractor.selectPostInfo('inbox', {
      author: pageContext.routeParams.id,
      requester: 'none',
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastRequestedPostInfo: await localDataExtractor.selectPostInfo('inbox', {
      requester: pageContext.routeParams.id,
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastRejectedPostInfo: await localDataExtractor.selectPostInfo('trash', {
      author: pageContext.routeParams.id,
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastRejectedRequestInfo: await localDataExtractor.selectPostInfo('trash', {
      requester: pageContext.routeParams.id,
      sortKey: 'date',
      sortDirection: 'desc',
    }),
  };
}
