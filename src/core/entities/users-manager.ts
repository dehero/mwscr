import { textToId } from '../utils/common-utils.js';
import type { ListReaderEntry } from './list-manager.js';
import { ListManager, ListManagerPatch } from './list-manager.js';
import { isUserEqual, mergeUserWith, User } from './user.js';

export const UsersManagerPatch = ListManagerPatch<User>(User);
export type UsersManagerPatch = ListManagerPatch<User>;

export abstract class UsersManager extends ListManager<User> {
  readonly name = 'users';

  readonly ItemSchema = User;

  async createItemId(item: User): Promise<string> {
    let baseId = textToId(item.name ?? '');
    if (!baseId) {
      baseId = textToId(Object.values(item.profiles || {})[0]?.username ?? '');
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
