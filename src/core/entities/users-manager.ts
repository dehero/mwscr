import { textToId } from '../utils/common-utils.js';
import type { ListReaderEntry } from './list-manager.js';
import { ListManager, ListManagerPatch } from './list-manager.js';
import type { UserProfile } from './user.js';
import { isUserEqual, isUserNameReadable, isUserProfileEqual, mergeUserWith, User } from './user.js';

export const UsersManagerPatch = ListManagerPatch<User>(User);
export type UsersManagerPatch = ListManagerPatch<User>;

export abstract class UsersManager extends ListManager<User> {
  readonly name = 'users';

  readonly ItemSchema = User;

  async createItemId(item: User): Promise<string> {
    let baseId;

    if (item.profiles) {
      for (const profile of item.profiles) {
        if (profile.username && isUserNameReadable(profile.username)) {
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

  async findOrAddItemByProfile(
    profile: UserProfile,
    fillProfile: (profile: UserProfile, isExisting: boolean) => void | Promise<void>,
  ): Promise<ListReaderEntry<User>> {
    for await (const entry of this.yieldAllEntries(true)) {
      const existingProfile = entry[1].profiles?.find((p) => isUserProfileEqual(p, profile));
      if (existingProfile) {
        await fillProfile(existingProfile, true);
        return entry;
      }
    }

    await fillProfile(profile, false);
    return this.addItem({ profiles: [profile] });
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
