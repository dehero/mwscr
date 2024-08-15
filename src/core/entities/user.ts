import type { Link } from './link.js';
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
