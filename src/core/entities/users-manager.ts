import { textToId } from '../utils/common-utils.js';
import { ListManager, ListManagerPatch } from './list-manager.js';
import { mergeUserWith, User } from './user.js';

export const UsersManagerPatch = ListManagerPatch<User>(User);
export type UsersManagerPatch = ListManagerPatch<User>;

export abstract class UsersManager extends ListManager<User> {
  readonly name = 'users';

  readonly ItemSchema = User;

  protected async createItemId(item: User): Promise<string> {
    let baseId = textToId(item.name ?? '');
    if (!baseId) {
      baseId = textToId(Object.values(item.profiles || {})[0] ?? '');
    }

    let index = 2;
    let result = baseId;

    while (await this.getItem(result)) {
      result = `${baseId}-${index}`;
      index += 1;
    }

    return result;
  }

  protected mergeItemWith = mergeUserWith;
}
