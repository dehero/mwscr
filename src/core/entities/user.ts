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

export function getUserEntryName(entry: [string, User | undefined, ...unknown[]]) {
  return entry[1]?.name || entry[0];
}
