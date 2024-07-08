import type { SortDirection } from '../utils/common-types.js';
import { cleanupUndefinedProps } from '../utils/common-utils.js';
import type { Link } from './link.js';
import type { PostsManager } from './posts-manager.js';
import type { Service } from './service.js';

export const USER_ROLES = ['admin', 'author', 'requester', 'drawer', 'beginner'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_DEFAULT_AUTHOR = 'dehero';
export const USER_UNKNOWN = 'anonimous';

export type UserProfiles = Record<string, string | undefined>;

export interface User {
  name?: string;
  nameRu?: string;
  nameRuFrom?: string;
  admin?: boolean;
  profiles?: UserProfiles;
}

export type UserEntry = [string, User | undefined, ...unknown[]];

export interface UserContribution {
  rejected: number;
  pending: number;
  published: number;
}

export interface UserInfo {
  id: string;
  title: string;
  authored: UserContribution;
  requested: UserContribution;
  likes: number;
  roles: UserRole[];
}

export type UserInfoComparator = (a: UserInfo, b: UserInfo) => number;

export async function createUserInfo(
  userEntry: UserEntry,
  published: PostsManager,
  pending: PostsManager,
  rejected: PostsManager,
): Promise<UserInfo> {
  const [id, user] = userEntry;

  const authored: UserContribution = {
    published: (await published.getUsedAuthorIds()).get(id) || 0,
    pending: (await pending.getUsedAuthorIds()).get(id) || 0,
    rejected: (await rejected.getUsedAuthorIds()).get(id) || 0,
  };

  const drawn: UserContribution = {
    published: (await published.getUsedDrawerIds()).get(id) || 0,
    pending: (await pending.getUsedDrawerIds()).get(id) || 0,
    rejected: (await rejected.getUsedDrawerIds()).get(id) || 0,
  };

  const requested: UserContribution = {
    published: (await published.getUsedRequesterIds()).get(id) || 0,
    pending: (await pending.getUsedRequesterIds()).get(id) || 0,
    rejected: (await rejected.getUsedRequesterIds()).get(id) || 0,
  };

  const likes = (await published.getLikedAuthorIds()).get(id) || 0;

  const roles: UserRole[] = [];

  if (user?.admin) {
    roles.push('admin');
  }

  if (authored.published || authored.pending) {
    roles.push('author');
  }

  if (drawn.published || drawn.pending) {
    roles.push('drawer');
  }

  if (requested.published || requested.pending) {
    roles.push('requester');
  }

  if (!authored.published && !requested.published) {
    roles.push('beginner');
  }

  return cleanupUndefinedProps({
    id,
    title: getUserEntryTitle(userEntry),
    authored,
    requested,
    likes,
    roles,
  });
}

export function createUserLinks(userEntry: UserEntry, services: Service[]): Link[] {
  const links = [];

  for (const service of services) {
    const userId = userEntry[1]?.profiles?.[service.id];
    if (userId) {
      const url = service.getUserProfileUrl(userId);
      if (url) {
        links.push({ text: service.name, url });
      }
    }
  }

  return links;
}

export function getUserEntryTitle(entry: UserEntry) {
  return entry[1]?.name || entry[0];
}

export function getUserEntryLetter(entry: UserEntry) {
  return getUserEntryTitle(entry)[0]?.toLocaleUpperCase() || '?';
}

export function compareUserContributions(a: UserContribution, b: UserContribution) {
  return a.published - b.published || a.pending - b.pending || a.rejected - b.rejected;
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

export function userContributionToString({ published, pending, rejected }: UserContribution) {
  return [published && `${published} published`, pending && `${pending} pending`, rejected && `${rejected} rejected`]
    .filter((a) => a)
    .join(', ');
}

export function isUserContributionEmpty({ published, pending, rejected }: UserContribution) {
  return !published && !pending && !rejected;
}
