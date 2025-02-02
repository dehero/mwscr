import { DataManager } from '../../core/entities/data-manager.js';
import type { LocationInfo } from '../../core/entities/location-info.js';
import type { PostInfo } from '../../core/entities/post-info.js';
import type { PostsManagerName } from '../../core/entities/posts-manager.js';
import type { UserInfo } from '../../core/entities/user-info.js';
import { locations } from './locations.js';
import type { SitePostsManager } from './posts.js';
import { postsManagers } from './posts.js';
import { users } from './users.js';

class SiteDataManager extends DataManager<SitePostsManager> {
  async getAllLocationInfos(): Promise<LocationInfo[]> {
    return this.createCache(this.getAllLocationInfos.name, async () => {
      const filename = '/data/location-infos.json';

      try {
        const data = await fetch(filename).then((r) => r.json());

        if (!Array.isArray(data)) {
          throw new TypeError(`File "${filename}" expected to be the array of location infos`);
        }

        return data;
      } catch (error) {
        throw new Error(`Failed to load "${filename}": ${error}`);
      }
    });
  }

  async getAllPostInfos(managerName: PostsManagerName): Promise<PostInfo[]> {
    return this.createCache(`${this.getAllPostInfos.name}.${managerName}`, async () => {
      const filename = `/data/${managerName}/infos.json`;

      try {
        const data = await fetch(filename).then((r) => r.json());

        if (!Array.isArray(data)) {
          throw new TypeError(`File "${filename}" expected to be the array of post infos`);
        }

        return data;
      } catch (error) {
        throw new Error(`Failed to load "${filename}": ${error}`);
      }
    });
  }

  async getAllUserInfos(): Promise<UserInfo[]> {
    return this.createCache(this.getAllUserInfos.name, async () => {
      const filename = '/data/user-infos.json';

      try {
        const data = await fetch(filename).then((r) => r.json());

        if (!Array.isArray(data)) {
          throw new TypeError(`File "${filename}" expected to be the array of user infos`);
        }

        return data;
      } catch (error) {
        throw new Error(`Failed to load "${filename}": ${error}`);
      }
    });
  }
}

export const dataManager = new SiteDataManager({
  postsManagers,
  locations,
  users,
});
