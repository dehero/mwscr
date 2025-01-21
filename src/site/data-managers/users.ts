import { parseSchema } from '../../core/entities/schema.js';
import type { User } from '../../core/entities/user.js';
import { UsersManager, UsersManagerPatch } from '../../core/entities/users-manager.js';
import { jsonDateReviver } from '../../core/utils/date-utils.js';
import { setStorageItemWithEvent } from '../utils/storage-utils.js';

export class SiteUsersManager extends UsersManager {
  constructor() {
    super();

    if (typeof window !== 'undefined') {
      this.readLocalStorage();
      window.addEventListener('storage', () => {
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
    this.mergeLocalPatch(patch);
  }

  updateLocalStorage() {
    const localPatch = this.getLocalPatch();
    setStorageItemWithEvent(localStorage, `${this.name}.patch`, localPatch ? JSON.stringify(localPatch) : null);
  }

  mergeLocalPatch(patch: Partial<UsersManagerPatch>) {
    super.mergeLocalPatch(patch);
    this.updateLocalStorage();
  }

  clearLocalPatch() {
    super.clearLocalPatch();
    this.updateLocalStorage();
  }

  protected async loadChunkData() {
    const data = await fetch('/data/users.json').then((r) => r.json());

    if (typeof data !== 'object' || data === null) {
      throw new TypeError('Users data must be an object');
    }

    return Object.entries(data as Record<string, User>);
  }

  protected async saveChunk(chunkName: string) {
    console.log('Saving chunk', chunkName);
  }
}

export const users = new SiteUsersManager();
