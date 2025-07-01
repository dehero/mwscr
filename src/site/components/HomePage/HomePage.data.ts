import type { CommentInfo } from '../../../core/entities/comment-info.js';
import type { DataManager } from '../../../core/entities/data-manager.js';
import { PostType } from '../../../core/entities/post.js';
import type { PostInfoSelection } from '../../../core/entities/post-info.js';
import type { PostsUsage } from '../../../core/entities/posts-usage.js';
import { PUBLICATION_IS_RECENT_DAYS } from '../../../core/entities/publication.js';

export interface HomePageData {
  buildDate: Date;
  totalPosts: PostsUsage;
  authorCount: number;
  requesterCount: number;
  commenterCount: number;
  lastOriginalPostInfo?: PostInfoSelection;
  lastFulfilledPostInfo?: PostInfoSelection;
  lastProposedPostInfo?: PostInfoSelection;
  lastRequestedPostInfo?: PostInfoSelection;
  lastExtraPostInfos: Array<[PostType, PostInfoSelection | undefined]>;
  totalLikes: number;
  totalCommentCount: number;
  recentPostInfos: PostInfoSelection;
  recentCommentInfos: CommentInfo[];
}

export async function getHomePageData(dataManager: DataManager): Promise<HomePageData> {
  const userInfos = await dataManager.getAllUserInfos();
  const postInfos = await dataManager.getAllPostInfos('posts');

  const authorCount = userInfos.reduce((acc, userInfo) => acc + (userInfo.roles.includes('author') ? 1 : 0), 0);
  const requesterCount = userInfos.reduce((acc, userInfo) => acc + (userInfo.roles.includes('requester') ? 1 : 0), 0);
  const commenterCount = userInfos.reduce((acc, userInfo) => acc + (userInfo.roles.includes('commenter') ? 1 : 0), 0);

  const recentEndDate = new Date();
  const recentStartDate = new Date(recentEndDate);
  recentStartDate.setDate(recentStartDate.getDate() - PUBLICATION_IS_RECENT_DAYS);

  const recentPostInfos = await dataManager.selectPostInfos('posts', {
    sortKey: 'date',
    sortDirection: 'desc',
    date: [recentStartDate, recentEndDate],
  });

  const totalLikes = postInfos.reduce((acc, info) => acc + info.likes, 0);
  const totalCommentCount = postInfos.reduce(
    (acc, info) => acc + (typeof info.refId === 'undefined' ? info.commentCount : 0),
    0,
  );

  return {
    buildDate: new Date(),
    totalPosts: Object.fromEntries(
      await Promise.all(
        dataManager.postsManagers.map(async (manager) => [
          manager.name,
          (await dataManager.selectPostInfos(manager.name, {}, 1)).totalCount,
        ]),
      ),
    ),
    authorCount,
    requesterCount,
    commenterCount,
    lastOriginalPostInfo: await dataManager.selectPostInfo('posts', {
      original: true,
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastFulfilledPostInfo: await dataManager.selectPostInfo('posts', {
      requester: 'any',
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastProposedPostInfo: await dataManager.selectPostInfo('drafts', {
      requester: 'none',
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastRequestedPostInfo: await dataManager.selectPostInfo('drafts', {
      requester: 'any',
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastExtraPostInfos: (
      await Promise.all(
        PostType.options.map(
          async (postType): Promise<[PostType, PostInfoSelection | undefined]> => [
            postType,
            await dataManager.selectPostInfo('extras', {
              type: postType,
              sortKey: 'date',
              sortDirection: 'desc',
            }),
          ],
        ),
      )
    ).filter(([, info]) => info?.totalCount),
    totalLikes,
    totalCommentCount,
    recentPostInfos,
    recentCommentInfos: (await dataManager.getAllCommentInfos()).slice(0, 10),
  };
}
