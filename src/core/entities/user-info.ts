import { texts } from '../texts/index.js';
import type { EntitySelection, SortDirection } from '../utils/common-types.js';
import { arrayFromAsync, cleanupUndefinedProps, getSearchTokens, search } from '../utils/common-utils.js';
import { localize } from '../utils/intl-utils.js';
import type { DataManager } from './data-manager.js';
import { type IntlText, type Locale } from './intl.js';
import type { Option } from './option.js';
import type { PostMark } from './post.js';
import { getPostMarkFromScore } from './post.js';
import type { PostsUsage } from './posts-usage.js';
import { comparePostsUsages, createPostsUsage } from './posts-usage.js';
import type { ImageResourceUrl } from './resource.js';
import type { UserRole } from './user.js';
import { getUserEntryAvatar, getUserEntryTitle, getUserEntryTitleRu, isUserProfileFollowing } from './user.js';

export interface UserInfo {
  id: string;
  title: string;
  titleRu?: string;
  authored?: PostsUsage;
  located?: PostsUsage;
  requested?: PostsUsage;
  commented?: PostsUsage;
  likes: number;
  views: number;
  engagement: number;
  mark?: PostMark;
  rating: number;
  roles: UserRole[];
  talkedToTelegramBot: boolean;
  avatar?: ImageResourceUrl;
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
  { value: 'contribution', label: texts.user.contribution, fn: compareUserInfosByContribution },
  { value: 'commentCount', label: texts.user.comments, fn: compareUserInfosByCommentCount },
  { value: 'id', label: texts.field.id, fn: compareUserInfosById },
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
      const located = await createPostsUsage(dataManager.postsManagers, 'getLocatorsUsageStats', id);
      const requested = await createPostsUsage(dataManager.postsManagers, 'getRequesterUsageStats', id);
      const commented = await createPostsUsage(dataManager.postsManagers, 'getCommentersUsageStats', id);

      const likes = (await posts?.getAuthorsLikesStats())?.get(id) || 0;
      const views = (await posts?.getAuthorsViewsStats())?.get(id) || 0;
      const engagement = Number((await posts?.getAuthorsEngagementStats())?.get(id)?.toFixed(2) || 0);
      const mark = getPostMarkFromScore((await posts?.getAuthorsMarkScoreStats())?.get(id));
      const rating = Number((await posts?.getAuthorsRatingStats())?.get(id)?.toFixed(2) || 0);

      const roles: UserRole[] = [];

      if (user.admin) {
        roles.push('admin');
      }

      if (authored?.posts || authored?.extras) {
        roles.push('author');
      }

      if (drawn?.posts || drawn?.extras || drawn?.drafts) {
        roles.push('drawer');
      }

      if (located?.posts) {
        roles.push('locator');
      }

      if (requested?.posts || requested?.drafts) {
        roles.push('requester');
      }

      if (commented?.posts || commented?.extras) {
        roles.push('commenter');
      }

      if (user.profiles?.some(isUserProfileFollowing)) {
        roles.push('follower');
      }

      if (
        !authored?.posts &&
        !authored?.extras &&
        !requested?.posts &&
        !requested?.extras &&
        (authored?.drafts || requested?.drafts || authored?.rejects || requested?.rejects)
      ) {
        roles.push('beginner');
      }

      if (roles.length === 0) {
        roles.push('foreigner');
      }

      return cleanupUndefinedProps({
        id,
        title: getUserEntryTitle(entry),
        titleRu: getUserEntryTitleRu(entry),
        authored,
        located,
        requested,
        commented,
        likes,
        views,
        engagement,
        mark,
        rating,
        roles,
        talkedToTelegramBot: Boolean(user.profiles?.some((profile) => profile.service === 'tg' && profile.botChatId)),
        avatar: getUserEntryAvatar(entry),
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
    ? (a, b) =>
        comparePostsUsages(a.authored, b.authored) ||
        comparePostsUsages(a.located, b.located) ||
        comparePostsUsages(a.requested, b.requested) ||
        comparePostsUsages(a.commented, b.commented) ||
        byId(a, b)
    : (a, b) =>
        comparePostsUsages(b.authored, a.authored) ||
        comparePostsUsages(b.located, a.located) ||
        comparePostsUsages(b.requested, a.requested) ||
        comparePostsUsages(b.commented, a.commented) ||
        byId(b, a);
}

export function compareUserInfosByCommentCount(direction: SortDirection): UserInfoComparator {
  const byId = compareUserInfosById(direction);

  return direction === 'asc'
    ? (a, b) => comparePostsUsages(a.commented, b.commented) || byId(a, b)
    : (a, b) => comparePostsUsages(b.commented, a.commented) || byId(b, a);
}

export function selectUserInfos(
  userInfos: UserInfo[],
  params: SelectUserInfosParams,
  limit?: number,
): UserInfoSelection {
  const localParams: SelectUserInfosParams = {
    ...params,
    sortKey: params.sortKey ?? 'contribution',
    sortDirection: params.sortDirection ?? 'desc',
  };

  const comparator =
    selectUserInfosSortOptions.find((comparator) => comparator.value === params.sortKey)?.fn ??
    compareUserInfosByContribution;
  const searchTokens = getSearchTokens(params.search);

  const items = userInfos
    .filter(
      (info) =>
        (typeof params.role === 'undefined' || info.roles.includes(params.role)) &&
        search(searchTokens, [info.title, info.titleRu, info.id]),
    )
    .sort(comparator(params.sortDirection ?? 'desc'));

  return {
    items: typeof limit === 'undefined' ? items : items.slice(0, limit),
    params: localParams,
    totalCount: items.length,
  };
}

export function getUserRoleUnitText(role: UserRole, count: number, locale: Locale) {
  const entries = {
    admin: texts.user.adminUnit,
    author: texts.user.authorUnit,
    beginner: texts.user.beginnerUnit,
    commenter: texts.user.commenterUnit,
    drawer: texts.user.drawerUnit,
    follower: texts.user.followerUnit,
    foreigner: texts.user.foreignerUnit,
    locator: texts.user.locatorUnit,
    requester: texts.user.requesterUnit,
  } as const satisfies Record<UserRole, IntlText>;

  return localize(entries[role], locale, { count });
}

export function selectUserInfosResultToString(count: number, params: SelectUserInfosParams, locale: Locale) {
  const result: string[] = [count.toString()];
  const sortOption = selectUserInfosSortOptions.find((comparator) => comparator.value === params.sortKey);

  if (params.role) {
    result.push(getUserRoleUnitText(params.role, count, locale));
  } else {
    result.push(localize(texts.user.userUnit, locale, { count }));
  }

  if (params.search) {
    result.push(localize(texts.userFilter.withSearch, locale, { search: params.search }));
  }

  if (sortOption) {
    const sortLabel = localize(sortOption.label, locale);
    const direction = localize(params.sortDirection === 'asc' ? texts.userFilter.asc : texts.userFilter.desc, locale);

    result.push(localize(texts.userFilter.sortedBy, locale, { label: sortLabel, direction }));
  }

  return result.join(' ');
}
