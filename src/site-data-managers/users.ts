import users from '../../data/users.yml';
import type { User } from '../entities/user.js';

export function getUser(userId: string): User | undefined {
  return users[userId];
}

export function getUserName(userId: string) {
  return getUser(userId)?.name ?? userId;
}
