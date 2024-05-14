import type { DataReaderChunk } from '../../core/entities/data-manager.js';
import type { User } from '../../core/entities/user.js';
import { UsersManager } from '../../core/entities/users-manager.js';
import { loadYaml, saveYaml } from './utils/yaml.js';

export const USERS_FILENAME = 'data/users.yml';

class LocalUsersManager extends UsersManager {
  private cache: DataReaderChunk<User> | undefined;

  getChunkNames = async () => [USERS_FILENAME];

  getItemChunkName = () => USERS_FILENAME;

  protected async loadChunk(chunkName: string) {
    const currentCachedUsers = this.cache;
    if (currentCachedUsers) {
      return currentCachedUsers;
    }

    try {
      const entries = Object.entries((await loadYaml(chunkName)) as object);

      if (!this.cache) {
        this.cache = new Map(entries);
      }

      return this.cache;
    } catch (error) {
      const message = error instanceof Error ? error.message : error;
      throw new Error(`Error loading users: ${message}`);
    }
  }

  protected async saveChunk(chunkName: string) {
    if (!this.cache) {
      return;
    }

    const data = Object.fromEntries(this.cache.entries());
    return saveYaml(chunkName, data);
  }
}

export const users = new LocalUsersManager();
