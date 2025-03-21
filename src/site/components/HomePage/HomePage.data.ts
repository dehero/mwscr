import type { DataManager } from '../../../core/entities/data-manager.js';
import type { PostInfoSelection } from '../../../core/entities/post-info.js';
import type { PostsUsage } from '../../../core/entities/posts-usage.js';
import { PUBLICATION_IS_RECENT_DAYS } from '../../../core/entities/publication.js';

export interface HomePageData {
  buildDate: Date;
  totalPosts: PostsUsage;
  authorCount: number;
  requesterCount: number;
  lastOriginalPostInfo?: PostInfoSelection;
  topRatedPostInfo?: PostInfoSelection;
  topLikedPostInfo?: PostInfoSelection;
  lastFulfilledPostInfo?: PostInfoSelection;
  lastProposedPostInfo?: PostInfoSelection;
  lastRequestedPostInfo?: PostInfoSelection;
  editorsChoicePostInfo?: PostInfoSelection;
  totalLikes: number;
  totalCommentCount: number;
  recentPostInfos: PostInfoSelection;
}

export async function getHomePageData(dataManager: DataManager): Promise<HomePageData> {
  const userInfos = await dataManager.getAllUserInfos();
  const postInfos = await dataManager.getAllPostInfos('posts');

  const authorCount = userInfos.reduce((acc, userInfo) => acc + (userInfo.roles.includes('author') ? 1 : 0), 0);
  const requesterCount = userInfos.reduce((acc, userInfo) => acc + (userInfo.roles.includes('requester') ? 1 : 0), 0);

  const recentPostInfos = await dataManager.selectPostInfos(
    'posts',
    { sortKey: 'date', sortDirection: 'desc' },
    PUBLICATION_IS_RECENT_DAYS,
  );

  const totalLikes = postInfos.reduce((acc, info) => acc + info.likes, 0);
  const totalCommentCount = postInfos.reduce(
    (acc, info) => acc + (typeof info.refId === 'undefined' ? info.commentCount : 0),
    0,
  );

  return {
    buildDate: new Date(),
    totalPosts: Object.fromEntries(
      await Promise.all(dataManager.postsManagers.map(async (manager) => [manager.name, await manager.getItemCount()])),
    ),
    authorCount,
    requesterCount,
    lastOriginalPostInfo: await dataManager.selectPostInfo('posts', {
      original: true,
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    topRatedPostInfo: await dataManager.selectPostInfo('posts', { sortKey: 'rating', sortDirection: 'desc' }),
    editorsChoicePostInfo: await dataManager.selectPostInfo('posts', { sortKey: 'mark', sortDirection: 'desc' }),
    topLikedPostInfo: await dataManager.selectPostInfo('posts', { sortKey: 'likes', sortDirection: 'desc' }),
    lastFulfilledPostInfo: await dataManager.selectPostInfo('posts', {
      requester: 'any',
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastProposedPostInfo: await dataManager.selectPostInfo('inbox', {
      requester: 'none',
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastRequestedPostInfo: await dataManager.selectPostInfo('inbox', {
      requester: 'any',
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    totalLikes,
    totalCommentCount,
    recentPostInfos,
  };
}
