import type { User } from '../../core/entities/user.js';
import { UsersManager } from '../../core/entities/users-manager.js';
import { loadYaml, saveYaml } from './utils/yaml.js';

export const USERS_FILENAME = 'data/users.yml';

class LocalUsersManager extends UsersManager {
  protected async loadChunkData() {
    const data = await loadYaml(USERS_FILENAME);

    if (typeof data !== 'object' || data === null) {
      throw new TypeError('Users data must be an object');
    }

    return Object.entries(data as Record<string, User>);
  }

  protected async saveChunk() {
    const data = Object.fromEntries(await this.getAllEntries());
    return saveYaml(USERS_FILENAME, data);
  }
}

export const users = new LocalUsersManager();
