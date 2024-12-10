import type { DataExtractor } from '../../../core/entities/data-extractor.js';
import { POST_RECENTLY_PUBLISHED_DAYS } from '../../../core/entities/post.js';
import type { PostInfoSelection } from '../../../core/entities/post-info.js';
import type { PostsUsage } from '../../../core/entities/posts-usage.js';

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

export async function getHomePageData(dataExtractor: DataExtractor): Promise<HomePageData> {
  const userInfos = await dataExtractor.getAllUserInfos();
  const postInfos = await dataExtractor.getAllPostInfos('posts');

  const authorCount = userInfos.reduce((acc, userInfo) => acc + (userInfo.roles.includes('author') ? 1 : 0), 0);
  const requesterCount = userInfos.reduce((acc, userInfo) => acc + (userInfo.roles.includes('requester') ? 1 : 0), 0);

  const recentPostInfos = await dataExtractor.selectPostInfos(
    'posts',
    { sortKey: 'date', sortDirection: 'desc' },
    POST_RECENTLY_PUBLISHED_DAYS,
  );

  const totalLikes = postInfos.reduce((acc, info) => acc + info.likes, 0);
  const totalCommentCount = postInfos.reduce(
    (acc, info) => acc + (typeof info.refId === 'undefined' ? info.commentCount : 0),
    0,
  );

  return {
    buildDate: new Date(),
    totalPosts: Object.fromEntries(
      await Promise.all(
        dataExtractor.postsManagers.map(async (manager) => [manager.name, await manager.getItemCount()]),
      ),
    ),
    authorCount,
    requesterCount,
    lastOriginalPostInfo: await dataExtractor.selectPostInfo('posts', {
      original: true,
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    topRatedPostInfo: await dataExtractor.selectPostInfo('posts', { sortKey: 'rating', sortDirection: 'desc' }),
    editorsChoicePostInfo: await dataExtractor.selectPostInfo('posts', { sortKey: 'mark', sortDirection: 'desc' }),
    topLikedPostInfo: await dataExtractor.selectPostInfo('posts', { sortKey: 'likes', sortDirection: 'desc' }),
    lastFulfilledPostInfo: await dataExtractor.selectPostInfo('posts', {
      requester: 'any',
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastProposedPostInfo: await dataExtractor.selectPostInfo('inbox', {
      requester: 'none',
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastRequestedPostInfo: await dataExtractor.selectPostInfo('inbox', {
      requester: 'any',
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    totalLikes,
    totalCommentCount,
    recentPostInfos,
  };
}
