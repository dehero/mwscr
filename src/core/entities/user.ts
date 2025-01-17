import type { InferOutput } from 'valibot';
import {
  boolean,
  nonEmpty,
  nullable,
  number,
  object,
  optional,
  partial,
  picklist,
  pipe,
  record,
  string,
  trim,
} from 'valibot';
import type { Link } from './link.js';
import type { Option } from './option.js';
import { checkSchema } from './schema.js';
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

export const UserPatch = partial(
  object({
    name: nullable(User.entries.name),
    nameRu: nullable(User.entries.nameRu),
    nameRuFrom: nullable(User.entries.nameRuFrom),
  }),
);

export type UserRole = InferOutput<typeof UserRole>;
export type UserProfiles = Record<string, string | undefined>;
export type User = InferOutput<typeof User>;

export type UserPatch = InferOutput<typeof UserPatch>;

export type UserEntry = [string, User | undefined, ...unknown[]];

export function isUser(value: unknown, errors?: string[]): value is User {
  return checkSchema(User, value, errors);
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

export function getUserTitleLetter(title: string | undefined) {
  return title?.[0]?.toLocaleUpperCase() || '?';
}

export function createUserOption(entry: UserEntry): Option {
  return {
    value: entry[0],
    label: getUserEntryTitle(entry),
  };
}

export function patchUser(user: User, patch: UserPatch) {
  let field: keyof typeof UserPatch.entries;

  for (field in UserPatch.entries) {
    if (Object.hasOwn(patch, field)) {
      if (patch[field] === null) {
        user[field] = undefined as never;
      } else {
        user[field] = patch[field] as never;
      }
    }
  }

  return user;
}

export function isUserEqual(a: User, b: User) {
  return Boolean(
    (a.admin && a.admin === b.admin) ||
      (a.name && a.name === b.name) ||
      (a.nameRu && a.nameRu === b.nameRu) ||
      (a.nameRuFrom && a.nameRuFrom === b.nameRuFrom) ||
      (a.telegramBotChatId && a.telegramBotChatId === b.telegramBotChatId) ||
      (a.profiles &&
        Object.entries(a.profiles).some(
          ([service, profile]) => profile === b.profiles?.[service as keyof UserProfiles],
        )),
  );
}

export function mergeUserWith(user: User, withUser: User) {
  user.name = user.name || withUser.name || undefined;
  user.nameRu = user.nameRu || withUser.nameRu || undefined;
  user.nameRuFrom = user.nameRuFrom || withUser.nameRuFrom || undefined;
  user.telegramBotChatId = user.telegramBotChatId || withUser.telegramBotChatId || undefined;
  user.profiles = mergeUserProfiles(user.profiles, withUser.profiles);
}

export function mergeUserProfiles(
  profiles1: UserProfiles | undefined,
  profiles2: UserProfiles | undefined,
): UserProfiles | undefined {
  if (!profiles1) {
    return profiles2;
  }
  if (!profiles2) {
    return profiles1;
  }
  const result = { ...profiles1 };
  for (const name in profiles2) {
    const key = name as keyof UserProfiles;
    const value = result[key] || profiles2[key];
    if (value) {
      result[key] = value;
    } else {
      delete result[key];
    }
  }
  return result;
}
