import { textToId } from '../utils/common-utils.js';
import { ListManager, ListManagerPatch } from './list-manager.js';
import { isUserEqual, mergeUserWith, User } from './user.js';

export const UsersManagerPatch = ListManagerPatch<User>(User);
export type UsersManagerPatch = ListManagerPatch<User>;

export abstract class UsersManager extends ListManager<User> {
  readonly name = 'users';

  readonly ItemSchema = User;

  protected createItemId(item: User) {
    let result = textToId(item.name ?? '');
    if (!result) {
      result = textToId(Object.values(item.profiles || {})[0] ?? '');
    }

    return result;
  }

  protected isItemEqual = isUserEqual;

  protected mergeItemWith = mergeUserWith;
}
