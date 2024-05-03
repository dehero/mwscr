import users from '../../../data/users.yml';
import type { User } from '../../core/entities/user.js';

export function getUser(userId: string): User | undefined {
  if (typeof users !== 'object' || Array.isArray(users)) {
    return undefined;
  }
  return users[userId] as User | undefined;
}

export function getUserName(userId: string) {
  return getUser(userId)?.name ?? userId;
}
