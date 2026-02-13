import { render } from 'vike/abort';
import type { CommentInfo } from '../../../core/entities/comment-info.js';
import type { DataManager } from '../../../core/entities/data-manager.js';
import { PostType } from '../../../core/entities/post.js';
import type { PostInfoSelection } from '../../../core/entities/post-info.js';
import type { UserProfile } from '../../../core/entities/user.js';
import { getUserEntryTitle } from '../../../core/entities/user.js';
import type { UserRouteParams } from '../../routes/user-route.js';

export interface UserPageData {
  title: string;
  profiles?: UserProfile[];
  lastPostInfo?: PostInfoSelection;
  lastOriginalPostInfo?: PostInfoSelection;
  firstPostInfo?: PostInfoSelection;
  topRatedPostInfo?: PostInfoSelection;
  topLikedPostInfo?: PostInfoSelection;
  lessLikedPostInfo?: PostInfoSelection;
  lastFulfilledPostInfo?: PostInfoSelection;
  lastProposedPostInfo?: PostInfoSelection;
  lastRequestedPostInfo?: PostInfoSelection;
  lastLocatedPostInfo?: PostInfoSelection;
  lastRejectedPostInfo?: PostInfoSelection;
  lastRejectedRequestInfo?: PostInfoSelection;
  editorsChoicePostInfo?: PostInfoSelection;
  lastExtraPostInfos: Array<[PostType, PostInfoSelection | undefined]>;
  commentInfos: CommentInfo[];
}

export async function getUserPageData(dataManager: DataManager, params: UserRouteParams): Promise<UserPageData> {
  const userEntry = await dataManager.users.getEntry(params.id);
  if (!userEntry[1]) {
    throw render(404);
  }

  return {
    title: getUserEntryTitle(userEntry),
    profiles: userEntry[1].profiles
      ? [...userEntry[1].profiles].sort(
          (a, b) => Number(a.deleted ?? 0) - Number(b.deleted ?? 0) || (a.type ?? '').localeCompare(b.type ?? ''),
        )
      : undefined,
    lastPostInfo: await dataManager.selectPostInfo('posts', {
      author: params.id,
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastOriginalPostInfo: await dataManager.selectPostInfo('posts', {
      author: params.id,
      original: true,
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    firstPostInfo: await dataManager.selectPostInfo('posts', {
      author: params.id,
      sortKey: 'date',
      sortDirection: 'asc',
    }),
    topRatedPostInfo: await dataManager.selectPostInfo('posts', {
      author: params.id,
      sortKey: 'rating',
      sortDirection: 'desc',
    }),
    editorsChoicePostInfo: await dataManager.selectPostInfo('posts', {
      author: params.id,
      original: true,
      sortKey: 'mark',
      sortDirection: 'desc',
    }),
    topLikedPostInfo: await dataManager.selectPostInfo('posts', {
      author: params.id,
      sortKey: 'likes',
      sortDirection: 'desc',
    }),
    lessLikedPostInfo: await dataManager.selectPostInfo('posts', {
      author: params.id,
      sortKey: 'likes',
      sortDirection: 'asc',
    }),
    lastFulfilledPostInfo: await dataManager.selectPostInfo('posts', {
      author: params.id,
      requester: 'any',
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastProposedPostInfo: await dataManager.selectPostInfo('drafts', {
      author: params.id,
      requester: 'none',
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastLocatedPostInfo: await dataManager.selectPostInfo('posts', {
      locator: params.id,
      sortKey: 'located',
      sortDirection: 'desc',
    }),
    lastRequestedPostInfo: await dataManager.selectPostInfo('drafts', {
      requester: params.id,
      sortKey: 'requested',
      sortDirection: 'desc',
    }),
    lastRejectedPostInfo: await dataManager.selectPostInfo('rejects', {
      author: params.id,
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastRejectedRequestInfo: await dataManager.selectPostInfo('rejects', {
      requester: params.id,
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastExtraPostInfos: (
      await Promise.all(
        PostType.options.map(
          async (postType): Promise<[PostType, PostInfoSelection | undefined]> => [
            postType,
            await dataManager.selectPostInfo('extras', {
              author: params.id,
              type: postType,
              sortKey: 'date',
              sortDirection: 'desc',
            }),
          ],
        ),
      )
    ).filter(([, info]) => info?.totalCount),
    commentInfos: (await dataManager.getAllCommentInfos()).filter((comment) => comment.author === params.id),
  };
}
