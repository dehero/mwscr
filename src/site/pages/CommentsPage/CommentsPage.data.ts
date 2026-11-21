import { query } from '@solidjs/router';
import type { SearchParams } from '@solidjs/router';
import type { CommentInfo } from '../../../core/entities/comment-info.ts';
import type { DataManager } from '../../../core/entities/data-manager.ts';
import type { UserInfo } from '../../../core/entities/user-info.ts';
import { dataManager } from '../../data-managers/manager.ts';

export interface CommentsPageData {
  commentInfos: CommentInfo[];
  userInfos: UserInfo[];
}

export interface CommentsPageSearchParams extends SearchParams {
  author?: string;
  date?: string;
  service?: string;
  search?: string;
  sort?: string;
}

export async function getCommentsPageData(dataManager: DataManager): Promise<CommentsPageData> {
  const [commentInfos, userInfos] = await Promise.all([
    dataManager.getAllCommentInfos(),
    dataManager.getAllUserInfos(),
  ]);

  return {
    commentInfos,
    userInfos,
  };
}

export const queryCommentsPageData = query(async () => getCommentsPageData(dataManager), 'comments');
