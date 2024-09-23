import type { SortDirection } from '../utils/common-types.js';
import { cleanupUndefinedProps, getSearchTokens, search } from '../utils/common-utils.js';
import type { Option } from './option.js';
import type { PostMark } from './post.js';
import { getPostMarkFromScore } from './post.js';
import type { PostsManager } from './posts-manager.js';
import type { UserEntry, UserRole } from './user.js';
import { getUserEntryTitle } from './user.js';

export interface UserContribution {
  rejected: number;
  pending: number;
  posted: number;
}

export interface UserInfo {
  id: string;
  title: string;
  authored: UserContribution;
  requested: UserContribution;
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
  sortKey: SelectUserInfosSortKey;
  sortDirection: SortDirection;
}

export const selectUserInfosSortOptions = [
  { value: 'contribution', label: 'Contribution', fn: compareUserInfosByContribution },
  { value: 'id', label: 'ID', fn: compareUserInfosById },
] as const satisfies SelectUserInfoSortOption[];

export type SelectUserInfosSortKey = (typeof selectUserInfosSortOptions)[number]['value'];

export async function createUserInfo(
  userEntry: UserEntry,
  posted: PostsManager,
  pending: PostsManager,
  rejected: PostsManager,
): Promise<UserInfo> {
  const [id, user] = userEntry;

  const authored: UserContribution = {
    posted: (await posted.getAuthorsUsageStats()).get(id) || 0,
    pending: (await pending.getAuthorsUsageStats()).get(id) || 0,
    rejected: (await rejected.getAuthorsUsageStats()).get(id) || 0,
  };

  const drawn: UserContribution = {
    posted: (await posted.getDrawersUsageStats()).get(id) || 0,
    pending: (await pending.getDrawersUsageStats()).get(id) || 0,
    rejected: (await rejected.getDrawersUsageStats()).get(id) || 0,
  };

  const requested: UserContribution = {
    posted: (await posted.getRequesterUsageStats()).get(id) || 0,
    pending: (await pending.getRequesterUsageStats()).get(id) || 0,
    rejected: (await rejected.getRequesterUsageStats()).get(id) || 0,
  };

  const likes = (await posted.getAuthorsLikesStats()).get(id) || 0;
  const views = (await posted.getAuthorsViewsStats()).get(id) || 0;
  const engagement = Number((await posted.getAuthorsEngagementStats()).get(id)?.toFixed(2) || 0);
  const mark = getPostMarkFromScore((await posted.getAuthorsMarkScoreStats()).get(id));
  const rating = Number((await posted.getAuthorsRatingStats()).get(id)?.toFixed(2) || 0);

  const roles: UserRole[] = [];

  if (user?.admin) {
    roles.push('admin');
  }

  if (authored.posted || authored.pending) {
    roles.push('author');
  }

  if (drawn.posted || drawn.pending) {
    roles.push('drawer');
  }

  if (requested.posted || requested.pending) {
    roles.push('requester');
  }

  if (
    !authored.posted &&
    !requested.posted &&
    (authored.pending || requested.pending || authored.rejected || requested.rejected)
  ) {
    roles.push('beginner');
  }

  if (roles.length === 0) {
    roles.push('foreigner');
  }

  return cleanupUndefinedProps({
    id,
    title: getUserEntryTitle(userEntry),
    authored,
    requested,
    likes,
    views,
    engagement,
    mark,
    rating,
    roles,
    talkedToTelegramBot: Boolean(user?.telegramBotChatId),
  });
}

export function compareUserContributions(a: UserContribution, b: UserContribution) {
  return a.posted - b.posted || a.pending - b.pending || a.rejected - b.rejected;
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
        compareUserContributions(a.authored, b.authored) ||
        compareUserContributions(a.requested, b.requested) ||
        byId(a, b)
    : (a, b) =>
        compareUserContributions(b.authored, a.authored) ||
        compareUserContributions(b.requested, a.requested) ||
        byId(b, a);
}

export function userContributionToString({ posted, pending, rejected }: UserContribution) {
  return [posted && `${posted} posted`, pending && `${pending} pending`, rejected && `${rejected} rejected`]
    .filter((a) => a)
    .join(', ');
}

export function isUserContributionEmpty({ posted, pending, rejected }: UserContribution) {
  return !posted && !pending && !rejected;
}

export function selectUserInfos(userInfos: UserInfo[], params: SelectUserInfosParams) {
  const comparator =
    selectUserInfosSortOptions.find((comparator) => comparator.value === params.sortKey)?.fn ?? compareUserInfosById;
  const searchTokens = getSearchTokens(params.search);

  return userInfos
    .filter(
      (info) =>
        (typeof params.role === 'undefined' || info.roles.includes(params.role)) &&
        search(searchTokens, [info.title, info.id]),
    )
    .sort(comparator(params.sortDirection));
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
