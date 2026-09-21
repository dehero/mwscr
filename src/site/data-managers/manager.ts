import type { CommentInfo } from '../../core/entities/comment-info.ts';
import type { DataManagerArgs, DataSummary } from '../../core/entities/data-manager.ts';
import { DataManager } from '../../core/entities/data-manager.ts';
import type { LocationInfo } from '../../core/entities/location-info.ts';
import type { PostInfo } from '../../core/entities/post-info.ts';
import type { PostsManagerName } from '../../core/entities/posts-manager.ts';
import type { TagInfo } from '../../core/entities/tag-info.ts';
import type { TopicInfo } from '../../core/entities/topic-info.ts';
import type { UserInfo } from '../../core/entities/user-info.ts';
import { jsonDateReviver } from '../../core/utils/date-utils.ts';
import { locations } from './locations.ts';
import { postsManagers } from './posts.ts';
import { topics } from './topics.ts';
import { users } from './users.ts';

class SiteDataManager extends DataManager {
  constructor(args: DataManagerArgs) {
    super(args);

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => {
        this.clearCache();
      });
    }
  }

  async getAllCommentInfos(): Promise<CommentInfo[]> {
    if (this.patchSize > 0) {
      return super.getAllCommentInfos();
    }

    return this.createCache(this.getAllCommentInfos.name, async () => {
      const filename = '/data/comment-infos.json';

      try {
        const data = JSON.parse(await fetch(filename).then((r) => r.text()), jsonDateReviver) as unknown;

        if (!Array.isArray(data)) {
          throw new TypeError(`File "${filename}" expected to be the array of comment infos`);
        }

        return data;
      } catch (error) {
        throw new Error(`Failed to load "${filename}": ${error}`);
      }
    });
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

  async getSummary(): Promise<DataSummary> {
    if (this.patchSize > 0) {
      return super.getSummary();
    }

    return this.createCache(this.getSummary.name, async () => {
      const filename = '/data/summary.json';

      try {
        const data = JSON.parse(await fetch(filename).then((r) => r.text()), jsonDateReviver) as unknown;

        if (typeof data !== 'object' || data === null) {
          throw new TypeError(`File "${filename}" expected to be the home page data object`);
        }

        return data as DataSummary;
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
