import { ListManager } from './list-manager.js';
import type { User, UserProfiles } from './user.js';

export abstract class UsersManager extends ListManager<User> {
  readonly name = 'users';

  protected createItemId(item: User) {
    const str = item.name || Object.values(item.profiles || {})[0];

    return str
      ?.toLowerCase()
      .replace("'", '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-/g, '')
      .replace(/-$/g, '');
  }

  protected isItemEqual(a: User, b: User) {
    return Boolean(
      (a.admin && a.admin === b.admin) ||
        (a.name && a.name === b.name) ||
        (a.nameRu && a.nameRu === b.nameRu) ||
        (a.nameRuFrom && a.nameRuFrom === b.nameRuFrom) ||
        (a.telegramBotChatId && a.telegramBotChatId === b.telegramBotChatId) ||
        (a.profiles &&
          Object.entries(a.profiles).some(
            ([service, profile]) => profile === b.profiles?.[service as keyof UserProfiles],
          )),
    );
  }

  protected mergeItemWith(item: User, withItem: User) {
    item.name = item.name || withItem.name || undefined;
    item.nameRu = item.nameRu || withItem.nameRu || undefined;
    item.nameRuFrom = item.nameRuFrom || withItem.nameRuFrom || undefined;
    item.telegramBotChatId = item.telegramBotChatId || withItem.telegramBotChatId || undefined;
    item.profiles = this.mergeUserProfiles(item.profiles, withItem.profiles);
  }

  protected mergeUserProfiles(
    profiles1: UserProfiles | undefined,
    profiles2: UserProfiles | undefined,
  ): UserProfiles | undefined {
    if (!profiles1) {
      return profiles2;
    }
    if (!profiles2) {
      return profiles1;
    }
    const result = { ...profiles1 };
    for (const name in profiles2) {
      const key = name as keyof UserProfiles;
      const value = result[key] || profiles2[key];
      if (value) {
        result[key] = value;
      } else {
        delete result[key];
      }
    }
    return result;
  }
}
