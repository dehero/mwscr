import type { User } from '../../core/entities/user.js';
import { UsersManager } from '../../core/entities/users-manager.js';

class SiteUsersManager extends UsersManager {
  protected async loadChunkData() {
    const { default: data } = await import('../../../data/users.yml');

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
