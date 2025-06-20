import type { InferOutput } from 'valibot';
import { array, boolean, date, nonEmpty, number, object, optional, picklist, pipe, string, trim } from 'valibot';
import { asArray } from '../utils/common-utils.js';
import type { Link } from './link.js';
import type { Option } from './option.js';
import { ImageResourceUrl } from './resource.js';
import type { Service } from './service.js';

export const USER_DEFAULT_AUTHOR = 'dehero';
export const USER_UNKNOWN = 'anonimous';

export const UserRole = picklist(['admin', 'author', 'requester', 'drawer', 'commenter', 'beginner', 'foreigner']);

export const UserProfile = object({
  service: pipe(string(), nonEmpty()),
  id: optional(pipe(string(), trim(), nonEmpty())),
  username: optional(pipe(string(), trim(), nonEmpty())),
  botChatId: optional(number()),
  avatar: optional(ImageResourceUrl),
  name: optional(pipe(string(), trim(), nonEmpty())),
  deleted: optional(boolean()),
  updated: optional(date()),
});

export const UserProfiles = array(UserProfile);

export const User = object({
  name: optional(pipe(string(), trim(), nonEmpty())),
  nameRu: optional(pipe(string(), trim(), nonEmpty())),
  nameRuFrom: optional(pipe(string(), trim(), nonEmpty())),
  avatar: optional(ImageResourceUrl),
  admin: optional(boolean()),
  profiles: optional(UserProfiles),
});

export type UserRole = InferOutput<typeof UserRole>;
export type UserProfile = InferOutput<typeof UserProfile>;
export type UserProfiles = InferOutput<typeof UserProfiles>;
export type User = InferOutput<typeof User>;

export type UserEntry = [string, User | undefined, ...unknown[]];

export function createUserLinks(userEntry: UserEntry, services: Service[]): Link[] {
  const links = [];

  for (const service of services) {
    const username = userEntry[1]?.profiles?.find((p) => p.service === service.id)?.username;
    if (username) {
      const url = service.getUserProfileUrl(username);
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

export function getUserTitleLetter(title: string | undefined) {
  return title?.[0]?.toLocaleUpperCase() || '?';
}

export function createUserOption(entry: UserEntry): Option {
  return {
    value: entry[0],
    label: getUserEntryTitle(entry),
  };
}

export function isUserEqual(a: User, b: User) {
  return Boolean(
    a.profiles?.some((aProfile) => b.profiles?.some((bProfile) => isUserProfileEqual(aProfile, bProfile))),
  );
}

export function isUserProfileEqual(a: UserProfile, b: UserProfile) {
  return Boolean(
    a.service === b.service &&
      ((a.id && a.id === b.id) ||
        (a.username && a.username === b.username) ||
        (a.botChatId && a.botChatId === b.botChatId)),
  );
}

export function mergeUserWith(user: User, withUser: User) {
  user.name = user.name || withUser.name || undefined;
  user.nameRu = user.nameRu || withUser.nameRu || undefined;
  user.nameRuFrom = user.nameRuFrom || withUser.nameRuFrom || undefined;
  user.avatar = user.avatar || withUser.avatar || undefined;
  user.profiles = mergeUserProfiles(user.profiles, withUser.profiles);
}

export function mergeUserProfiles(
  profiles1: UserProfile[] | undefined,
  profiles2: UserProfile[] | undefined,
): UserProfile[] | undefined {
  const result = [...asArray(profiles1)];

  for (const profile2 of profiles2 ?? []) {
    const profile1 = result.find((profile1) => isUserProfileEqual(profile1, profile2));
    if (profile1) {
      profile1.id = profile2.id ?? profile1.id;
      profile1.username = profile2.username ?? profile1.username;
      profile1.botChatId = profile2.botChatId ?? profile1.botChatId;
      profile1.avatar = profile2.avatar ?? profile1.avatar;
      profile1.name = profile2.name ?? profile1.name;
      profile1.deleted = profile2.deleted ?? profile1.deleted;
    } else {
      result.push(profile2);
    }
  }

  return result.length > 0 ? result : undefined;
}
