import type { EntitySelection, SortDirection } from '../utils/common-types.js';
import { arrayFromAsync, cleanupUndefinedProps, getSearchTokens, search } from '../utils/common-utils.js';
import type { DataManager } from './data-manager.js';
import type { Option } from './option.js';
import type { PostMark } from './post.js';
import { getPostMarkFromScore } from './post.js';
import type { PostsUsage } from './posts-usage.js';
import { comparePostsUsages, createPostsUsage } from './posts-usage.js';
import type { UserRole } from './user.js';
import { getUserEntryTitle } from './user.js';

export interface UserInfo {
  id: string;
  title: string;
  authored?: PostsUsage;
  requested?: PostsUsage;
  likes: number;
  views: number;
  engagement: number;
  mark?: PostMark;
  rating: number;
  roles: UserRole[];
  talkedToTelegramBot: boolean;
}

export type UserInfoComparator = (a: UserInfo, b: UserInfo) => number;

export interface SelectUserInfoSortOption extends Option {
  fn: (direction: SortDirection) => UserInfoComparator;
}

export interface SelectUserInfosParams {
  role?: UserRole;
  search?: string;
  sortKey?: SelectUserInfosSortKey;
  sortDirection?: SortDirection;
}

export type UserInfoSelection = EntitySelection<UserInfo, SelectUserInfosParams>;

export const selectUserInfosSortOptions = [
  { value: 'contribution', label: 'Contribution', fn: compareUserInfosByContribution },
  { value: 'id', label: 'ID', fn: compareUserInfosById },
] as const satisfies SelectUserInfoSortOption[];

export type SelectUserInfosSortKey = (typeof selectUserInfosSortOptions)[number]['value'];

export async function createUserInfos(dataManager: DataManager): Promise<UserInfo[]> {
  const entries = await arrayFromAsync(dataManager.users.readAllEntries());

  return Promise.all(
    entries.map(async (entry) => {
      const [id, user] = entry;

      const posts = dataManager.postsManagers.find((manager) => manager.name === 'posts');

      const authored = await createPostsUsage(dataManager.postsManagers, 'getAuthorsUsageStats', id);
      const drawn = await createPostsUsage(dataManager.postsManagers, 'getDrawersUsageStats', id);
      const requested = await createPostsUsage(dataManager.postsManagers, 'getRequesterUsageStats', id);

      const likes = (await posts?.getAuthorsLikesStats())?.get(id) || 0;
      const views = (await posts?.getAuthorsViewsStats())?.get(id) || 0;
      const engagement = Number((await posts?.getAuthorsEngagementStats())?.get(id)?.toFixed(2) || 0);
      const mark = getPostMarkFromScore((await posts?.getAuthorsMarkScoreStats())?.get(id));
      const rating = Number((await posts?.getAuthorsRatingStats())?.get(id)?.toFixed(2) || 0);

      const roles: UserRole[] = [];

      if (user.admin) {
        roles.push('admin');
      }

      if (authored?.posts || authored?.inbox) {
        roles.push('author');
      }

      if (drawn?.posts || drawn?.inbox) {
        roles.push('drawer');
      }

      if (requested?.posts || requested?.inbox) {
        roles.push('requester');
      }

      if (
        !authored?.posts &&
        !requested?.posts &&
        (authored?.inbox || requested?.inbox || authored?.trash || requested?.trash)
      ) {
        roles.push('beginner');
      }

      if (roles.length === 0) {
        roles.push('foreigner');
      }

      return cleanupUndefinedProps({
        id,
        title: getUserEntryTitle(entry),
        authored,
        requested,
        likes,
        views,
        engagement,
        mark,
        rating,
        roles,
        talkedToTelegramBot: Boolean(user.telegramBotChatId),
      });
    }),
  );
}

export function compareUserInfosById(direction: SortDirection): UserInfoComparator {
  return direction === 'asc' ? (a, b) => a.id.localeCompare(b.id) : (a, b) => b.id.localeCompare(a.id);
}

export function compareUserInfosByTitle(direction: SortDirection): UserInfoComparator {
  const byId = compareUserInfosById(direction);

  return direction === 'asc'
    ? (a, b) => a.title.localeCompare(b.title) || byId(a, b)
    : (a, b) => b.title.localeCompare(a.title) || byId(a, b);
}

export function compareUserInfosByContribution(direction: SortDirection): UserInfoComparator {
  const byId = compareUserInfosById(direction);

  return direction === 'asc'
    ? (a, b) => comparePostsUsages(a.authored, b.authored) || comparePostsUsages(a.requested, b.requested) || byId(a, b)
    : (a, b) =>
        comparePostsUsages(b.authored, a.authored) || comparePostsUsages(b.requested, a.requested) || byId(b, a);
}

export function selectUserInfos(
  userInfos: UserInfo[],
  params: SelectUserInfosParams,
  limit?: number,
): UserInfoSelection {
  const localParams: SelectUserInfosParams = { ...params, sortKey: 'contribution', sortDirection: 'desc' };

  const comparator =
    selectUserInfosSortOptions.find((comparator) => comparator.value === params.sortKey)?.fn ??
    compareUserInfosByContribution;
  const searchTokens = getSearchTokens(params.search);

  const items = userInfos
    .filter(
      (info) =>
        (typeof params.role === 'undefined' || info.roles.includes(params.role)) &&
        search(searchTokens, [info.title, info.id]),
    )
    .sort(comparator(params.sortDirection ?? 'desc'));

  return {
    items: typeof limit === 'undefined' ? items : items.slice(0, limit),
    params: localParams,
    totalCount: items.length,
  };
}

export function selectUserInfosResultToString(count: number, params: SelectUserInfosParams) {
  const result: string[] = [count.toString()];
  const sortOption = selectUserInfosSortOptions.find((comparator) => comparator.value === params.sortKey);

  if (params.role) {
    result.push(`${params.role}${count !== 1 ? 's' : ''}`);
  } else {
    result.push(`user${count !== 1 ? 's' : ''}`);
  }

  if (params.search) {
    result.push(`with "${params.search}" in name or ID`);
  }

  if (sortOption) {
    result.push(`sorted by "${sortOption.label}" ${params.sortDirection === 'asc' ? 'ascending' : 'descending'}`);
  }

  return result.join(' ');
}
