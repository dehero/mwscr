import { asArray } from '../utils/common-utils.js';
import type { DataPatch } from './data-patch.js';
import { isNestedLocation } from './location.js';
import type { LocationInfo } from './location-info.js';
import { createLocationInfos } from './location-info.js';
import type { LocationsReader } from './locations-reader.js';
import type { PostLocation } from './post.js';
import type { PostInfo, PostInfoSelection, SelectPostInfosParams } from './post-info.js';
import { createPostInfos, selectPostInfos } from './post-info.js';
import type { PostsManager, PostsManagerName } from './posts-manager.js';
import type { TagInfo } from './tag-info.js';
import { createTagInfos } from './tag-info.js';
import type { TopicInfo } from './topic-info.js';
import { createTopicInfos } from './topic-info.js';
import type { TopicsReader } from './topics-reader.js';
import type { SelectUserInfosParams, UserInfo } from './user-info.js';
import { createUserInfos, selectUserInfos } from './user-info.js';
import type { UsersManager } from './users-manager.js';

export interface DataManagerArgs {
  postsManagers: PostsManager[];
  locations: LocationsReader;
  users: UsersManager;
  topics: TopicsReader;
}

export class DataManager {
  readonly postsManagers: PostsManager[];
  readonly locations: LocationsReader;
  readonly users: UsersManager;
  readonly topics: TopicsReader;

  protected cache: Record<string, unknown> = {};

  protected async createCache<T>(key: string, creator: () => Promise<T>): Promise<T> {
    if (!this.cache[key]) {
      this.cache[key] = creator();
    }
    return this.cache[key] as T;
  }

  protected clearCache() {
    this.cache = {};
  }

  constructor(args: DataManagerArgs) {
    this.postsManagers = args.postsManagers;
    this.locations = args.locations;
    this.users = args.users;
    this.topics = args.topics;
  }

  getPatch(): DataPatch {
    const patch: DataPatch = {};

    for (const manager of this.postsManagers) {
      const managerPatch = manager.patch;
      patch[manager.name] = managerPatch;
    }

    patch.users = this.users.patch;

    return patch;
  }

  mergePatch(patch: DataPatch) {
    for (const manager of this.postsManagers) {
      const managerPatch = patch[manager.name];
      if (managerPatch) {
        manager.mergePatch(managerPatch);
      }
    }
    if (patch.users) {
      this.users.mergePatch(patch.users);
    }
  }

  get patchSize() {
    return this.postsManagers.reduce((acc, postManager) => acc + postManager.patchSize, 0) + this.users.patchSize;
  }

  clearPatch() {
    for (const manager of this.postsManagers) {
      manager.clearPatch();
    }
    this.users.clearPatch();
  }

  async save() {
    for (const manager of this.postsManagers) {
      await manager.save();
    }
    await this.users.save();
  }

  async findWorldMapLocationInfo(location: PostLocation): Promise<LocationInfo | undefined> {
    const allLocationInfos = (await this.getAllLocationInfos())
      .filter((info) => info.cell)
      .sort((a, b) => b.title.length - a.title.length);
    const locationInfos = (await this.getLocationInfos(location)) ?? [];

    if (locationInfos.length === 0) {
      return undefined;
    }

    for (const locationInfo of locationInfos) {
      if (!locationInfo.cell) {
        const result = allLocationInfos.find((info) => isNestedLocation(locationInfo.title, info.title));
        if (result) {
          return result;
        }
      } else {
        return locationInfo;
      }
    }

    return undefined;
  }

  findPostsManager(managerName: string): PostsManager | undefined {
    return this.postsManagers.find((manager) => manager.name === managerName);
  }

  async getAllPostInfos(managerName: PostsManagerName): Promise<PostInfo[]> {
    return this.createCache(`${this.getAllPostInfos.name}.${managerName}`, () => createPostInfos(managerName, this));
  }

  async getAllLocationInfos(): Promise<LocationInfo[]> {
    return this.createCache(this.getAllLocationInfos.name, () => createLocationInfos(this));
  }

  async getAllTagInfos(): Promise<TagInfo[]> {
    return this.createCache(this.getAllTagInfos.name, () => createTagInfos(this));
  }

  async getAllUserInfos(): Promise<UserInfo[]> {
    return this.createCache(this.getAllUserInfos.name, () => createUserInfos(this));
  }

  async getAllTopicInfos(): Promise<TopicInfo[]> {
    return this.createCache(this.getAllTopicInfos.name, () => createTopicInfos(this));
  }

  async getLocationInfos(id: string | string[]): Promise<LocationInfo[] | undefined> {
    const ids = new Set(asArray(id));

    if (ids.size === 0) {
      return undefined;
    }

    return (await this.getAllLocationInfos()).filter((info) => ids.has(info.title));
  }

  async getLocationInfo(id: string) {
    return (await this.getAllLocationInfos()).find((info) => info.title === id);
  }

  async getPostInfo(managerName: PostsManagerName, id: string) {
    return (await this.getAllPostInfos(managerName)).find((info) => info.id === id);
  }

  async getTagInfos(id: string | string[]): Promise<TagInfo[] | undefined> {
    const ids = new Set(asArray(id));

    if (ids.size === 0) {
      return undefined;
    }

    return (await this.getAllTagInfos()).filter((info) => ids.has(info.id));
  }

  async getUserInfos(id: string | string[]): Promise<UserInfo[] | undefined> {
    const ids = new Set(asArray(id));

    if (ids.size === 0) {
      return undefined;
    }

    const infos = new Map(
      (await this.getAllUserInfos()).filter((info) => ids.has(info.id)).map((info) => [info.id, info]),
    );

    return [...ids].map((id) => infos.get(id)).filter((info): info is UserInfo => typeof info !== 'undefined');
  }

  async getTopicInfos(id: string | string[]): Promise<TopicInfo[] | undefined> {
    const ids = new Set(asArray(id));

    if (ids.size === 0) {
      return undefined;
    }

    const infos = new Map(
      (await this.getAllTopicInfos()).filter((info) => ids.has(info.id)).map((info) => [info.id, info]),
    );

    return [...ids].map((id) => infos.get(id)).filter((info): info is TopicInfo => typeof info !== 'undefined');
  }

  async getUserInfo(id: string) {
    return (await this.getAllUserInfos()).find((info) => info.id === id);
  }

  async selectPostInfo(
    managerName: PostsManagerName,
    params: SelectPostInfosParams,
  ): Promise<PostInfoSelection | undefined> {
    const result = await this.selectPostInfos(managerName, params, 1);

    return result.totalCount > 0 ? result : undefined;
  }

  async selectPostInfos(
    managerName: PostsManagerName,
    params: SelectPostInfosParams,
    limit?: number,
  ): Promise<PostInfoSelection> {
    const postInfos = await this.getAllPostInfos(managerName);

    return selectPostInfos(postInfos, params, limit);
  }

  async selectUserInfos(params: SelectUserInfosParams, limit?: number) {
    const userInfos = await this.getAllUserInfos();

    return selectUserInfos(userInfos, params, limit);
  }
}
