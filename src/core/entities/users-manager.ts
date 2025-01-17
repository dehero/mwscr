import { textToId } from '../utils/common-utils.js';
import { ListManager } from './list-manager.js';
import type { User, UserPatch } from './user.js';
import { isUser, isUserEqual, mergeUserWith, patchUser } from './user.js';

export abstract class UsersManager extends ListManager<User, UserPatch> {
  readonly name = 'users';

  protected createItemId(item: User) {
    let result = textToId(item.name ?? '');
    if (!result) {
      result = textToId(Object.values(item.profiles || {})[0] ?? '');
    }

    return result;
  }

  protected isItemEqual = isUserEqual;

  protected mergeItemWith = mergeUserWith;

  protected patchItemWith = patchUser;

  isItem = isUser;
}
