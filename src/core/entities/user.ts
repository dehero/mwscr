import type { InferOutput } from 'valibot';
import { boolean, nonEmpty, number, object, optional, picklist, pipe, record, string, trim } from 'valibot';
import type { Link } from './link.js';
import type { Option } from './option.js';
import type { Service } from './service.js';

export const USER_DEFAULT_AUTHOR = 'dehero';
export const USER_UNKNOWN = 'anonimous';

export const UserRole = picklist(['admin', 'author', 'requester', 'drawer', 'beginner', 'foreigner']);
export const UserProfiles = record(pipe(string(), nonEmpty()), optional(pipe(string(), trim(), nonEmpty())));

export const User = object({
  name: optional(pipe(string(), trim(), nonEmpty())),
  nameRu: optional(pipe(string(), trim(), nonEmpty())),
  nameRuFrom: optional(pipe(string(), trim(), nonEmpty())),
  admin: optional(boolean()),
  telegramBotChatId: optional(number()),
  profiles: optional(UserProfiles),
});

export type UserRole = InferOutput<typeof UserRole>;
export type UserProfiles = Record<string, string | undefined>;
export type User = InferOutput<typeof User>;

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

export function getUserTitleLetter(title: string | undefined) {
  return title?.[0]?.toLocaleUpperCase() || '?';
}

export function createUserOption(entry: UserEntry): Option {
  return {
    value: entry[0],
    label: getUserEntryTitle(entry),
  };
}
