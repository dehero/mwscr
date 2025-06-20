import { textToId } from '../utils/common-utils.js';
import type { ListReaderEntry } from './list-manager.js';
import { ListManager, ListManagerPatch } from './list-manager.js';
import { isUserEqual, mergeUserWith, User } from './user.js';

const SKIP_USERNAME_AS_ID_REGEX = /^(club|id)\d+$/;

export const UsersManagerPatch = ListManagerPatch<User>(User);
export type UsersManagerPatch = ListManagerPatch<User>;

export abstract class UsersManager extends ListManager<User> {
  readonly name = 'users';

  readonly ItemSchema = User;

  async createItemId(item: User): Promise<string> {
    let baseId;

    if (item.profiles) {
      for (const profile of item.profiles) {
        if (profile.username && !SKIP_USERNAME_AS_ID_REGEX.test(profile.username)) {
          baseId = textToId(profile.username);
          break;
        }
      }

      if (!baseId) {
        for (const profile of item.profiles) {
          if (profile.name) {
            baseId = textToId(profile.name);
            break;
          }
        }
      }
    }

    if (!baseId) {
      baseId = 'user';
    }

    let index = 2;
    let result = baseId;

    while (await this.getItem(result)) {
      result = `${baseId}-${index}`;
      index += 1;
    }

    return result;
  }

  async mergeOrAddItem(item: User): Promise<ListReaderEntry<User>> {
    const result = await this.findEntry((user) => isUserEqual(user, item));
    if (result) {
      this.mergeItemWith(result[1], item);
      return result;
    }

    return this.addItem(item);
  }

  protected mergeItemWith = mergeUserWith;
}
