export type UserRoleId = 'admin' | 'author' | 'requester' | 'drawer' | 'beginner';

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

export type ReadonlyUsers = ReadonlyMap<string, User>;

export function mergeUserWith(user: User, withUser: User) {
  user.name = user.name || withUser.name || undefined;
  user.nameRu = user.nameRu || withUser.nameRu || undefined;
  user.nameRuFrom = user.nameRuFrom || withUser.nameRuFrom || undefined;
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
