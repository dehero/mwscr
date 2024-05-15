import type { User } from '../../core/entities/user.js';
import { UsersManager } from '../../core/entities/users-manager.js';

class SiteUsersManager extends UsersManager {
  getChunkNames = async () => [''];

  getItemChunkName = () => '';

  protected async loadChunk() {
    const { default: data } = await import('../../../data/users.yml');

    return new Map(Object.entries(data as Record<string, User>));
  }

  protected async saveChunk(chunkName: string) {
    console.log('Saving chunk', chunkName);
  }
}

export const users = new SiteUsersManager();
