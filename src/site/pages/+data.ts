import { getPostCommentCount, getPostEntryLikes, POST_RECENTLY_PUBLISHED_DAYS } from '../../core/entities/post.js';
import { createUserInfo } from '../../core/entities/user-info.js';
import { localDataExtractor } from '../../local/data-managers/extractor.js';
import { inbox, posts, trash } from '../../local/data-managers/posts.js';
import { users } from '../../local/data-managers/users.js';
import type { HomePageData } from '../components/HomePage/HomePage.js';

export async function data(): Promise<HomePageData> {
  const userInfos = await Promise.all(
    (await users.getAllEntries()).map((entry) => createUserInfo(entry, posts, inbox, trash)),
  );

  const authorCount = userInfos.reduce((acc, userInfo) => acc + (userInfo.roles.includes('author') ? 1 : 0), 0);
  const requesterCount = userInfos.reduce((acc, userInfo) => acc + (userInfo.roles.includes('requester') ? 1 : 0), 0);

  const recentPostInfos = await localDataExtractor.selectPostInfos(
    'posts',
    { sortKey: 'date', sortDirection: 'desc' },
    POST_RECENTLY_PUBLISHED_DAYS,
  );

  const totalLikes = (await posts.getAllEntries()).reduce((acc, entry) => acc + getPostEntryLikes(entry), 0);
  const totalCommentCount = (await posts.getAllEntries(true)).reduce(
    (acc, [, post]) => acc + getPostCommentCount(post),
    0,
  );

  return {
    buildDate: new Date(),
    totalPosts: {
      posted: await posts.getItemCount(),
      pending: await inbox.getItemCount(),
      rejected: await trash.getItemCount(),
    },
    authorCount,
    requesterCount,
    lastOriginalPostInfo: await localDataExtractor.selectPostInfo('posts', {
      original: true,
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    topRatedPostInfo: await localDataExtractor.selectPostInfo('posts', { sortKey: 'rating', sortDirection: 'desc' }),
    editorsChoicePostInfo: await localDataExtractor.selectPostInfo('posts', { sortKey: 'mark', sortDirection: 'desc' }),
    topLikedPostInfo: await localDataExtractor.selectPostInfo('posts', { sortKey: 'likes', sortDirection: 'desc' }),
    lastFulfilledPostInfo: await localDataExtractor.selectPostInfo('posts', {
      requester: 'any',
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastProposedPostInfo: await localDataExtractor.selectPostInfo('inbox', {
      requester: 'none',
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastRequestedPostInfo: await localDataExtractor.selectPostInfo('inbox', {
      requester: 'any',
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    totalLikes,
    totalCommentCount,
    recentPostInfos,
  };
}
