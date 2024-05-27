import { createUserInfo } from '../../../core/entities/user.js';
import { inbox, published, trash } from '../../../local/data-managers/posts.js';
import { users } from '../../../local/data-managers/users.js';

export async function data() {
  const entries = await users.getAllEntries(true);
  return Promise.all(entries.map((entry) => createUserInfo(entry, published, inbox, trash)));
}
