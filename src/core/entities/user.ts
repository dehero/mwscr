import transliterate from '@sindresorhus/transliterate';
import type { InferOutput } from 'valibot';
import { array, boolean, date, nonEmpty, number, object, optional, picklist, pipe, string, trim, union } from 'valibot';
import { asArray } from '../utils/common-utils.js';
import { getDaysPassed } from '../utils/date-utils.js';
import { stripHashtags } from '../utils/string-utils.js';
import type { Option } from './option.js';
import { ImageResourceUrl } from './resource.js';

const USER_NAME_IS_RU_REGEX = /[ёа-я]/i;
const USER_NAME_SKIP_AS_ID_REGEX = /^(__deleted__.+|club\d+|id\d+)$/;
const USER_TITLE_CLEANUP_REGEX = /([a-z0-9].*[a-z0-9.\)>])/gi;

export const USER_DEFAULT_AUTHOR = 'dehero';
// TODO: this name cannot be used by anyone else
export const USER_UNKNOWN = 'anonimous';

export const UserRole = picklist([
  'admin',
  'author',
  'requester',
  'drawer',
  'commenter',
  'follower',
  'beginner',
  'foreigner',
  'locator',
]);
export const UserProfileType = picklist(['chat', 'channel', 'bot']);

export const UserProfile = object({
  service: pipe(string(), nonEmpty()),
  id: optional(pipe(string(), trim(), nonEmpty())),
  accessHash: optional(pipe(string(), trim(), nonEmpty())),
  username: optional(pipe(string(), trim(), nonEmpty())),
  botChatId: optional(number()),
  type: optional(UserProfileType),
  avatar: optional(ImageResourceUrl),
  name: optional(pipe(string(), trim(), nonEmpty())),
  deleted: optional(boolean()),
  updated: optional(date()),
  followed: optional(union([date(), array(date())])),
  unfollowed: optional(union([date(), array(date())])),
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
export type UserProfileType = InferOutput<typeof UserProfileType>;
export type UserProfile = InferOutput<typeof UserProfile>;
export type UserProfiles = InferOutput<typeof UserProfiles>;
export type User = InferOutput<typeof User>;

export type UserEntry = [string, User | undefined, ...unknown[]];

export function getUserEntryTitle(entry: UserEntry) {
  let result = entry[1]?.name;

  if (!result && entry[1]?.profiles) {
    for (const profile of entry[1].profiles) {
      const name = transliterate(profile.name?.trim() ?? '');
      if (name) {
        result = name;
        break;
      }
    }

    if (!result) {
      for (const profile of entry[1].profiles) {
        if (profile.username && isUserNameReadable(profile.username)) {
          result = profile.username;
          break;
        }
      }
    }
  }

  if (result) {
    result = cleanupUserTitle(result);
  }

  if (!result) {
    result = entry[0];
  }

  return result;
}

export function getUserEntryTitleRu(entry: UserEntry) {
  let result = entry[1]?.nameRu;

  if (!result && entry[1]?.profiles) {
    for (const profile of entry[1].profiles) {
      const name = profile.name?.trim();
      if (name && USER_NAME_IS_RU_REGEX.test(name)) {
        result = name;
        break;
      }
    }
  }

  return result;
}

export function getUserEntryAvatar(entry: UserEntry) {
  let result = entry[1]?.avatar;

  if (!result && entry[1]?.profiles) {
    const profiles = entry[1].profiles
      .filter((p) => !p.deleted)
      .sort((a, b) => (a.type ?? '').localeCompare(b.type ?? ''));

    for (const profile of profiles) {
      if (profile.avatar) {
        result = profile.avatar;
        break;
      }
    }
  }

  return result;
}

export function getUserTitleLetter(title: string | undefined) {
  return title?.[0]?.toLocaleUpperCase() || '?';
}

export function createUserOption(entry: UserEntry): Option {
  return {
    value: entry[0],
    label: getUserEntryTitle(entry),
    image: getUserEntryAvatar(entry),
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
      profile1.accessHash = profile2.accessHash ?? profile1.accessHash;
      profile1.username = profile2.username ?? profile1.username;
      profile1.botChatId = profile2.botChatId ?? profile1.botChatId;
      profile1.type = profile2.type ?? profile1.type;
      profile1.avatar = profile2.avatar ?? profile1.avatar;
      profile1.name = profile2.name ?? profile1.name;
      profile1.deleted = profile2.deleted ?? profile1.deleted;
      profile1.updated = profile2.updated ?? profile1.updated;
    } else {
      result.push(profile2);
    }
  }

  return result.length > 0 ? result : undefined;
}

export function isUserProfileUpdatable(profile: UserProfile): boolean {
  if (profile.deleted) {
    return false;
  }

  if (!profile.updated) {
    return true;
  }

  const daysSinceLastUpdate = getDaysPassed(profile.updated);

  return daysSinceLastUpdate >= 28;
}

export function isUserProfileFollowing(profile: UserProfile) {
  const lastFollowedTime = Math.max(...asArray(profile.followed).map((date) => date.getTime()));
  const lastUnfollowedTime = Math.max(...asArray(profile.unfollowed).map((date) => date.getTime()));

  return (lastFollowedTime && !lastUnfollowedTime) || lastFollowedTime > lastUnfollowedTime;
}

export function setUserProfileFollowing(profile: UserProfile, value: boolean | Date) {
  const oldValue = isUserProfileFollowing(profile);

  if (oldValue === Boolean(value)) {
    return;
  }

  if (value) {
    const newValue = [...asArray(profile.followed), value instanceof Date ? value : new Date()];
    profile.followed = newValue.length > 1 ? newValue : newValue[0];
  } else {
    const newValue = [...asArray(profile.unfollowed), new Date()];
    profile.unfollowed = newValue.length > 1 ? newValue : newValue[0];
  }
}

export function isUserNameReadable(username: string) {
  return !USER_NAME_SKIP_AS_ID_REGEX.test(username);
}

export function cleanupUserTitle(title: string) {
  return stripHashtags(title)
    .split(/\s[\/\\•\|-]\s/)[0]
    ?.match(USER_TITLE_CLEANUP_REGEX)?.[0]
    ?.replaceAll(/\s+/g, ' ')
    ?.trim();
}
