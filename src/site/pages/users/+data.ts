import { createUserInfo } from '../../../core/entities/user.js';
import { inbox, published, trash } from '../../../local/data-managers/posts.js';
import { users } from '../../../local/data-managers/users.js';
import type { UsersPageData } from '../../components/UsersPage/UsersPage.js';

export async function data(): Promise<UsersPageData> {
  const entries = await users.getAllEntries(true);
  const userInfos = await Promise.all(entries.map((entry) => createUserInfo(entry, published, inbox, trash)));

  return {
    userInfos,
  };
}
