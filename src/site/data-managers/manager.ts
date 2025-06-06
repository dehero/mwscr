import type { DataManagerArgs } from '../../core/entities/data-manager.js';
import { DataManager } from '../../core/entities/data-manager.js';
import type { LocationInfo } from '../../core/entities/location-info.js';
import type { PostInfo } from '../../core/entities/post-info.js';
import type { PostsManagerName } from '../../core/entities/posts-manager.js';
import type { TagInfo } from '../../core/entities/tag-info.js';
import type { TopicInfo } from '../../core/entities/topic-info.js';
import type { UserInfo } from '../../core/entities/user-info.js';
import { jsonDateReviver } from '../../core/utils/date-utils.js';
import { locations } from './locations.js';
import { postsManagers } from './posts.js';
import { topics } from './topics.js';
import { users } from './users.js';

class SiteDataManager extends DataManager {
  constructor(args: DataManagerArgs) {
    super(args);

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => {
        this.clearCache();
      });
    }
  }

  async getAllLocationInfos(): Promise<LocationInfo[]> {
    if (this.patchSize > 0) {
      return super.getAllLocationInfos();
    }

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
    const manager = this.findPostsManager(managerName);
    if (manager && manager.patchSize > 0) {
      return super.getAllPostInfos(managerName);
    }

    return this.createCache(`${this.getAllPostInfos.name}.${managerName}`, async () => {
      const filename = `/data/${managerName}/infos.json`;

      try {
        const data = JSON.parse(await fetch(filename).then((r) => r.text()), jsonDateReviver) as unknown;

        if (!Array.isArray(data)) {
          throw new TypeError(`File "${filename}" expected to be the array of post infos`);
        }

        return data;
      } catch (error) {
        throw new Error(`Failed to load "${filename}": ${error}`);
      }
    });
  }

  async getAllTagInfos(): Promise<TagInfo[]> {
    if (this.patchSize > 0) {
      return super.getAllTagInfos();
    }

    return this.createCache(this.getAllTagInfos.name, async () => {
      const filename = '/data/tag-infos.json';

      try {
        const data = await fetch(filename).then((r) => r.json());

        if (!Array.isArray(data)) {
          throw new TypeError(`File "${filename}" expected to be the array of tag infos`);
        }

        return data;
      } catch (error) {
        throw new Error(`Failed to load "${filename}": ${error}`);
      }
    });
  }

  async getAllUserInfos(): Promise<UserInfo[]> {
    if (this.patchSize > 0) {
      return super.getAllUserInfos();
    }

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

  async getAllTopicInfos(): Promise<TopicInfo[]> {
    return this.createCache(this.getAllTopicInfos.name, async () => {
      const filename = '/data/topics/infos.json';

      try {
        const data = await fetch(filename).then((r) => r.json());

        if (!Array.isArray(data)) {
          throw new TypeError(`File "${filename}" expected to be the array of topic infos`);
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
  topics,
});
