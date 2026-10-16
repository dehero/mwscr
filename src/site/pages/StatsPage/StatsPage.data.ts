import { query } from '@solidjs/router';
import type { CommentInfo } from '../../../core/entities/comment-info.ts';
import type { DataManager } from '../../../core/entities/data-manager.ts';
import type { ListReaderItemStatus } from '../../../core/entities/list-manager.ts';
import type { PostInfo, PostInfoSelection } from '../../../core/entities/post-info.ts';
import type { PostViolation } from '../../../core/entities/post.ts';
import type { PostsUsage } from '../../../core/entities/posts-usage.ts';
import type { UserInfo } from '../../../core/entities/user-info.ts';
import { asArray } from '../../../core/utils/common-utils.ts';
import { dataManager } from '../../data-managers/manager.ts';

export interface StatsCountItem {
  id: string;
  count: number;
}

export interface StatsViolationItem {
  violation: PostViolation;
  count: number;
}

export interface StatsPageData {
  totalPosts: PostsUsage;
  membersCount: number;
  totalLikes: number;
  totalCommentCount: number;

  draftCount: number;
  readyDraftCount: number;
  unreadyDraftCount: number;
  requestCount: number;
  rejectCount: number;
  unlocatedCount: number;
  untaggedCount: number;
  originalCount: number;

  totalLocationsCount: number;
  discoveredLocationsCount: number;
  undiscoveredLocationsCount: number;
  undiscoveredLocationTitles: string[];

  violationItems: StatsViolationItem[];
  tagItems: StatsCountItem[];

  localEditCounts: Record<ListReaderItemStatus, number>;

  authorItems: UserInfo[];
  locatorItems: UserInfo[];
  requesterItems: UserInfo[];
  commenterItems: UserInfo[];
  noviceItems: UserInfo[];

  recentPostInfos: PostInfoSelection;
  recentCommentInfos: CommentInfo[];
}

const LIST_LIMIT = 20;
const CONTRIBUTOR_LIMIT = 12;

function usageTotal(usage: PostsUsage | undefined): number {
  return Object.values(usage ?? {}).reduce((acc, value) => acc + (value ?? 0), 0);
}

function countByStatus(postInfos: PostInfo[]): Record<ListReaderItemStatus, number> {
  const result: Record<ListReaderItemStatus, number> = { added: 0, changed: 0, removed: 0 };

  for (const info of postInfos) {
    if (info.status) {
      result[info.status] += 1;
    }
  }

  return result;
}

function selectTopContributors(
  userInfos: UserInfo[],
  getUsage: (info: UserInfo) => PostsUsage | undefined,
): UserInfo[] {
  return userInfos
    .map((info) => ({ info, score: usageTotal(getUsage(info)) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.info.id.localeCompare(b.info.id))
    .slice(0, CONTRIBUTOR_LIMIT)
    .map((item) => item.info);
}

export async function getStatsPageData(dataManager: DataManager): Promise<StatsPageData> {
  const [summary, postsInfos, extrasInfos, draftsInfos, rejectsInfos, locationInfos, tagInfos, userInfos] =
    await Promise.all([
      dataManager.getSummary(),
      dataManager.getAllPostInfos('posts'),
      dataManager.getAllPostInfos('extras'),
      dataManager.getAllPostInfos('drafts'),
      dataManager.getAllPostInfos('rejects'),
      dataManager.getAllLocationInfos(),
      dataManager.getAllTagInfos(),
      dataManager.getAllUserInfos(),
    ]);

  const allDraftableInfos = [...postsInfos, ...extrasInfos, ...draftsInfos];
  const allInfos = [...allDraftableInfos, ...rejectsInfos];

  const violationCounts = new Map<PostViolation, number>();

  for (const info of rejectsInfos) {
    for (const violation of asArray(info.violation)) {
      violationCounts.set(violation, (violationCounts.get(violation) ?? 0) + 1);
    }
  }

  const violationItems = [...violationCounts]
    .map(([violation, count]): StatsViolationItem => ({ violation, count }))
    .sort((a, b) => b.count - a.count);

  const tagItems = tagInfos
    .map((info): StatsCountItem => ({ id: info.id, count: usageTotal(info.tagged) }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
    .slice(0, LIST_LIMIT);

  const undiscoveredLocations = locationInfos
    .filter((info) => info.type !== 'virtual' && !info.discovered?.posts)
    .map((info) => info.title)
    .sort((a, b) => a.localeCompare(b));

  return {
    totalPosts: summary.totalPosts,
    membersCount: summary.membersCount,
    totalLikes: summary.totalLikes,
    totalCommentCount: summary.totalCommentCount,

    draftCount: draftsInfos.length,
    readyDraftCount: draftsInfos.filter((info) => info.status !== 'removed' && !info.publishableErrors?.length).length,
    unreadyDraftCount: draftsInfos.filter(
      (info) => info.status !== 'removed' && Boolean(info.publishableErrors?.length),
    ).length,
    requestCount: draftsInfos.filter((info) => Boolean(info.requesterOption)).length,
    rejectCount: rejectsInfos.length,
    unlocatedCount: allDraftableInfos.filter((info) => !info.locationOptions?.length).length,
    untaggedCount: allDraftableInfos.filter((info) => !info.tags?.length).length,
    originalCount: postsInfos.filter((info) => !info.refId).length,

    totalLocationsCount: locationInfos.length,
    discoveredLocationsCount: locationInfos.filter((info) => Boolean(info.discovered?.posts)).length,
    undiscoveredLocationsCount: undiscoveredLocations.length,
    undiscoveredLocationTitles: undiscoveredLocations.slice(0, LIST_LIMIT),

    violationItems,
    tagItems,

    localEditCounts: countByStatus(allInfos),

    authorItems: selectTopContributors(userInfos, (info) => info.authored),
    locatorItems: selectTopContributors(userInfos, (info) => info.located),
    requesterItems: selectTopContributors(userInfos, (info) => info.requested),
    commenterItems: selectTopContributors(userInfos, (info) => info.commented),
    noviceItems: userInfos.filter((info) => info.roles.includes('beginner')).slice(0, CONTRIBUTOR_LIMIT),

    recentPostInfos: summary.recentPostInfos,
    recentCommentInfos: summary.recentCommentInfos,
  };
}

export const queryStatsPageData = query(async () => getStatsPageData(dataManager), 'stats');
