import type { DataManager } from '../../../core/entities/data-manager.js';
import type { Link } from '../../../core/entities/link.js';
import type { PostInfoSelection } from '../../../core/entities/post-info.js';
import { createUserLinks } from '../../../core/entities/user.js';
import type { UserInfo } from '../../../core/entities/user-info.js';
import { services } from '../../../core/services/index.js';
import type { UserRouteParams } from '../../routes/user-route.js';

export interface UserPageData {
  userInfo?: UserInfo;
  userLinks?: Link[];
  lastPostInfo?: PostInfoSelection;
  lastOriginalPostInfo?: PostInfoSelection;
  firstPostInfo?: PostInfoSelection;
  topRatedPostInfo?: PostInfoSelection;
  topLikedPostInfo?: PostInfoSelection;
  lessLikedPostInfo?: PostInfoSelection;
  lastFulfilledPostInfo?: PostInfoSelection;
  lastProposedPostInfo?: PostInfoSelection;
  lastRequestedPostInfo?: PostInfoSelection;
  lastRejectedPostInfo?: PostInfoSelection;
  lastRejectedRequestInfo?: PostInfoSelection;
  editorsChoicePostInfo?: PostInfoSelection;
}

export async function getUserPageData(dataManager: DataManager, params: UserRouteParams): Promise<UserPageData> {
  const userEntry = await dataManager.users.getEntry(params.id);

  return {
    userInfo: await dataManager.getUserInfo(params.id),
    userLinks: await createUserLinks(userEntry, services),
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
    lastProposedPostInfo: await dataManager.selectPostInfo('inbox', {
      author: params.id,
      requester: 'none',
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastRequestedPostInfo: await dataManager.selectPostInfo('inbox', {
      requester: params.id,
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastRejectedPostInfo: await dataManager.selectPostInfo('trash', {
      author: params.id,
      sortKey: 'date',
      sortDirection: 'desc',
    }),
    lastRejectedRequestInfo: await dataManager.selectPostInfo('trash', {
      requester: params.id,
      sortKey: 'date',
      sortDirection: 'desc',
    }),
  };
}
