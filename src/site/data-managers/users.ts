import { parseSchema } from '../../core/entities/schema.ts';
import type { User } from '../../core/entities/user.ts';
import { UsersManager, UsersManagerPatch } from '../../core/entities/users-manager.ts';
import { jsonDateReviver } from '../../core/utils/date-utils.ts';
import { setStorageItemWithEvent } from '../utils/storage-utils.ts';

export class SiteUsersManager extends UsersManager {
  constructor() {
    super();

    if (typeof window !== 'undefined') {
      this.readLocalStorage();
      window.addEventListener('storage', (event) => {
        if (event.key !== `${this.name}.patch`) {
          return;
        }
        this.clearCache();
      });
    }
  }

  readLocalStorage() {
    const data = localStorage.getItem(`${this.name}.patch`);
    if (!data) {
      return;
    }

    const patch = parseSchema(UsersManagerPatch, JSON.parse(data, jsonDateReviver));
    this.mergePatch(patch);
  }

  updateLocalStorage() {
    setStorageItemWithEvent(localStorage, `${this.name}.patch`, this.patch ? JSON.stringify(this.patch) : null);
  }

  mergePatch(patch: UsersManagerPatch) {
    super.mergePatch(patch);
    this.updateLocalStorage();
  }

  clearPatch() {
    super.clearPatch();
    this.updateLocalStorage();
  }

  protected async loadChunkData() {
    const data = await fetch('/data/users.json').then((r) => r.json());

    if (typeof data !== 'object' || data === null) {
      throw new TypeError('Users data must be an object');
    }

    return data as Record<string, User>;
  }

  protected async removeChunkData(chunkName: string) {
    throw new Error(`Cannot remove chunk data "${chunkName}" on site.`);
  }

  protected async saveChunkData(chunkName: string) {
    throw new Error(`Cannot save chunk data "${chunkName}" on site.`);
  }
}

export const users = new SiteUsersManager();
